from django.contrib import admin
from django.test import TestCase
from .models import Patient, Queue, PrescriptionImage


class TestAdminRegistration(TestCase):
    def test_models_are_registered(self):
        site = admin.site
        self.assertIn(Patient, site._registry)
        self.assertIn(Queue, site._registry)
        self.assertIn(PrescriptionImage, site._registry)
