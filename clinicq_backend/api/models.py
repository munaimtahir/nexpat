from django.db import models
from django.utils import timezone
import datetime

class Visit(models.Model):
    PATIENT_GENDER_CHOICES = [
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
    ]

    STATUS_CHOICES = [
        ('WAITING', 'Waiting'),
        ('DONE', 'Done'),
    ]

    token_number = models.IntegerField()
    patient_name = models.CharField(max_length=255)
    patient_gender = models.CharField(
        max_length=10,
        choices=PATIENT_GENDER_CHOICES,
        default='OTHER',
    )
    visit_date = models.DateField(default=datetime.date.today)
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='WAITING',
    )
    # patient_name and patient_gender will be deprecated after migration
    # and eventually removed in a future release. Kept for now for data migration.

    # ForeignKeys to new models
    # Made nullable initially to allow existing rows to validate before data migration.
    # Will be populated by data migration.
    # Consider making them non-nullable in a subsequent schema migration if appropriate.
    patient = models.ForeignKey('Patient', on_delete=models.CASCADE, related_name='visits', null=True)
    queue = models.ForeignKey('Queue', on_delete=models.CASCADE, related_name='visits', null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Update unique_together to include queue
        # The old unique_together ('token_number', 'visit_date') will be removed by makemigrations.
        unique_together = ('token_number', 'visit_date', 'queue')
        ordering = ['visit_date', 'queue', 'token_number']

    def __str__(self):
        return f"Token {self.token_number} - {self.patient_name} ({self.visit_date})"


class Patient(models.Model):
    # Using AutoField for registration_number to ensure uniqueness and simplicity for now.
    # This could be changed to a custom CharField with validation if specific formats are needed.
    registration_number = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True) # Assuming phone is optional
    gender = models.CharField(
        max_length=10,
        choices=Visit.PATIENT_GENDER_CHOICES, # Reusing choices from Visit
        default='OTHER',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (ID: {self.registration_number})"

    class Meta:
        indexes = [
            models.Index(fields=['phone']),
            # registration_number is already indexed as it's a primary key.
            # Adding an explicit index for name if frequent partial searches are expected.
            models.Index(fields=['name']),
        ]


class Queue(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


# Add ForeignKey relationships to Visit model
# These will be handled by makemigrations to create new fields in Visit
# and then a data migration will populate them.

# Need to modify Visit model to include ForeignKey to Patient and Queue
# This change should be done carefully.
# Option 1: Add nullable FKs, then populate, then make non-nullable if desired.
# Option 2: Create new model structure and migrate data (more complex).
# Going with Option 1 for simplicity.

# The following lines will be added to the Visit model definition by a later step
# after initial models for Patient and Queue are created and migrated.
# For now, these are comments to guide the next steps.

# patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='visits', null=True) # Will be made non-nullable after data migration
# queue = models.ForeignKey(Queue, on_delete=models.CASCADE, related_name='visits', null=True) # Will be made non-nullable after data migration
