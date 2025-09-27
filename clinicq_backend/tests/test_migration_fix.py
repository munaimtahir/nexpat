"""
Test to verify the fix for migration 0008_alter_patient_registration_number.py

This test verifies that using registration_number=patient.pk instead of
pk=patient.pk works correctly in the migration functions.
"""
from django.test import TestCase
from api.models import Patient


class TestMigrationPKFix(TestCase):
    """Test that the migration pk filter fix works correctly"""

    def test_registration_number_filter_works_with_formatted_numbers(self):
        """Test that filtering by registration_number works with formatted numbers"""
        # Create a patient with formatted registration number
        patient = Patient.objects.create(
            registration_number="01-23-456",
            name="Test Patient",
            gender="MALE"
        )

        # Verify that filtering by registration_number=patient.pk works
        # This simulates the fixed migration code
        found_patients = Patient.objects.filter(registration_number=patient.pk)
        self.assertEqual(found_patients.count(), 1)
        self.assertEqual(found_patients.first(), patient)

        # Verify that update operations work
        updated_count = Patient.objects.filter(
            registration_number=patient.pk
        ).update(name="Updated Name")
        self.assertEqual(updated_count, 1)

        patient.refresh_from_db()
        self.assertEqual(patient.name, "Updated Name")

    def test_registration_number_filter_works_with_edge_cases(self):
        """Test that filtering works with edge cases like leading zeros"""
        # Create patient with leading zeros
        patient = Patient.objects.create(
            registration_number="00-00-001",
            name="Edge Case Patient",
            gender="FEMALE"
        )

        # Test filtering - this would be the same as the migration logic
        filter_result = Patient.objects.filter(registration_number=patient.pk)
        self.assertEqual(filter_result.count(), 1)
        self.assertEqual(
            filter_result.first().registration_number, "00-00-001")

    def test_migration_simulation_forward_conversion(self):
        """Simulate the forward migration conversion logic"""
        # Create a patient that simulates having an integer-like registration number
        # (this would happen during the migration process)
        patient = Patient.objects.create(
            registration_number="1234567",  # Simulates integer stored as string
            name="Integer Format Patient",
            gender="OTHER"
        )

        # Simulate the forward conversion logic from the migration
        number_str = f"{int(patient.registration_number):07d}"
        formatted = f"{number_str[:2]}-{number_str[2:4]}-{number_str[4:]}"

        # Test the filter that was fixed in the migration
        updated_count = Patient.objects.filter(
            registration_number=patient.pk
        ).update(registration_number=formatted)

        self.assertEqual(updated_count, 1)

        # Since registration_number is the primary key, we need to get the updated patient
        # The formatting of "1234567" should be "12-34-567"
        updated_patient = Patient.objects.get(registration_number="12-34-567")
        self.assertEqual(updated_patient.name, "Integer Format Patient")

    def test_migration_simulation_reverse_conversion(self):
        """Simulate the reverse migration conversion logic"""
        # Create a patient with formatted registration number
        patient = Patient.objects.create(
            registration_number="99-88-777",
            name="Formatted Patient",
            gender="MALE"
        )

        # Simulate the reverse conversion logic from the migration
        numeric_str = patient.registration_number.replace("-", "")
        integer_value = int(numeric_str)

        # Test the filter that was fixed in the migration
        updated_count = Patient.objects.filter(
            registration_number=patient.pk
        ).update(registration_number=str(integer_value))

        self.assertEqual(updated_count, 1)

        # Since registration_number is the primary key, we need to get the updated patient
        updated_patient = Patient.objects.get(registration_number="9988777")
        self.assertEqual(updated_patient.name, "Formatted Patient")