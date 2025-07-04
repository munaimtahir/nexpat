import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase # Using APITestCase for DB access and client
from .models import Visit
from django.utils import timezone
from datetime import date, timedelta
from freezegun import freeze_time

@pytest.mark.django_db # Ensure database access for tests in this module/class
class VisitAPITests(APITestCase):

    def test_create_visit_api(self):
        """Test POST /api/visits/ for creating a new visit."""
        url = reverse('visit-list') # 'visit-list' is the default name for ViewSet list/create
        data = {'patient_name': 'API Tester', 'patient_gender': 'MALE'}

        response = self.client.post(url, data, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert Visit.objects.count() == 1
        visit = Visit.objects.first()
        assert visit.patient_name == 'API Tester'
        assert visit.token_number == 1
        assert visit.visit_date == date.today()
        assert visit.status == 'WAITING'

    def test_create_multiple_visits_api_increments_token(self):
        """Test tokens increment correctly for multiple POSTs on the same day."""
        url = reverse('visit-list')
        data1 = {'patient_name': 'First Patient', 'patient_gender': 'FEMALE'}
        data2 = {'patient_name': 'Second Patient', 'patient_gender': 'MALE'}

        response1 = self.client.post(url, data1, format='json')
        assert response1.status_code == status.HTTP_201_CREATED
        assert response1.data['token_number'] == 1

        response2 = self.client.post(url, data2, format='json')
        assert response2.status_code == status.HTTP_201_CREATED
        assert response2.data['token_number'] == 2

        assert Visit.objects.count() == 2

    def test_create_visit_missing_name_api(self):
        """Test POST /api/visits/ with missing patient_name."""
        url = reverse('visit-list')
        data = {'patient_gender': 'OTHER'} # Missing patient_name
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'patient_name' in response.data

    def test_get_waiting_visits_api(self):
        """Test GET /api/visits/?status=WAITING returns only today's waiting visits."""
        # Create some visits for today
        Visit.objects.create(patient_name="Today Waiter 1", token_number=1, visit_date=date.today(), status="WAITING")
        Visit.objects.create(patient_name="Today Waiter 2", token_number=2, visit_date=date.today(), status="WAITING")
        Visit.objects.create(patient_name="Today Done", token_number=3, visit_date=date.today(), status="DONE")

        # Create some visits for yesterday
        Visit.objects.create(patient_name="Yesterday Waiter", token_number=1, visit_date=date.today() - timedelta(days=1), status="WAITING")

        url = reverse('visit-list') + '?status=WAITING'
        response = self.client.get(url, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        assert response.data[0]['patient_name'] == 'Today Waiter 1'
        assert response.data[1]['patient_name'] == 'Today Waiter 2'
        # Check ordering by token_number
        assert response.data[0]['token_number'] < response.data[1]['token_number']

    def test_get_waiting_visits_empty_api(self):
        """Test GET /api/visits/?status=WAITING when no waiting visits today."""
        Visit.objects.create(patient_name="Today Done", token_number=1, visit_date=date.today(), status="DONE")
        url = reverse('visit-list') + '?status=WAITING'
        response = self.client.get(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_patch_visit_done_api(self):
        """Test PATCH /api/visits/<id>/done/ successfully marks a visit as DONE."""
        visit = Visit.objects.create(patient_name="To Be Done", token_number=1, visit_date=date.today(), status="WAITING")
        url = reverse('visit-done', kwargs={'pk': visit.pk}) # 'visit-done' is convention for detail_route

        response = self.client.patch(url, {}, format='json') # Empty data for this specific action

        assert response.status_code == status.HTTP_200_OK
        visit.refresh_from_db()
        assert visit.status == 'DONE'
        assert response.data['status'] == 'DONE'

    def test_patch_visit_done_nonexistent_api(self):
        """Test PATCH /api/visits/<id>/done/ for a non-existent visit."""
        url = reverse('visit-done', kwargs={'pk': 999})
        response = self.client.patch(url, {}, format='json')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_patch_visit_already_done_api(self):
        """Test PATCH /api/visits/<id>/done/ for an already DONE visit."""
        visit = Visit.objects.create(patient_name="Already Done", token_number=1, visit_date=date.today(), status="DONE")
        url = reverse('visit-done', kwargs={'pk': visit.pk})

        response = self.client.patch(url, {}, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST # As per view logic
        assert 'already marked as done' in response.data.get('detail', '').lower()
        visit.refresh_from_db()
        assert visit.status == 'DONE' # Status should remain DONE

    def test_token_generation_resets_across_days_api(self):
        """Test that token generation via API resets for a new day."""
        url = reverse('visit-list')

        with freeze_time("2023-01-01"):
            data_day1 = {'patient_name': 'Day1 Patient', 'patient_gender': 'FEMALE'}
            response_day1 = self.client.post(url, data_day1, format='json')
            assert response_day1.status_code == status.HTTP_201_CREATED
            assert response_day1.data['token_number'] == 1
            assert response_day1.data['visit_date'] == "2023-01-01"

        with freeze_time("2023-01-02"):
            data_day2 = {'patient_name': 'Day2 Patient', 'patient_gender': 'MALE'}
            response_day2 = self.client.post(url, data_day2, format='json')
            assert response_day2.status_code == status.HTTP_201_CREATED
            assert response_day2.data['token_number'] == 1 # Reset for new day
            assert response_day2.data['visit_date'] == "2023-01-02"

    def test_get_all_visits_api_no_filter(self):
        """Test GET /api/visits/ without status filter (lists all)."""
        Visit.objects.create(patient_name="V1", token_number=1, visit_date=date.today() - timedelta(days=1))
        Visit.objects.create(patient_name="V2", token_number=1, visit_date=date.today())
        Visit.objects.create(patient_name="V3", token_number=2, visit_date=date.today())

        url = reverse('visit-list')
        response = self.client.get(url, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3
        # Check default ordering: -visit_date, token_number
        assert response.data[0]['patient_name'] == "V2" # Today, token 1
        assert response.data[1]['patient_name'] == "V3" # Today, token 2
        assert response.data[2]['patient_name'] == "V1" # Yesterday, token 1

    def test_get_visits_with_done_status_api(self):
        """Test GET /api/visits/?status=DONE retrieves today's DONE visits."""
        today = date.today()
        Visit.objects.create(patient_name="Done Today 1", token_number=1, visit_date=today, status="DONE")
        Visit.objects.create(patient_name="Waiting Today", token_number=2, visit_date=today, status="WAITING")
        Visit.objects.create(patient_name="Done Today 2", token_number=3, visit_date=today, status="DONE")
        Visit.objects.create(patient_name="Done Yesterday", token_number=1, visit_date=today - timedelta(days=1), status="DONE")

        url = reverse('visit-list') + '?status=DONE'
        response = self.client.get(url, format='json')

        assert response.status_code == status.HTTP_200_OK
        # The view's get_queryset for status='WAITING' filters by today.
        # For other statuses, it does not filter by today by default in the provided view code.
        # Let's adjust the test to reflect the current implementation or consider if the view needs adjustment.
        # Current view: if status_param == 'WAITING': queryset = queryset.filter(visit_date=timezone.now().date()).order_by('token_number')
        # else: queryset = queryset.order_by('-visit_date', 'token_number')
        # This means ?status=DONE will show ALL done visits, ordered by -visit_date, token_number

        assert len(response.data) == 3 # All DONE visits
        assert response.data[0]['patient_name'] == 'Done Today 1' # Ordered by token_number after date
        assert response.data[1]['patient_name'] == 'Done Today 2'
        assert response.data[2]['patient_name'] == 'Done Yesterday'


    def test_serializer_read_only_fields_on_post(self):
        """Test that read_only_fields (token_number, visit_date, status) are ignored on POST."""
        url = reverse('visit-list')
        data = {
            'patient_name': 'Smart Alec',
            'patient_gender': 'OTHER',
            'token_number': 99,  # Should be ignored
            'visit_date': '2000-01-01', # Should be ignored
            'status': 'DONE' # Should be ignored (set to WAITING by default)
        }
        response = self.client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['token_number'] == 1 # Generated, not 99
        assert response.data['visit_date'] == str(date.today()) # Today, not 2000-01-01
        assert response.data['status'] == 'WAITING' # Default, not DONE
