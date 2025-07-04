import pytest
from django.utils import timezone
from datetime import date, timedelta
from freezegun import freeze_time

from api.models import Visit
from api.serializers import VisitSerializer

@pytest.mark.django_db
class TestVisitModel:

    def test_create_visit_first_token_of_day(self):
        """Test creating the first visit of the day generates token 1."""
        patient_data = {
            "patient_name": "John Doe",
            "patient_gender": "MALE"
        }
        serializer = VisitSerializer(data=patient_data)
        assert serializer.is_valid()
        visit = serializer.save()

        assert visit.token_number == 1
        assert visit.visit_date == date.today()
        assert visit.status == "WAITING"
        assert visit.patient_name == "John Doe"

    def test_create_visit_incremental_token(self):
        """Test subsequent visits increment token number for the same day."""
        Visit.objects.create(
            patient_name="Jane Smith",
            token_number=1,
            visit_date=date.today()
        )

        patient_data = {
            "patient_name": "Peter Pan",
            "patient_gender": "MALE"
        }
        serializer = VisitSerializer(data=patient_data)
        assert serializer.is_valid()
        visit = serializer.save()

        assert visit.token_number == 2
        assert visit.visit_date == date.today()

    def test_token_resets_next_day(self):
        """Test token number resets to 1 for a new day."""
        with freeze_time("2023-01-01"):
            Visit.objects.create(patient_name="Alice", token_number=1, visit_date=date(2023,1,1))
            Visit.objects.create(patient_name="Bob", token_number=2, visit_date=date(2023,1,1))

            # Simulate creating first patient of the day
            patient_data_today = { "patient_name": "First Today", "patient_gender": "FEMALE"}
            serializer_today = VisitSerializer(data=patient_data_today)
            assert serializer_today.is_valid(), serializer_today.errors
            visit_today = serializer_today.save()
            assert visit_today.token_number == 3 # Still on 2023-01-01

        with freeze_time("2023-01-02"):
            # This visit is for the "next day"
            patient_data_next_day = {
                "patient_name": "Charlie NextDay",
                "patient_gender": "OTHER"
            }
            serializer_next_day = VisitSerializer(data=patient_data_next_day)
            assert serializer_next_day.is_valid(), serializer_next_day.errors
            visit_next_day = serializer_next_day.save()

            assert visit_next_day.token_number == 1
            assert visit_next_day.visit_date == date(2023, 1, 2)

    def test_visit_string_representation(self):
        visit = Visit.objects.create(
            token_number=10,
            patient_name="Test Patient",
            visit_date=date(2023, 5, 15)
        )
        assert str(visit) == "Token 10 - Test Patient (2023-05-15)"

    def test_default_status_is_waiting(self):
        visit = Visit.objects.create(token_number=1, patient_name="Wally Waiting")
        assert visit.status == "WAITING"

    def test_unique_token_per_day_constraint(self):
        """Test database constraint for (token_number, visit_date) uniqueness."""
        Visit.objects.create(token_number=1, patient_name="First", visit_date=date.today())
        with pytest.raises(Exception): # IntegrityError from DB
             Visit.objects.create(token_number=1, patient_name="Second", visit_date=date.today())

    def test_patient_gender_choices(self):
        visit = Visit.objects.create(token_number=1, patient_name="Alex", patient_gender="FEMALE")
        assert visit.get_patient_gender_display() == "Female"

        visit_other = Visit.objects.create(token_number=2, patient_name="Sam", patient_gender="OTHER")
        assert visit_other.get_patient_gender_display() == "Other"

        visit_male = Visit.objects.create(token_number=3, patient_name="Max", patient_gender="MALE")
        assert visit_male.get_patient_gender_display() == "Male"

    def test_ordering(self):
        """Test that visits are ordered by visit_date, then token_number."""
        Visit.objects.create(token_number=2, patient_name="B", visit_date=date.today())
        Visit.objects.create(token_number=1, patient_name="A", visit_date=date.today())
        Visit.objects.create(token_number=1, patient_name="C", visit_date=date.today() - timedelta(days=1))

        visits = Visit.objects.all() # Meta ordering should apply
        assert visits[0].patient_name == "C" # Yesterday's visit
        assert visits[1].patient_name == "A" # Today's first visit
        assert visits[2].patient_name == "B" # Today's second visit

    # This test requires the serializer logic to be hit, so it's more of an integration test
    # of the serializer's create method with the model's constraints.
    def test_serializer_handles_token_generation_on_create(self):
        patient_data = { "patient_name": "Serial Test", "patient_gender": "MALE" }
        serializer = VisitSerializer(data=patient_data)
        assert serializer.is_valid()
        visit1 = serializer.save()
        assert visit1.token_number == 1
        assert visit1.visit_date == date.today()

        patient_data_2 = { "patient_name": "Serial Test Two", "patient_gender": "FEMALE" }
        serializer2 = VisitSerializer(data=patient_data_2)
        assert serializer2.is_valid()
        visit2 = serializer2.save()
        assert visit2.token_number == 2
        assert visit2.visit_date == date.today()

    # Test for visit_date defaulting to today via model field default
    def test_visit_date_defaults_to_today_model_level(self):
        with freeze_time("2023-10-26"):
            # Creating model directly, not via serializer
            visit = Visit.objects.create(token_number=5, patient_name="Direct Model Create")
            assert visit.visit_date == date(2023, 10, 26)

    # Test for visit_date being set by serializer if not provided
    # The serializer's create method explicitly sets visit_date = today
    def test_visit_date_defaults_to_today_serializer_level(self):
         with freeze_time("2023-11-27"):
            patient_data = { "patient_name": "Serializer Date Test", "patient_gender": "OTHER" }
            serializer = VisitSerializer(data=patient_data)
            assert serializer.is_valid()
            visit = serializer.save()
            assert visit.visit_date == date(2023, 11, 27)
