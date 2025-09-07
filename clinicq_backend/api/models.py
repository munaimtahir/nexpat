from django.db import models
import datetime


class Visit(models.Model):
    PATIENT_GENDER_CHOICES = [
        ("MALE", "Male"),
        ("FEMALE", "Female"),
        ("OTHER", "Other"),
    ]

    STATUS_CHOICES = [
        ("WAITING", "Waiting"),
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
        return (
            f"Token {self.token_number} - {self.patient.name}" f" ({self.visit_date})"
        )


class Patient(models.Model):
    # Using AutoField for registration_number to ensure uniqueness and
    # simplicity for now. This could be changed to a custom CharField with
    # validation if specific formats are needed.
    registration_number = models.AutoField(primary_key=True)
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
