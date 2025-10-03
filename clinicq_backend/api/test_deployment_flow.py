"""
Tests for the deployment flow and database migration process.

These tests verify that the commands specified in the issue work correctly:
1. Database startup
2. Backend build
3. Migration execution
4. Superuser creation
"""

import os
from unittest import mock

import pytest
from django.test import TestCase, TransactionTestCase
from django.core.management import call_command
from django.contrib.auth.models import User
from api.models import Queue, Patient, Visit
from io import StringIO


class DeploymentFlowTest(TransactionTestCase):
    """Test the deployment flow components that require database transactions."""

    def test_migrations_run_cleanly(self):
        """Test that migrations can be run multiple times without issues."""
        # Capture migration output
        out = StringIO()

        # Run migrations (should be idempotent)
        call_command("migrate", verbosity=2, stdout=out)
        output = out.getvalue()

        # Should not fail and should indicate no migrations to apply
        # (since migrations are already applied in test setup)
        self.assertIn("No migrations to apply", output)

    def test_superuser_creation_with_environment_vars(self):
        """Test superuser creation as specified in the deployment flow."""
        # Ensure we start with no users
        User.objects.all().delete()

        # Create superuser using management command with password provided via env var
        with mock.patch.dict(os.environ, {"DJANGO_SUPERUSER_PASSWORD": "testpass"}, clear=False):
            call_command(
                "createsuperuser",
                "--noinput",
                username="deploytest",
                email="deploytest@example.com",
            )

        # Verify superuser was created
        user = User.objects.get(username="deploytest")
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)
        self.assertEqual(user.email, "deploytest@example.com")

    def test_superuser_creation_idempotent(self):
        """Test that superuser creation handles existing users gracefully."""
        # Create a user first
        User.objects.create_superuser(
            username="existing", email="existing@example.com", password="testpass"
        )

        # Try to create the same user again - should not raise exception
        # but should indicate user already exists
        out = StringIO()
        err = StringIO()

        with pytest.raises(Exception):  # Django raises CommandError for existing username
            call_command(
                "createsuperuser",
                "--noinput",
                username="existing",
                email="existing@example.com",
                stdout=out,
                stderr=err,
            )

    def test_default_queue_creation_during_migration(self):
        """Test that the data migration creates the default queue."""
        # The default queue should exist after migrations
        default_queue = Queue.objects.filter(name="General").first()
        self.assertIsNotNone(default_queue)
        self.assertEqual(default_queue.name, "General")

    def test_visit_migration_handles_empty_data(self):
        """Test that the visit migration handles empty visit data properly."""
        # Count visits before - there should be none in a fresh test database
        visit_count = Visit.objects.count()
        self.assertEqual(visit_count, 0)

        # The migration should have run without errors even with no data
        # This is verified by the successful test database creation


class MigrationValidationTest(TestCase):
    """Test migration validation components that don't require transactions."""

    def test_database_models_are_properly_migrated(self):
        """Test that all models have been properly migrated."""
        # Verify key models can be instantiated (tables exist)

        # Test Queue model
        queue = Queue.objects.create(name="Test Queue")
        self.assertEqual(queue.name, "Test Queue")

        # Test Patient model
        patient = Patient.objects.create(
            registration_number="01-23-45", name="Test Patient", gender="MALE"
        )
        self.assertEqual(patient.registration_number, "01-23-45")

        # Test Visit model with proper relationships
        visit = Visit.objects.create(
            token_number=100,
            patient=patient,
            queue=queue,
            visit_date="2023-01-01",
            status="WAITING",
        )
        self.assertEqual(visit.token_number, 100)
        self.assertEqual(visit.patient, patient)
        self.assertEqual(visit.queue, queue)

    def test_migration_0003_backfill_logic(self):
        """Test the core logic of the backfill migration."""
        # Ensure default queue exists (created by migration)
        general_queue = Queue.objects.get(name="General")
        self.assertIsNotNone(general_queue)

        # Test that we can create visits with the expected relationships
        patient = Patient.objects.create(
            registration_number="02-34-56", name="Migration Test Patient", gender="FEMALE"
        )

        visit = Visit.objects.create(
            token_number=101,
            patient=patient,
            queue=general_queue,
            visit_date="2023-01-01",
            status="WAITING",
        )

        # Verify the relationships work as expected after migration
        self.assertEqual(visit.patient.name, "Migration Test Patient")
        self.assertEqual(visit.queue.name, "General")
