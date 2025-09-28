import datetime

from django.contrib.auth.models import Group, User
from django.core.cache import cache
from django.core.exceptions import ValidationError
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from api.models import Patient, Queue, Visit


class PatientCRUDTests(APITestCase):
    def setUp(self):
        cache.clear()
        doctor_group, _ = Group.objects.get_or_create(name="Doctor")
        user = User.objects.create_user(username="doc", password="pass")
        user.groups.add(doctor_group)
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_patient_crud(self):
        # Create
        create_resp = self.client.post(
            "/api/patients/",
            {"name": "John Doe", "gender": "MALE", "phone": "1234567890"},
            format="json",
        )
        self.assertEqual(create_resp.status_code, 201)
        reg_no = create_resp.data["registration_number"]

        # Retrieve
        get_resp = self.client.get(f"/api/patients/{reg_no}/")
        self.assertEqual(get_resp.status_code, 200)
        self.assertEqual(get_resp.data["name"], "John Doe")

        # Update
        patch_resp = self.client.patch(
            f"/api/patients/{reg_no}/", {"phone": "0987654321"}, format="json"
        )
        self.assertEqual(patch_resp.status_code, 200)
        self.assertEqual(patch_resp.data["phone"], "0987654321")

        # Delete
        del_resp = self.client.delete(f"/api/patients/{reg_no}/")
        self.assertEqual(del_resp.status_code, 204)
        self.assertFalse(Patient.objects.filter(registration_number=reg_no).exists())


class RegistrationNumberFormatTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_registration_number_auto_generation(self):
        """Test that registration numbers are auto-generated in xx-xx-xxx format"""
        patient1 = Patient.objects.create(name="Patient 1", gender="MALE")
        patient2 = Patient.objects.create(name="Patient 2", gender="FEMALE")

        # Verify format
        pattern = r"^\d{2}-\d{2}-\d{3}$"
        self.assertRegex(patient1.registration_number, pattern)
        self.assertRegex(patient2.registration_number, pattern)

        # Verify sequential generation
        self.assertEqual(patient1.registration_number, "01-00-001")
        self.assertEqual(patient2.registration_number, "01-00-002")

    def test_registration_number_validation(self):
        """Test that invalid registration number formats are rejected"""
        from api.models import validate_registration_number_format

        # Valid formats
        valid_formats = ["01-23-456", "99-99-999", "00-00-001"]
        for valid_format in valid_formats:
            try:
                validate_registration_number_format(valid_format)
            except ValidationError:
                self.fail(f"Valid format {valid_format} was rejected")

        # Invalid formats
        invalid_formats = [
            "1-23-456",  # Missing leading zero
            "01-2-456",  # Missing digit in middle
            "01-23-45",  # Missing digit at end
            "01-23-4567",  # Too many digits at end
            "01-23456",  # Missing dash
            "0123456",  # No dashes
            "ab-cd-efg",  # Non-numeric
            "01-23-45a",  # Mixed alphanumeric
        ]

        for invalid_format in invalid_formats:
            with self.assertRaises(
                ValidationError, msg=f"Invalid format {invalid_format} was accepted"
            ):
                validate_registration_number_format(invalid_format)

    def test_patient_creation_with_explicit_registration_number(self):
        """Test that patients can be created with explicit registration numbers"""
        patient = Patient.objects.create(
            registration_number="05-67-890", name="Test Patient", gender="OTHER"
        )
        self.assertEqual(patient.registration_number, "05-67-890")

        # Next auto-generated patient should continue from this number
        next_patient = Patient.objects.create(name="Next Patient", gender="MALE")
        self.assertEqual(next_patient.registration_number, "05-67-891")


