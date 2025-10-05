"""Database models and registration number formatting utilities."""

from __future__ import annotations

import datetime
import json
import re

DEFAULT_DIGIT_GROUPS = [2, 2, 3]
DEFAULT_SEPARATORS = ["-", "-"]


class RegistrationNumberFormat(models.Model):
    """Singleton model storing the registration number formatting rules."""

    singleton_enforcer = models.BooleanField(default=True, editable=False, unique=True)
    digit_groups = models.JSONField(default=list)
    separators = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def clean(self):
        super().clean()
        if not isinstance(self.digit_groups, list) or not self.digit_groups:
            raise ValidationError({"digit_groups": "At least one digit group is required."})

        if not all(isinstance(value, int) and value > 0 for value in self.digit_groups):
            raise ValidationError({"digit_groups": "Digit groups must be positive integers."})

        if sum(self.digit_groups) > 15:
            raise ValidationError({"digit_groups": "Total digits cannot exceed 15."})

        if not isinstance(self.separators, list):
            raise ValidationError({"separators": "Separators must be a list."})

from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import models, transaction


def validate_registration_number_format(value):
    """Validate that registration number matches the configured format."""
    format_config = get_registration_number_format()
    pattern = format_config["pattern"]
    if not re.match(pattern, value):
        raise ValidationError("Registration number does not match the configured format.")


def ensure_format_can_fit_existing_patients(format_instance: RegistrationNumberFormat):
    max_digits_required = 0
    max_numeric_value = 0

    for registration_number in Patient.objects.values_list("registration_number", flat=True):
        if registration_number is None:
            continue
        digits = re.sub(r"\D", "", str(registration_number))
        if not digits:
            continue
        max_digits_required = max(max_digits_required, len(digits))
        numeric_value = int(digits)
        max_numeric_value = max(max_numeric_value, numeric_value)

    if max_digits_required > format_instance.total_digits:
        raise ValidationError(
            {
                "digit_groups": (
                    "Existing registration numbers require at least "
                    f"{max_digits_required} digits."
                )
            }
        )

    if max_numeric_value > (10**format_instance.total_digits) - 1:
        raise ValidationError(
            {"digit_groups": ("Existing registration numbers exceed the new format's capacity.")}
        )

    if value is None:
        raise ValidationError("Registration number is required.")

def reformat_patients_to_format(format_instance: RegistrationNumberFormat):
    from django.db import transaction

    with transaction.atomic():
        for patient in Patient.objects.order_by("registration_number").select_for_update():
            old_registration = patient.registration_number or ""
            digits = re.sub(r"\D", "", old_registration)
            if not digits:
                continue
            numeric_value = int(digits)
            new_value = format_instance.format_value(numeric_value)
            if new_value == old_registration:
                continue
            Visit.objects.filter(patient_id=old_registration).update(patient_id=new_value)
            Patient.objects.filter(pk=old_registration).update(registration_number=new_value)


class Visit(models.Model):
    PATIENT_GENDER_CHOICES = [
        ("MALE", "Male"),
        ("FEMALE", "Female"),
        ("OTHER", "Other"),
    ]

    STATUS_CHOICES = [
        ("WAITING", "Waiting"),
        ("START", "Start"),
        ("IN_ROOM", "In Room"),
        ("DONE", "Done"),
    ]

    token_number = models.IntegerField()
    visit_date = models.DateField(default=datetime.date.today)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="WAITING")
    patient = models.ForeignKey("Patient", on_delete=models.CASCADE, related_name="visits")
    queue = models.ForeignKey("Queue", on_delete=models.CASCADE, related_name="visits")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("token_number", "visit_date", "queue")
        ordering = ["visit_date", "queue", "token_number"]

    def __str__(self) -> str:  # pragma: no cover - debugging helper
        return f"Token {self.token_number} - {self.patient.name} ({self.visit_date})"


class Patient(models.Model):
    registration_number = models.CharField(
        max_length=MAX_FORMATTED_LENGTH,
        primary_key=True,
        unique=True,
        validators=[validate_registration_number_format],
    )
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    gender = models.CharField(
        max_length=10,
        choices=Visit.PATIENT_GENDER_CHOICES,
        default="OTHER",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @staticmethod
    def _extract_numeric(value: str) -> int:
        digits = re.sub(r"\D", "", str(value))
        return int(digits) if digits else 0

    @classmethod
    def generate_next_registration_number(cls) -> str:
        format_instance = RegistrationNumberFormat.load()

        with transaction.atomic():
            last_patient = cls.objects.select_for_update().order_by("-registration_number").first()
            if last_patient:
                next_numeric = cls._extract_numeric(last_patient.registration_number) + 1
            elif len(format_instance.digit_groups) == 1:
                next_numeric = 1
            else:
                trailing_digits = sum(format_instance.digit_groups[1:])
                next_number = (10**trailing_digits) + 1
        else:
            numeric_part = re.sub(r"\D", "", last_patient.registration_number)
            next_number = int(numeric_part) + 1

        max_number = (10**total_digits) - 1
        if next_number > max_number:
            raise ValidationError(
                "No more registration numbers available for the configured format."
            )

            return format_instance.format_value(next_numeric)

    def save(self, *args, **kwargs):
        from django.db import transaction

        # Auto-generate registration number if not provided
        if not self.registration_number:
            self.registration_number = self.generate_next_registration_number()
        super().save(*args, **kwargs)

    def __str__(self) -> str:  # pragma: no cover - debugging helper
        return f"{self.name} (ID: {self.registration_number})"

    class Meta:
        indexes = [
            models.Index(fields=["phone"]),
            models.Index(fields=["name"]),
        ]


class Queue(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:  # pragma: no cover - debugging helper
        return self.name


class PrescriptionImage(models.Model):
    """Stores references to prescription images uploaded for a visit."""

    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, related_name="prescription_images")
    drive_file_id = models.CharField(max_length=255, blank=True)
    image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:  # pragma: no cover - debugging helper
        return f"Prescription for visit {self.visit_id}"
