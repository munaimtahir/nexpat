from rest_framework.test import APITestCase
from django.contrib.auth.models import User, Group
from rest_framework.authtoken.models import Token
from api.models import Patient, Queue

class PatientCRUDTests(APITestCase):
    def setUp(self):
        doctor_group, _ = Group.objects.get_or_create(name="doctor")
        user = User.objects.create_user(username="doc", password="pass")
        user.groups.add(doctor_group)
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_patient_crud(self):
        # Create
        create_resp = self.client.post('/api/patients/', {
            'name': 'John Doe',
            'gender': 'MALE',
            'phone': '1234567890'
        }, format='json')
        self.assertEqual(create_resp.status_code, 201)
        reg_no = create_resp.data['registration_number']

        # Retrieve
        get_resp = self.client.get(f'/api/patients/{reg_no}/')
        self.assertEqual(get_resp.status_code, 200)
        self.assertEqual(get_resp.data['name'], 'John Doe')

        # Update
        patch_resp = self.client.patch(
            f'/api/patients/{reg_no}/',
            {'phone': '0987654321'},
            format='json'
        )
        self.assertEqual(patch_resp.status_code, 200)
        self.assertEqual(patch_resp.data['phone'], '0987654321')

        # Delete
        del_resp = self.client.delete(f'/api/patients/{reg_no}/')
        self.assertEqual(del_resp.status_code, 204)
        self.assertFalse(Patient.objects.filter(registration_number=reg_no).exists())


class VisitTests(APITestCase):
    def setUp(self):
        assistant_group, _ = Group.objects.get_or_create(name="assistant")
        self.assistant = User.objects.create_user(username="asst", password="pass")
        self.assistant.groups.add(assistant_group)
        self.assistant_token = Token.objects.create(user=self.assistant)

        self.patient = Patient.objects.create(name='Alice', gender='FEMALE')
        self.queue1, _ = Queue.objects.get_or_create(name='General')
        self.queue2, _ = Queue.objects.get_or_create(name='Special')

    def test_visit_creation_assigns_token(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.assistant_token.key}")
        resp1 = self.client.post('/api/visits/', {
            'patient': self.patient.registration_number,
            'queue': self.queue1.id
        }, format='json')
        self.assertEqual(resp1.status_code, 201)
        self.assertEqual(resp1.data['token_number'], 1)

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.assistant_token.key}")
        resp2 = self.client.post('/api/visits/', {
            'patient': self.patient.registration_number,
            'queue': self.queue1.id
        }, format='json')
        self.assertEqual(resp2.status_code, 201)
        self.assertEqual(resp2.data['token_number'], 2)

    def test_queue_filter_returns_only_selected_queue(self):
        # Create visits in two queues
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.assistant_token.key}")
        self.client.post('/api/visits/', {
            'patient': self.patient.registration_number,
            'queue': self.queue1.id
        }, format='json')
        self.client.post('/api/visits/', {
            'patient': self.patient.registration_number,
            'queue': self.queue2.id
        }, format='json')
        resp = self.client.get(f'/api/visits/?status=WAITING&queue={self.queue1.id}')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        self.assertEqual(resp.data[0]['queue'], self.queue1.id)