class PatientFilterTests(APITestCase):
    def setUp(self):
        cache.clear()
        doctor_group, _ = Group.objects.get_or_create(name="Doctor")
        user = User.objects.create_user(username="docfilter", password="pass")
        user.groups.add(doctor_group)
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        self.p1 = Patient.objects.create(name="P1", gender="MALE")
        self.p2 = Patient.objects.create(name="P2", gender="MALE")
        self.p3 = Patient.objects.create(name="P3", gender="MALE")

    def test_filter_valid_numbers(self):
        query = f"{self.p1.registration_number},{self.p3.registration_number}"
        resp = self.client.get(f"/api/patients/?registration_numbers={query}")
        self.assertEqual(resp.status_code, 200)
        numbers = [p["registration_number"] for p in resp.data["results"]]
        self.assertEqual(numbers, [self.p1.registration_number, self.p3.registration_number])

    def test_filter_mixed_numbers(self):
        query = f"{self.p1.registration_number}, abc ," f"{self.p2.registration_number},xyz"
        resp = self.client.get(f"/api/patients/?registration_numbers={query}")
        self.assertEqual(resp.status_code, 200)
        numbers = [p["registration_number"] for p in resp.data["results"]]
        self.assertEqual(numbers, [self.p1.registration_number, self.p2.registration_number])

    def test_filter_invalid_numbers(self):
        resp = self.client.get("/api/patients/?registration_numbers=abc, xyz")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 0)

    def test_filter_formatted_registration_numbers(self):
        """Test filtering with new formatted registration numbers"""
        # Create patients with formatted registration numbers
        p1 = Patient.objects.create(name="P1", gender="MALE")
        Patient.objects.create(name="P2", gender="MALE")  # Not used in test
        p3 = Patient.objects.create(name="P3", gender="MALE")

        # Test filtering with formatted numbers
        query = f"{p1.registration_number},{p3.registration_number}"
        resp = self.client.get(f"/api/patients/?registration_numbers={query}")
        self.assertEqual(resp.status_code, 200)
        numbers = [p["registration_number"] for p in resp.data["results"]]
        self.assertEqual(sorted(numbers), sorted([p1.registration_number, p3.registration_number]))

    def test_filter_mixed_formatted_and_invalid_numbers(self):
        """Test filtering with mix of valid formatted and invalid numbers"""
        p1 = Patient.objects.create(name="P1", gender="MALE")
        p2 = Patient.objects.create(name="P2", gender="MALE")

        query = f"{p1.registration_number}, invalid_format ," f"{p2.registration_number},xyz"
        resp = self.client.get(f"/api/patients/?registration_numbers={query}")
        self.assertEqual(resp.status_code, 200)
        numbers = [p["registration_number"] for p in resp.data["results"]]
        self.assertEqual(sorted(numbers), sorted([p1.registration_number, p2.registration_number]))


