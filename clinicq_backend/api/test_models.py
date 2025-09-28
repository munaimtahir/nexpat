import pytest
from datetime import date, timedelta
from freezegun import freeze_time
from django.db import IntegrityError

from api.models import Visit, Patient, Queue  # Added Patient, Queue
from api.serializers import (
    VisitSerializer,
)  # VisitSerializer may not be used as much here now


@pytest.mark.django_db
class TestPatientModel:
    def test_patient_string_representation(self):
        patient = Patient.objects.create(name="John Doe", gender="MALE")
        assert str(patient) == f"John Doe (ID: {patient.registration_number})"

    def test_patient_creation_defaults(self):
        patient = Patient.objects.create(
            name="Jane Smith")  # Gender defaults to OTHER
        assert patient.gender == "OTHER"
        assert patient.phone is None  # Optional field


@pytest.mark.django_db
class TestQueueModel:
    def test_queue_string_representation(self):
        queue = Queue.objects.create(name="Cardiology")
        assert str(queue) == "Cardiology"

    def test_queue_name_unique(self):
        Queue.objects.create(name="UniqueQueue")
        with pytest.raises(IntegrityError):
            Queue.objects.create(name="UniqueQueue")


@pytest.mark.django_db
class TestVisitModel:
    def setUp(self):
        self.patient = Patient.objects.create(
            name="Test Patient", gender="MALE", phone="12345"
        )
        self.queue = Queue.objects.create(name="Test Queue")

    # Tests for model field defaults and basic properties
    def test_visit_creation_defaults_and_relations(self):
        # setUp is not automatically called by pytest for methods in a class unless it's a TestCase subclass
        # or specific pytest fixtures are used. For simplicity, creating here.
        patient = Patient.objects.create(
            name="Default Patient", gender="FEMALE")
        queue = Queue.objects.create(name="Default Queue")

        visit = Visit.objects.create(
            patient=patient,
            queue=queue,
            token_number=1,
        )
        assert visit.status == "WAITING"  # Default status
        assert visit.visit_date == date.today()  # Default visit_date
        assert visit.patient == patient
        assert visit.queue == queue

    def test_visit_string_representation(self):
        # Re-setup for this specific test method if setUp isn't standard
        # unittest.TestCase
        test_patient = Patient.objects.create(name="String Rep Patient")
        test_queue = Queue.objects.create(name="String Rep Queue")
        visit = Visit.objects.create(
            patient=test_patient,
            queue=test_queue,
            token_number=10,
            visit_date=date(2023, 5, 15),
        )
        # The __str__ uses self.patient.name.
        assert str(visit) == "Token 10 - String Rep Patient (2023-05-15)"

    def test_unique_token_per_day_per_queue_constraint(self):
        """Test unique constraint for (token_number, visit_date, queue)."""
        patient1 = Patient.objects.create(name="Patient A")
        patient2 = Patient.objects.create(name="Patient B")
        queue1 = Queue.objects.create(name="Queue A")

        Visit.objects.create(
            token_number=1, patient=patient1, queue=queue1, visit_date=date.today()
        )
        with pytest.raises(IntegrityError):
            Visit.objects.create(
                token_number=1,
                patient=patient2,
                queue=queue1,  # Same token, date, queue
                visit_date=date.today(),
            )

    def test_ordering(self):
        """Test that visits are ordered by visit_date, queue, then token_number."""
        p = Patient.objects.create(name="Order Patient")
        q1 = Queue.objects.create(
            name="AlphaQueue"
        )  # Name affects ordering if PKs are same/similar
        q2 = Queue.objects.create(name="BetaQueue")

        # To ensure queue name affects order, make their PKs different or rely on string sort
        # For robust test, ensure queue names lead to predictable sort if
        # that's part of ordering

        # Order by visit_date, then queue__name, then token_number
        # (assuming default ordering includes queue.name now)
        # The model Meta.ordering is ['visit_date', 'queue', 'token_number']
        # This orders by queue PK by default for FK. If we want queue name, query needs .order_by('queue__name')
        # Let's assume test checks default model ordering.

        v1_yesterday_q1_t1 = Visit.objects.create(
            patient=p,
            queue=q1,
            token_number=1,
            visit_date=date.today() - timedelta(days=1),
        )

        v2_today_q1_t2 = Visit.objects.create(
            patient=p, queue=q1, token_number=2, visit_date=date.today()
        )
        v3_today_q1_t1 = Visit.objects.create(
            patient=p, queue=q1, token_number=1, visit_date=date.today()
        )

        v4_today_q2_t1 = Visit.objects.create(
            patient=p, queue=q2, token_number=1, visit_date=date.today()
        )

        visits = Visit.objects.all()  # Meta ordering should apply

        # Expected order:
        # 1. Yesterday Q1 T1 (v1)
        # 2. Today Q1 T1 (v3)
        # 3. Today Q1 T2 (v2)
        # 4. Today Q2 T1 (v4)  (Assuming Q1's PK < Q2's PK or Q1 name < Q2 name if ordering by name)
        # If Queue objects q1 and q2 are created in that order, q1.pk < q2.pk
        # is likely.

        assert list(visits) == [
            v1_yesterday_q1_t1,
            v3_today_q1_t1,
            v2_today_q1_t2,
            v4_today_q2_t1,
        ]

    def test_patient_gender_choices_on_patient_model(self):
        """patient gender choices are defined on the Patient model."""
        patient_female = Patient.objects.create(name="Alex", gender="FEMALE")
        assert patient_female.get_gender_display() == "Female"

        patient_other = Patient.objects.create(name="Sam", gender="OTHER")
        assert patient_other.get_gender_display() == "Other"
        # This test might be redundant if the field is only for data migration.

    # Removed tests that directly tested VisitSerializer's old create() behavior for token/date generation
    # as this logic is now in VisitViewSet.perform_create() and covered by API
    # tests.

    # Test for visit_date defaulting to today via model field default
    def test_visit_date_defaults_to_today_model_level(self):
        patient = Patient.objects.create(name="Model Date Patient")
        queue = Queue.objects.create(name="Model Date Queue")
        with freeze_time("2023-10-26"):
            visit = Visit.objects.create(
                token_number=5,
                patient=patient,
                queue=queue,
            )
            assert visit.visit_date == date(2023, 10, 26)

    # VisitSerializer tests that don't involve token/date generation side effects can remain,
    # but they must provide 'patient' and 'queue' IDs.
    def test_visit_serializer_validates_with_patient_and_queue(self):
        patient = Patient.objects.create(name="Serializer Patient")
        queue = Queue.objects.create(name="Serializer Queue")

        # Data for serializer - these are the fields the serializer expects for write operations.
        # Token number, visit_date, status etc. are read-only or set by
        # perform_create in ViewSet.
        visit_data = {
            "patient": patient.pk,
            "queue": queue.pk,
        }
        serializer = VisitSerializer(data=visit_data)
        assert serializer.is_valid(), serializer.errors

        # We can save if we provide all necessary fields that the model itself requires,
        # bypassing the ViewSet's perform_create logic.
        # This means token_number must be provided if not nullable on model (it is).
        # And visit_date, status if not defaulted.
        # For a pure serializer test, we are checking if it validates the FKs.
        # To actually .save() here, we might need to provide more fields or use a mock.
        # For now, just testing is_valid().

        # If we wanted to test saving via serializer directly (outside viewset context):
        # validated_data = serializer.validated_data
        # visit_instance = Visit.objects.create(**validated_data, token_number=1)
        # assert visit_instance is not None
        # assert visit_instance.patient == patient
        # assert visit_instance.queue == queue
