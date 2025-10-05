# Reviewed for final cleanup
from django.db import models
from django.core.exceptions import ValidationError
from django.core.cache import cache
import datetime
import json
import re

DEFAULT_DIGIT_GROUPS = (2, 2, 3)
DEFAULT_SEPARATORS = ("-", "-")


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

        if len(self.separators) != max(len(self.digit_groups) - 1, 0):
            raise ValidationError(
                {
                    "separators": (
                        "Separators count must be exactly one less than the number of digit groups."
                    )
                }
            )

        allowed_separators = {"-", "+"}
        for separator in self.separators:
            if separator not in allowed_separators:
                raise ValidationError(
                    {
                        "separators": "Only '-' and '+' separators are supported.",
                    }
                )

        pattern_length = sum(self.digit_groups) + len(self.separators)
        if pattern_length > 15:
            raise ValidationError(
                {
                    "digit_groups": (
                        "Total formatted length (digits + separators) cannot exceed 15 characters."
                    )
                }
            )

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(
            singleton_enforcer=True,
            defaults={
                "digit_groups": list(DEFAULT_DIGIT_GROUPS),
                "separators": list(DEFAULT_SEPARATORS),
            },
        )
        if created:
            cache.delete("registration_number_format")
        return obj

    @property
    def total_digits(self):
        return sum(self.digit_groups)

    @property
    def formatted_length(self):
        return self.total_digits + len(self.separators)

    def as_dict(self):
        return {
            "digit_groups": list(self.digit_groups),
            "separators": list(self.separators),
            "total_digits": self.total_digits,
            "formatted_length": self.formatted_length,
        }

    def build_pattern(self):
        pattern = r"^"
        groups = list(self.digit_groups)
        separators = list(self.separators)
        for index, group_size in enumerate(groups):
            pattern += rf"\d{{{group_size}}}"
            if index < len(separators):
                pattern += re.escape(separators[index])
        pattern += r"$"
        return pattern

    def format_value(self, numeric_value: int) -> str:
        padded = f"{int(numeric_value):0{self.total_digits}d}"
        formatted = padded[: self.digit_groups[0]]
        offset = self.digit_groups[0]
        for index, group_size in enumerate(self.digit_groups[1:]):
            formatted += self.separators[index]
            formatted += padded[offset : offset + group_size]
            offset += group_size
        return formatted

    def __str__(self):
        return json.dumps(self.as_dict())


def get_registration_number_format(force_reload: bool = False):
    cache_key = "registration_number_format"
    if force_reload:
        cache.delete(cache_key)

    data = cache.get(cache_key)
    if data:
        return data

    format_instance = RegistrationNumberFormat.load()
    payload = {
        **format_instance.as_dict(),
        "pattern": format_instance.build_pattern(),
    }
    cache.set(cache_key, payload)
    return payload


def validate_registration_number_format(value):
    """Validate that registration number matches the configured format."""
    format_config = get_registration_number_format()
    pattern = format_config["pattern"]
    if not re.match(pattern, value):
        raise ValidationError(
            "Registration number does not match the configured format."
        )


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

    if max_numeric_value > (10 ** format_instance.total_digits) - 1:
        raise ValidationError(
            {
                "digit_groups": (
                    "Existing registration numbers exceed the new format's capacity."
                )
            }
        )


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
            Patient.objects.filter(pk=old_registration).update(
                registration_number=new_value
            )


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
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="WAITING",
    )
    patient = models.ForeignKey(
        "Patient",
        on_delete=models.CASCADE,
        related_name="visits",
    )
    queue = models.ForeignKey(
        "Queue",
        on_delete=models.CASCADE,
        related_name="visits",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Update unique_together to include queue
        # The old unique_together ('token_number', 'visit_date')
        # will be removed by makemigrations.
        unique_together = ("token_number", "visit_date", "queue")
        ordering = ["visit_date", "queue", "token_number"]

    def __str__(self):
        """Readable representation shown in admin and logs."""
        return f"Token {self.token_number} - {self.patient.name} ({self.visit_date})"


class Patient(models.Model):
    # Using CharField with custom format based on configuration
    registration_number = models.CharField(
        max_length=15,
        primary_key=True,
        unique=True,
        validators=[validate_registration_number_format],
    )
    name = models.CharField(max_length=255)
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
    )  # Assuming phone is optional
    gender = models.CharField(
        max_length=10,
        choices=Visit.PATIENT_GENDER_CHOICES,  # Reusing choices from Visit
        default="OTHER",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def generate_next_registration_number(cls):
        """Generate the next registration number based on configured format."""
        format_instance = RegistrationNumberFormat.load()
        total_digits = format_instance.total_digits

        last_patient = cls.objects.order_by("-registration_number").first()

        if not last_patient:
            if len(format_instance.digit_groups) == 1:
                next_number = 1
            else:
                trailing_digits = sum(format_instance.digit_groups[1:])
                next_number = (10 ** trailing_digits) + 1
        else:
            numeric_part = re.sub(r"\D", "", last_patient.registration_number)
            next_number = int(numeric_part) + 1

        max_number = (10 ** total_digits) - 1
        if next_number > max_number:
            raise ValidationError("No more registration numbers available for the configured format.")

        return format_instance.format_value(next_number)

    def save(self, *args, **kwargs):
        from django.db import transaction
        
        # Auto-generate registration number if not provided
        if not self.registration_number:
            # Use transaction to ensure atomicity when generating registration number
            with transaction.atomic():
                self.registration_number = self.generate_next_registration_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} (ID: {self.registration_number})"

    class Meta:
        indexes = [
            models.Index(fields=["phone"]),
            # registration_number is already indexed as it's a primary key.
            # Adding an explicit index for name if frequent partial searches
            # are expected.
            models.Index(fields=["name"]),
        ]


class Queue(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class PrescriptionImage(models.Model):
    """Stores a reference to a prescription image for a visit."""

    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, related_name="prescription_images")
    drive_file_id = models.CharField(max_length=255, blank=True)
    image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prescription for visit {self.visit_id}"
