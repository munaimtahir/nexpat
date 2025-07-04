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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('token_number', 'visit_date')
        ordering = ['visit_date', 'token_number']

    def __str__(self):
        return f"Token {self.token_number} - {self.patient_name} ({self.visit_date})"
