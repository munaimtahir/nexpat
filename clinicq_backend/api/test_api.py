import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User, Group
from rest_framework.authtoken.models import Token
from django.core.cache import cache
from .models import Visit, Patient, Queue
from datetime import date, timedelta
from freezegun import freeze_time


@pytest.mark.django_db
class PatientAPITests(APITestCase):
    def setUp(self):
        cache.clear()
        doctor_group, _ = Group.objects.get_or_create(name="doctor")
        assistant_group, _ = Group.objects.get_or_create(name="assistant")
        user = User.objects.create_user(username="tester", password="pass")
        user.groups.add(doctor_group, assistant_group)
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        # Using phone numbers less likely to contain the other patient's AutoField ID (e.g., "1" or "2")
        # self.patient1_data phone updated to include '12345' for the search test.
        self.patient1_data = {
            "name": "Alice Wonderland",
            "phone": "55512345XX",
            "gender": "FEMALE",
        }
        self.patient2_data = {
            "name": "Bob The Builder",
            "phone": "555222000B",
            "gender": "MALE",
        }
        # Ensure created_at/updated_at are deterministic for potential snapshot testing later if needed
        with freeze_time("2024-01-01 10:00:00"):
            self.patient1 = Patient.objects.create(**self.patient1_data)
        with freeze_time("2024-01-01 10:01:00"):
            self.patient2 = Patient.objects.create(**self.patient2_data)

    def test_create_patient(self):
        url = reverse("patient-list")
        data = {"name": "Charlie Brown", "phone": "1122334455", "gender": "MALE"}
        response = self.client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert Patient.objects.count() == 3
        new_patient = Patient.objects.get(name="Charlie Brown")
        assert new_patient.phone == "1122334455"

    def test_get_patient_list(self):
        url = reverse("patient-list")
        response = self.client.get(url, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2
        assert len(response.data["results"]) == 2

    def test_get_patients_by_registration_numbers(self):
        url = reverse("patient-list")
        numbers = f"{self.patient1.registration_number},{self.patient2.registration_number},9999"
        response = self.client.get(
            url,
            {"registration_numbers": numbers},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        returned = {p["registration_number"] for p in response.data["results"]}
        assert returned == {
            self.patient1.registration_number,
            self.patient2.registration_number,
        }

    def test_get_patients_by_mixed_registration_numbers(self):
        url = reverse("patient-list")
        query = f"{self.patient1.registration_number}, abc ,{self.patient2.registration_number},xyz"
        response = self.client.get(url, {"registration_numbers": query}, format="json")
        assert response.status_code == status.HTTP_200_OK
        numbers = [p["registration_number"] for p in response.data["results"]]
        assert sorted(numbers) == sorted(
            [
                self.patient1.registration_number,
                self.patient2.registration_number,
            ]
        )

    def test_get_patients_by_invalid_registration_numbers(self):
        url = reverse("patient-list")
        response = self.client.get(
            url,
            {"registration_numbers": "abc, xyz"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["results"] == []

    def test_get_patients_registration_number_limit_accepted(self):
        url = reverse("patient-list")
        numbers = ",".join(str(i) for i in range(50))
        response = self.client.get(
            url, {"registration_numbers": numbers}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK

    def test_get_patients_registration_number_limit_rejected(self):
        url = reverse("patient-list")
        numbers = ",".join(str(i) for i in range(51))
        response = self.client.get(
            url, {"registration_numbers": numbers}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_patients_registration_number_length_rejected(self):
        url = reverse("patient-list")
        numbers = f"{'1'*11},2"
        response = self.client.get(
            url, {"registration_numbers": numbers}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_patient_detail(self):
        url = reverse(
            "patient-detail",
            kwargs={"registration_number": self.patient1.registration_number},
        )
        response = self.client.get(url, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == self.patient1_data["name"]

    def test_update_patient(self):
        url = reverse(
            "patient-detail",
            kwargs={"registration_number": self.patient1.registration_number},
        )
        updated_data = {
            "name": "Alice In Chains",
            "phone": "1231231234",
            "gender": "FEMALE",
        }
        response = self.client.put(url, updated_data, format="json")
        assert response.status_code == status.HTTP_200_OK
        self.patient1.refresh_from_db()
        assert self.patient1.name == "Alice In Chains"
        assert self.patient1.phone == "1231231234"

    def test_delete_patient(self):
        url = reverse(
            "patient-detail",
            kwargs={"registration_number": self.patient1.registration_number},
        )
        response = self.client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Patient.objects.count() == 1

    def test_search_patient_by_reg_no(self):
        url = reverse("patient-search")  # Custom action URL name
        response = self.client.get(
            url, {"q": str(self.patient1.registration_number)}, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["name"] == self.patient1.name

    def test_search_patient_by_name_fragment(self):
        url = reverse("patient-search")
        response = self.client.get(url, {"q": "Alice"}, format="json")  # Partial name
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["name"] == self.patient1.name

    def test_search_patient_by_phone_fragment(self):
        url = reverse("patient-search")
        response = self.client.get(url, {"q": "12345"}, format="json")  # Partial phone
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["name"] == self.patient1.name

    def test_search_patient_no_results(self):
        url = reverse("patient-search")
        response = self.client.get(url, {"q": "NonExistent"}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 0

    def test_search_patient_missing_query_param(self):
        url = reverse("patient-search")
        response = self.client.get(url, format="json")  # No 'q' param
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    def test_me_endpoint_returns_roles(self):
        url = reverse("auth-me")
        response = self.client.get(url, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert set(response.data.get("roles", [])) == {"doctor", "assistant"}

    def test_patient_last_5_visit_dates(self):
        # Create a queue
        queue = Queue.objects.create(name="Test Queue")
        # Create some visits for patient1
        for i in range(7):
            Visit.objects.create(
                patient=self.patient1,
                queue=queue,
                token_number=i + 1,
                visit_date=date.today() - timedelta(days=i),
            )

        url = reverse(
            "patient-detail",
            kwargs={"registration_number": self.patient1.registration_number},
        )
        response = self.client.get(url, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert "last_5_visit_dates" in response.data
        api_visit_dates_iso = [str(d) for d in response.data["last_5_visit_dates"]]
        assert len(api_visit_dates_iso) == 5

        # Dates should be most recent 5. SerializerMethodField doesn't guarantee order unless explicitly handled.
        # The query in serializer is `obj.visits.order_by('-visit_date').values_list('visit_date', flat=True)[:5]`
        # This means they are already sorted from most recent to oldest.
        expected_dates_iso = [str(date.today() - timedelta(days=i)) for i in range(5)]
        assert api_visit_dates_iso == expected_dates_iso


@pytest.mark.django_db
class QueueAPITests(APITestCase):
    def setUp(self):
        cache.clear()
        doctor_group, _ = Group.objects.get_or_create(name="doctor")
        assistant_group, _ = Group.objects.get_or_create(name="assistant")
        user = User.objects.create_user(username="queue_tester", password="pass")
        user.groups.add(doctor_group, assistant_group)
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        # Use get_or_create to avoid issues if 'General' queue is created by migrations
        self.queue1, _ = Queue.objects.get_or_create(name="General")
        self.queue2, _ = Queue.objects.get_or_create(name="Specialist")

    def test_get_queue_list(self):
        url = reverse("queue-list")
        response = self.client.get(url, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        assert response.data[0]["name"] == "General"  # Default ordering is by name
        assert response.data[1]["name"] == "Specialist"

    def test_get_queue_detail(self):
        url = reverse("queue-detail", kwargs={"pk": self.queue1.pk})
        response = self.client.get(url, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == self.queue1.name


@pytest.mark.django_db
class VisitAPITests(APITestCase):
    def setUp(self):
        cache.clear()
        doctor_group, _ = Group.objects.get_or_create(name="doctor")
        assistant_group, _ = Group.objects.get_or_create(name="assistant")
        user = User.objects.create_user(username="visit_tester", password="pass")
        user.groups.add(doctor_group, assistant_group)
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        self.patient_data = {
            "name": "Visit Tester",
            "gender": "OTHER",
            "phone": "555000111",
        }
        self.patient = Patient.objects.create(**self.patient_data)
        self.queue1_data = {"name": "Queue One"}
        self.queue1 = Queue.objects.create(**self.queue1_data)
        self.queue2_data = {"name": "Queue Two"}
        self.queue2 = Queue.objects.create(**self.queue2_data)

    def test_create_visit_api(self):
        """Test POST /api/visits/ for creating a new visit with patient and queue."""
        url = reverse("visit-list")
        data = {"patient": self.patient.registration_number, "queue": self.queue1.pk}

        response = self.client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert Visit.objects.count() == 1
        visit = Visit.objects.first()
        assert visit.patient == self.patient
        assert visit.queue == self.queue1
        assert visit.token_number == 1
        assert visit.visit_date == date.today()
        assert visit.status == "WAITING"

    def test_create_multiple_visits_same_queue_increments_token(self):
        url = reverse("visit-list")
        patient2 = Patient.objects.create(name="Another Patient", gender="MALE")
        data1 = {"patient": self.patient.registration_number, "queue": self.queue1.pk}
        data2 = {"patient": patient2.registration_number, "queue": self.queue1.pk}

        response1 = self.client.post(url, data1, format="json")
        assert response1.status_code == status.HTTP_201_CREATED
        assert response1.data["token_number"] == 1

        response2 = self.client.post(url, data2, format="json")
        assert response2.status_code == status.HTTP_201_CREATED
        assert response2.data["token_number"] == 2
        assert Visit.objects.count() == 2

    def test_multi_queue_token_independence(self):
        """Test tokens are independent across different queues on the same day."""
        url = reverse("visit-list")
        patient2 = Patient.objects.create(name="Patient Two QTwo", gender="FEMALE")

        # Visit in Queue 1
        data_q1_v1 = {
            "patient": self.patient.registration_number,
            "queue": self.queue1.pk,
        }
        response_q1_v1 = self.client.post(url, data_q1_v1, format="json")
        assert response_q1_v1.status_code == status.HTTP_201_CREATED
        assert response_q1_v1.data["token_number"] == 1
        assert response_q1_v1.data["queue_name"] == self.queue1.name

        # Visit in Queue 2 - token should also be 1
        data_q2_v1 = {"patient": patient2.registration_number, "queue": self.queue2.pk}
        response_q2_v1 = self.client.post(url, data_q2_v1, format="json")
        assert response_q2_v1.status_code == status.HTTP_201_CREATED
        assert response_q2_v1.data["token_number"] == 1  # Independent token for Queue 2
        assert response_q2_v1.data["queue_name"] == self.queue2.name

        # Another visit in Queue 1 - token should be 2
        patient3 = Patient.objects.create(name="Patient Three QOne", gender="OTHER")
        data_q1_v2 = {"patient": patient3.registration_number, "queue": self.queue1.pk}
        response_q1_v2 = self.client.post(url, data_q1_v2, format="json")
        assert response_q1_v2.status_code == status.HTTP_201_CREATED
        assert response_q1_v2.data["token_number"] == 2  # Incremented for Queue 1
        assert response_q1_v2.data["queue_name"] == self.queue1.name

        assert Visit.objects.count() == 3

    def test_create_visit_missing_patient_or_queue_api(self):
        url = reverse("visit-list")
        # Missing patient
        data_no_patient = {"queue": self.queue1.pk}
        response_no_patient = self.client.post(url, data_no_patient, format="json")
        assert response_no_patient.status_code == status.HTTP_400_BAD_REQUEST
        assert "patient" in response_no_patient.data

        # Missing queue
        data_no_queue = {"patient": self.patient.registration_number}
        response_no_queue = self.client.post(url, data_no_queue, format="json")
        assert response_no_queue.status_code == status.HTTP_400_BAD_REQUEST
        assert "queue" in response_no_queue.data

    def test_get_waiting_visits_api_filtered_by_queue(self):
        """Test GET /api/visits/?status=WAITING&queue=<id> returns correctly."""
        # Visits for Queue 1
        Visit.objects.create(
            patient=self.patient,
            queue=self.queue1,
            token_number=1,
            visit_date=date.today(),
            status="WAITING",
        )
        # Visit for Queue 2
        patient2 = Patient.objects.create(name="Q2 Patient", gender="MALE")
        Visit.objects.create(
            patient=patient2,
            queue=self.queue2,
            token_number=1,
            visit_date=date.today(),
            status="WAITING",
        )

        url_q1 = reverse("visit-list") + f"?status=WAITING&queue={self.queue1.pk}"
        response_q1 = self.client.get(url_q1, format="json")
        assert response_q1.status_code == status.HTTP_200_OK
        assert response_q1.data["count"] == 1
        assert response_q1.data["results"][0]["patient_full_name"] == self.patient.name
        assert response_q1.data["results"][0]["queue_name"] == self.queue1.name

        url_q2 = reverse("visit-list") + f"?status=WAITING&queue={self.queue2.pk}"
        response_q2 = self.client.get(url_q2, format="json")
        assert response_q2.status_code == status.HTTP_200_OK
        assert response_q2.data["count"] == 1
        assert response_q2.data["results"][0]["patient_full_name"] == patient2.name
        assert response_q2.data["results"][0]["queue_name"] == self.queue2.name

        # Test without queue filter, should show all waiting for today
        url_all_waiting = reverse("visit-list") + "?status=WAITING"
        response_all_waiting = self.client.get(url_all_waiting, format="json")
        assert response_all_waiting.status_code == status.HTTP_200_OK
        assert response_all_waiting.data["count"] == 2

    def test_patch_visit_done_api(self):
        visit = Visit.objects.create(
            patient=self.patient,
            queue=self.queue1,
            token_number=1,
            visit_date=date.today(),
            status="WAITING",
        )
        url = reverse("visit-done", kwargs={"pk": visit.pk})
        response = self.client.patch(url, {}, format="json")
        assert response.status_code == status.HTTP_200_OK
        visit.refresh_from_db()
        assert visit.status == "DONE"

    def test_token_generation_resets_across_days_for_queues_api(self):
        url = reverse("visit-list")
        with freeze_time("2023-01-01"):
            data_d1_q1 = {
                "patient": self.patient.registration_number,
                "queue": self.queue1.pk,
            }
            resp_d1_q1 = self.client.post(url, data_d1_q1, format="json")
            assert resp_d1_q1.status_code == status.HTTP_201_CREATED
            assert resp_d1_q1.data["token_number"] == 1
            assert resp_d1_q1.data["visit_date"] == "2023-01-01"

        with freeze_time("2023-01-02"):  # New day
            # Token for Queue 1 should reset
            data_d2_q1 = {
                "patient": self.patient.registration_number,
                "queue": self.queue1.pk,
            }
            resp_d2_q1 = self.client.post(url, data_d2_q1, format="json")
            assert resp_d2_q1.status_code == status.HTTP_201_CREATED
            assert resp_d2_q1.data["token_number"] == 1
            assert resp_d2_q1.data["visit_date"] == "2023-01-02"

            # Token for Queue 2 should also be 1 on this new day
            patient2 = Patient.objects.create(name="Day2 Q2 Patient", gender="FEMALE")
            data_d2_q2 = {
                "patient": patient2.registration_number,
                "queue": self.queue2.pk,
            }
            resp_d2_q2 = self.client.post(url, data_d2_q2, format="json")
            assert resp_d2_q2.status_code == status.HTTP_201_CREATED
            assert resp_d2_q2.data["token_number"] == 1
            assert resp_d2_q2.data["visit_date"] == "2023-01-02"

    def test_quick_re_registration_flow(self):
        """Test creating a new visit for an existing patient doesn't change patient details."""
        url = reverse("visit-list")
        original_patient_name = self.patient.name
        original_patient_phone = self.patient.phone

        # First visit for the patient
        visit1_data = {
            "patient": self.patient.registration_number,
            "queue": self.queue1.pk,
        }
        response1 = self.client.post(url, visit1_data, format="json")
        assert response1.status_code == status.HTTP_201_CREATED
        assert response1.data["token_number"] == 1
        assert response1.data["patient_full_name"] == original_patient_name

        # Patient details should be unchanged
        self.patient.refresh_from_db()
        assert self.patient.name == original_patient_name
        assert self.patient.phone == original_patient_phone

        # Second visit for the same patient (quick re-registration)
        # Simulate some time passes, maybe another day or same day different queue
        visit2_data = {
            "patient": self.patient.registration_number,
            "queue": self.queue2.pk,
        }  # Different queue
        response2 = self.client.post(url, visit2_data, format="json")
        assert response2.status_code == status.HTTP_201_CREATED
        assert response2.data["token_number"] == 1  # Token 1 for queue2
        assert response2.data["patient_full_name"] == original_patient_name

        # Patient details should still be unchanged
        self.patient.refresh_from_db()
        assert self.patient.name == original_patient_name
        assert self.patient.phone == original_patient_phone

        assert Visit.objects.filter(patient=self.patient).count() == 2

    def test_serializer_read_only_fields_on_visit_post(self):
        """Test that read_only_fields on VisitSerializer are ignored on POST."""
        url = reverse("visit-list")
        data = {
            "patient": self.patient.registration_number,
            "queue": self.queue1.pk,
            "token_number": 99,  # Should be ignored
            "visit_date": "2000-01-01",  # Should be ignored
            "status": "DONE",  # Should be ignored (set to WAITING by default)
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["token_number"] == 1
        assert response.data["visit_date"] == str(date.today())
        assert response.data["status"] == "WAITING"
        assert (
            response.data["patient_full_name"] == self.patient.name
        )  # Derived from patient obj

        # Check the Visit model's relationships
        visit = Visit.objects.get(pk=response.data["id"])
        assert visit.patient == self.patient
        assert visit.queue == self.queue1
