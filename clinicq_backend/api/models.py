# Reviewed for final cleanup
from django.db import models
from django.core.exceptions import ValidationError
import datetime
import re


def validate_registration_number_format(value):
    """Validate that registration number follows xx-xx-xxx format"""
    if not re.match(r"^\d{2}-\d{2}-\d{3}$", value):
        raise ValidationError(
            "Registration number must be in format xx-xx-xxx (e.g., 01-23-456)"
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
    # Using CharField with custom format xx-xx-xxx for registration_number
    # to ensure proper formatting and uniqueness
    registration_number = models.CharField(
        max_length=8,
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
        """Generate the next registration number in xx-xx-xxx format"""
        # Get the highest existing registration number
        last_patient = cls.objects.order_by("-registration_number").first()

        if not last_patient:
            # First patient gets 01-00-001
            return "01-00-001"

        # Extract numeric value from existing format (remove dashes)
        last_number_str = last_patient.registration_number.replace("-", "")
        last_number = int(last_number_str)

        # Increment and format as xx-xx-xxx
        next_number = last_number + 1
        formatted = f"{next_number:07d}"  # Zero-pad to 7 digits

        return f"{formatted[:2]}-{formatted[2:4]}-{formatted[4:]}"

    def save(self, *args, **kwargs):
        # Auto-generate registration number if not provided
        if not self.registration_number:
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

    visit = models.ForeignKey(
        Visit, on_delete=models.CASCADE, related_name="prescription_images"
    )
    drive_file_id = models.CharField(max_length=255, blank=True)
    image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prescription for visit {self.visit_id}"
