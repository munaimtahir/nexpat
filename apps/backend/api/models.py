"""Database models and registration number formatting utilities."""

from __future__ import annotations

import datetime
import json
import re
from typing import List

from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import models, transaction

DEFAULT_DIGIT_GROUPS: List[int] = [3, 2, 3]
DEFAULT_SEPARATORS: List[str] = ["-", "-"]
MAX_TOTAL_DIGITS = 15
MAX_FORMATTED_LENGTH = 24


class RegistrationNumberFormat(models.Model):
    """Singleton model storing the patient registration number format."""

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

        try:
            digit_groups = [int(value) for value in self.digit_groups]
        except (TypeError, ValueError) as exc:  # pragma: no cover - defensive
            raise ValidationError({"digit_groups": "Digit groups must be positive integers."}) from exc

        if any(value <= 0 for value in digit_groups):
            raise ValidationError({"digit_groups": "Digit groups must be positive integers."})

        total_digits = sum(digit_groups)
        if total_digits > MAX_TOTAL_DIGITS:
            raise ValidationError({"digit_groups": f"Total digits cannot exceed {MAX_TOTAL_DIGITS}."})

        if not isinstance(self.separators, list):
            raise ValidationError({"separators": "Separators must be a list."})

        if len(self.separators) != max(len(digit_groups) - 1, 0):
            raise ValidationError(
                {
                    "separators": (
                        "Separators count must be exactly one less than the number of digit groups."
                    )
                }
            )

        for separator in self.separators:
            if not isinstance(separator, str) or separator == "":
                raise ValidationError({"separators": "Separators must be non-empty strings."})

        formatted_length = total_digits + sum(len(separator) for separator in self.separators)
        if formatted_length > MAX_FORMATTED_LENGTH:
            raise ValidationError(
                {
                    "digit_groups": (
                        "Formatted length (digits + separators) cannot exceed "
                        f"{MAX_FORMATTED_LENGTH} characters."
                    )
                }
            )

        # Normalise values so we store integers and strings exactly as expected.
        self.digit_groups = digit_groups
        self.separators = [str(separator) for separator in self.separators]

    @classmethod
    def load(cls) -> "RegistrationNumberFormat":
        obj, _ = cls.objects.get_or_create(
            singleton_enforcer=True,
            defaults={
                "digit_groups": list(DEFAULT_DIGIT_GROUPS),
                "separators": list(DEFAULT_SEPARATORS),
            },
        )
        return obj

    @property
    def total_digits(self) -> int:
        return sum(self.digit_groups)

    @property
    def formatted_length(self) -> int:
        return self.total_digits + sum(len(separator) for separator in self.separators)

    def as_dict(self) -> dict:
        return {
            "digit_groups": list(self.digit_groups),
            "separators": list(self.separators),
            "total_digits": self.total_digits,
            "formatted_length": self.formatted_length,
        }

    def build_pattern(self) -> str:
        pattern = "^"
        for index, group_size in enumerate(self.digit_groups):
            pattern += rf"\d{{{group_size}}}"
            if index < len(self.separators):
                pattern += re.escape(self.separators[index])
        pattern += "$"
        return pattern

    def build_example(self) -> str:
        counter = 1
        segments = []
        for group_size in self.digit_groups:
            segment_digits = []
            for offset in range(group_size):
                segment_digits.append(str((counter + offset) % 10))
            segments.append("".join(segment_digits))
            counter += group_size

        formatted = segments[0]
        for index, segment in enumerate(segments[1:]):
            formatted += self.separators[index]
            formatted += segment
        return formatted

    def format_value(self, numeric_value: int) -> str:
        padded = f"{int(numeric_value):0{self.total_digits}d}"
        formatted = padded[: self.digit_groups[0]]
        offset = self.digit_groups[0]
        for index, group_size in enumerate(self.digit_groups[1:]):
            formatted += self.separators[index]
            formatted += padded[offset : offset + group_size]
            offset += group_size
        return formatted

    def __str__(self) -> str:  # pragma: no cover - debugging helper
        return json.dumps(self.as_dict())


def _cache_payload(format_instance: RegistrationNumberFormat) -> dict:
    payload = {
        **format_instance.as_dict(),
        "pattern": format_instance.build_pattern(),
        "example": format_instance.build_example(),
    }
    return payload


def get_registration_number_format(force_reload: bool = False) -> dict:
    cache_key = "registration_number_format"
    if force_reload:
        cache.delete(cache_key)

    cached = cache.get(cache_key)
    if cached:
        return cached

    format_instance = RegistrationNumberFormat.load()
    payload = _cache_payload(format_instance)
    cache.set(cache_key, payload)
    return payload


def validate_registration_number_format(value: str) -> None:
    """Validate that *value* matches the currently configured registration format."""

    if value is None:
        raise ValidationError("Registration number is required.")

    format_config = get_registration_number_format()
    pattern = format_config["pattern"]
    if not re.fullmatch(pattern, value):
        raise ValidationError("Registration number does not match the configured format.")


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
                next_numeric = (10**trailing_digits) + 1

            max_numeric = (10**format_instance.total_digits) - 1
            if next_numeric > max_numeric:
                raise ValidationError(
                    "No more registration numbers available for the configured format."
                )

            return format_instance.format_value(next_numeric)

    def save(self, *args, **kwargs):
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