class VisitTests(APITestCase):
    def setUp(self):
        cache.clear()
        assistant_group, _ = Group.objects.get_or_create(name="Assistant")
        doctor_group, _ = Group.objects.get_or_create(name="Doctor")
        display_group, _ = Group.objects.get_or_create(name="Display")

        self.assistant = User.objects.create_user(username="asst", password="pass")
        self.assistant.groups.add(assistant_group)
        self.assistant_token = Token.objects.create(user=self.assistant)

        self.doctor = User.objects.create_user(username="docuser", password="pass")
        self.doctor.groups.add(doctor_group)
        self.doctor_token = Token.objects.create(user=self.doctor)

        self.display_user = User.objects.create_user(username="displayuser", password="pass")
        self.display_user.groups.add(display_group)
        self.display_token = Token.objects.create(user=self.display_user)

        self.patient = Patient.objects.create(name="Alice", gender="FEMALE")
        self.queue1, _ = Queue.objects.get_or_create(name="General")
        self.queue2, _ = Queue.objects.get_or_create(name="Special")

    def test_visit_creation_assigns_token(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.assistant_token.key}")
        resp1 = self.client.post(
            "/api/visits/",
            {"patient": self.patient.registration_number, "queue": self.queue1.id},
            format="json",
        )
        self.assertEqual(resp1.status_code, 201)
        self.assertEqual(resp1.data["token_number"], 1)

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.assistant_token.key}")
        resp2 = self.client.post(
            "/api/visits/",
            {"patient": self.patient.registration_number, "queue": self.queue1.id},
            format="json",
        )
        self.assertEqual(resp2.status_code, 201)
        self.assertEqual(resp2.data["token_number"], 2)

    def test_queue_filter_returns_only_selected_queue(self):
        # Create visits in two queues
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.assistant_token.key}")
        self.client.post(
            "/api/visits/",
            {"patient": self.patient.registration_number, "queue": self.queue1.id},
            format="json",
        )
        self.client.post(
            "/api/visits/",
            {"patient": self.patient.registration_number, "queue": self.queue2.id},
            format="json",
        )
        resp = self.client.get(f"/api/visits/?status=WAITING&queue={self.queue1.id}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["queue"], self.queue1.id)

    def test_doctor_can_progress_visit_statuses(self):
        visit = Visit.objects.create(
            patient=self.patient,
            queue=self.queue1,
            token_number=1,
            visit_date=datetime.date.today(),
            status="WAITING",
        )

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.doctor_token.key}")

        start_resp = self.client.patch(f"/api/visits/{visit.id}/start/")
        self.assertEqual(start_resp.status_code, 200)
        self.assertEqual(start_resp.data["status"], "START")

        send_back_resp = self.client.patch(f"/api/visits/{visit.id}/send_back_to_waiting/")
        self.assertEqual(send_back_resp.status_code, 200)
        self.assertEqual(send_back_resp.data["status"], "WAITING")

        restart_resp = self.client.patch(f"/api/visits/{visit.id}/start/")
        self.assertEqual(restart_resp.status_code, 200)
        self.assertEqual(restart_resp.data["status"], "START")

        in_room_resp = self.client.patch(f"/api/visits/{visit.id}/in_room/")
        self.assertEqual(in_room_resp.status_code, 200)
        self.assertEqual(in_room_resp.data["status"], "IN_ROOM")

        done_resp = self.client.patch(f"/api/visits/{visit.id}/done/")
        self.assertEqual(done_resp.status_code, 200)
        self.assertEqual(done_resp.data["status"], "DONE")

    def test_display_user_can_list_visits(self):
        visit = Visit.objects.create(
            patient=self.patient,
            queue=self.queue1,
            token_number=1,
            visit_date=datetime.date.today(),
            status="WAITING",
        )

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.display_token.key}")

        resp = self.client.get("/api/visits/")
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(resp.data["count"], 1)
        visit_ids = [item["id"] for item in resp.data["results"]]
        self.assertIn(visit.id, visit_ids)


class PatientSearchTests(APITestCase):
    def setUp(self):
        cache.clear()
        doctor_group, _ = Group.objects.get_or_create(name="Doctor")
        user = User.objects.create_user(username="docsearch", password="pass")
        user.groups.add(doctor_group)
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        self.patient1 = Patient.objects.create(
            registration_number="01-23-456", name="John Doe", phone="1234567890", gender="MALE"
        )
        self.patient2 = Patient.objects.create(
            name="Jane Smith", phone="0987654321", gender="FEMALE"
        )

    def test_search_by_formatted_registration_number(self):
        """Test searching by formatted registration number"""
        resp = self.client.get(f"/api/patients/search/?q={self.patient1.registration_number}")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(
            resp.data["results"][0]["registration_number"], self.patient1.registration_number
        )

    def test_search_by_name(self):
        """Test searching by patient name"""
        resp = self.client.get("/api/patients/search/?q=John")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["name"], "John Doe")

    def test_search_by_phone(self):
        """Test searching by phone number"""
        resp = self.client.get("/api/patients/search/?q=1234567890")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["phone"], "1234567890")
