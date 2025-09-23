import datetime

from django.contrib.auth.models import Group, User
from django.core.cache import cache
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from api.models import Patient, Queue, Visit


class PatientCRUDTests(APITestCase):
    def setUp(self):
        cache.clear()
        doctor_group, _ = Group.objects.get_or_create(name="doctor")
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


class PatientFilterTests(APITestCase):
    def setUp(self):
        cache.clear()
        doctor_group, _ = Group.objects.get_or_create(name="doctor")
        user = User.objects.create_user(username="docfilter", password="pass")
        user.groups.add(doctor_group)
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        self.p1 = Patient.objects.create(name="P1", gender="MALE")
        self.p2 = Patient.objects.create(name="P2", gender="MALE")
        self.p3 = Patient.objects.create(name="P3", gender="MALE")

    def test_filter_valid_numbers(self):
        resp = self.client.get(
            f"/api/patients/?registration_numbers={self.p1.registration_number},{self.p3.registration_number}"
        )
        self.assertEqual(resp.status_code, 200)
        numbers = [p["registration_number"] for p in resp.data["results"]]
        self.assertEqual(
            numbers, [self.p1.registration_number, self.p3.registration_number]
        )

    def test_filter_mixed_numbers(self):
        query = f"{self.p1.registration_number}, abc ,{self.p2.registration_number},xyz"
        resp = self.client.get(f"/api/patients/?registration_numbers={query}")
        self.assertEqual(resp.status_code, 200)
        numbers = [p["registration_number"] for p in resp.data["results"]]
        self.assertEqual(
            numbers, [self.p1.registration_number, self.p2.registration_number]
        )

    def test_filter_invalid_numbers(self):
        resp = self.client.get("/api/patients/?registration_numbers=abc, xyz")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 0)


class VisitTests(APITestCase):
    def setUp(self):
        cache.clear()
        assistant_group, _ = Group.objects.get_or_create(name="assistant")
        doctor_group, _ = Group.objects.get_or_create(name="doctor")
        display_group, _ = Group.objects.get_or_create(name="display")

        self.assistant = User.objects.create_user(username="asst", password="pass")
        self.assistant.groups.add(assistant_group)
        self.assistant_token = Token.objects.create(user=self.assistant)

        self.doctor = User.objects.create_user(username="docuser", password="pass")
        self.doctor.groups.add(doctor_group)
        self.doctor_token = Token.objects.create(user=self.doctor)

        self.display_user = User.objects.create_user(
            username="displayuser", password="pass"
        )
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

        send_back_resp = self.client.patch(
            f"/api/visits/{visit.id}/send_back_to_waiting/"
        )
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
