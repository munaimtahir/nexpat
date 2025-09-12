from django.contrib import admin
from django.test import TestCase
from .models import Patient, Queue, PrescriptionImage


class TestAdminRegistration(TestCase):
    def test_models_are_registered(self):
        site = admin.site
        assert Patient in site._registry
        assert Queue in site._registry
        assert PrescriptionImage in site._registry
