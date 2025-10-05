# Reviewed for final cleanup
from django.db import models
from django.core.exceptions import ValidationError
import datetime
import re


def validate_registration_number_format(value):
    """Validate that registration number matches the format mmyy-ct-0000."""
    pattern = r"^\d{4}-\d{2}-\d{4}$"
    if not re.match(pattern, value):
        raise ValidationError(
            "Registration number must be in format mmyy-ct-0000 "
            "(e.g., 1025-01-0001 for October 2025, category 01, serial 0001)."
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
    CATEGORY_CHOICES = [
        ("01", "Self-paying"),
        ("02", "Insurance"),
        ("03", "Cash"),
        ("04", "Free"),
        ("05", "Poor"),
    ]

    # Using CharField with format mmyy-ct-0000
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
    category = models.CharField(
        max_length=2,
        choices=CATEGORY_CHOICES,
        default="01",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def generate_next_registration_number(cls, category):
        """Generate the next registration number in format mmyy-ct-0000.

        Args:
            category: Patient category code (01-05)

        Returns:
            Registration number in format mmyy-ct-0000
        """
        now = datetime.datetime.now()
        mmyy = f"{now.month:02d}{now.year % 100:02d}"

        # Find the last patient with the same mmyy-ct prefix
        prefix = f"{mmyy}-{category}-"
        last_patient = (
            cls.objects
            .filter(registration_number__startswith=prefix)
            .order_by("-registration_number")
            .first()
        )

        if last_patient:
            # Extract the serial number from the last registration
            serial_str = last_patient.registration_number.split("-")[-1]
            next_serial = int(serial_str) + 1
        else:
            next_serial = 1

        if next_serial > 9999:
            raise ValidationError(
                f"No more registration numbers available for {mmyy}-{category} "
                "(maximum 9999 patients per category per month)."
            )

        return f"{mmyy}-{category}-{next_serial:04d}"

    def save(self, *args, **kwargs):
        from django.db import transaction

        # Auto-generate registration number if not provided
        if not self.registration_number:
            # Use transaction to ensure atomicity when generating registration number
            with transaction.atomic():
                self.registration_number = self.generate_next_registration_number(self.category)
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
