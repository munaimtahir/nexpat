from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Visit, Patient, Queue # Added Patient, Queue
from .serializers import (
    VisitSerializer, VisitStatusUpdateSerializer,
    PatientSerializer, QueueSerializer # Added PatientSerializer, QueueSerializer
)
from django.utils import timezone
import datetime # Required for date operations
from django.db.models import Q # For complex lookups (patient search)


class QueueViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows queues to be viewed.
    Provides `list` and `retrieve` actions.
    """
    queryset = Queue.objects.all().order_by('name')
    serializer_class = QueueSerializer

class PatientViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows patients to be viewed or edited.
    Provides full CRUD operations.
    Search functionality is available via /api/patients/search/?q=
    """
    queryset = Patient.objects.all().order_by('registration_number')
    serializer_class = PatientSerializer
    lookup_field = 'registration_number' # Use registration_number for single patient lookups (/api/patients/{registration_number}/)

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        """
        Search for patients by registration number, name fragment, or phone fragment.
        Usage: GET /api/patients/search/?q=<query_term>
        """
        query = request.query_params.get('q', None)
        if not query:
            return Response({"error": "Query parameter 'q' is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Build Q objects for searching
        # registration_number: exact match (if query is numeric)
        # name: case-insensitive contains
        # phone: case-insensitive contains (searches for part of a phone number)

        filters = Q(name__icontains=query) | Q(phone__icontains=query)
        if query.isdigit():
            filters |= Q(registration_number=int(query))

        patients = Patient.objects.filter(filters)

        # Paginate results if pagination is configured globally, otherwise return all
        page = self.paginate_queryset(patients)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(patients, many=True)
        return Response(serializer.data)

class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.all() # Default queryset
    serializer_class = VisitSerializer

    def get_queryset(self):
        """
        Filter visits:
        - By status (e.g., 'WAITING'). If 'WAITING', defaults to today's date.
        - By queue ID using `queue=<id>`.
        Ordering is based on queue name, then token number.
        """
        queryset = Visit.objects.select_related('patient', 'queue').all() # Optimize by fetching related objects

        status_param = self.request.query_params.get('status')
        queue_id_param = self.request.query_params.get('queue')

        if status_param:
            queryset = queryset.filter(status__iexact=status_param)
            if status_param.upper() == 'WAITING':
                # For WAITING status, always filter by today's date
                queryset = queryset.filter(visit_date=timezone.now().date())

        if queue_id_param:
            queryset = queryset.filter(queue__id=queue_id_param)

        # Default ordering
        return queryset.order_by('visit_date', 'queue__name', 'token_number')


    def perform_create(self, serializer):
        """
        Custom logic for creating a Visit:
        - Auto-assign token_number (per queue, per day).
        - Set visit_date to today.
        - Set status to 'WAITING'.
        - Populate Visit.patient_name and Visit.patient_gender from the linked Patient instance.
        """
        today = datetime.date.today()
        queue_instance = serializer.validated_data['queue']
        patient_instance = serializer.validated_data['patient']

        # Determine next token number for this specific queue and date
        last_visit_in_queue_today = Visit.objects.filter(
            queue=queue_instance,
            visit_date=today
        ).order_by('-token_number').first()

        next_token_number = 1
        if last_visit_in_queue_today:
            next_token_number = last_visit_in_queue_today.token_number + 1

        # Save the visit with the auto-generated and assigned fields
        # The serializer already has 'patient' (Patient instance) and 'queue' (Queue instance)
        # from validated_data.
        serializer.save(
            token_number=next_token_number,
            visit_date=today,
            status='WAITING',
            # These fields on the Visit model are for historical/denormalized data.
            # Populate them from the authoritative Patient record.
            patient_name=patient_instance.name,
            patient_gender=patient_instance.gender
        )

    @action(detail=True, methods=['patch'], serializer_class=VisitStatusUpdateSerializer)
    def done(self, request, pk=None):
        visit = self.get_object()
        if visit.status == 'DONE':
            return Response({'detail': 'Visit is already marked as done.'}, status=status.HTTP_400_BAD_REQUEST)

        # Use the specific serializer for status updates
        status_serializer = VisitStatusUpdateSerializer(visit, data={'status': 'DONE'}, partial=True)
        if status_serializer.is_valid():
            status_serializer.save()
            # Return the full visit details using the main VisitSerializer
            full_visit_serializer = VisitSerializer(visit, context={'request': request}) # Add context for HATEOAS links if used
            return Response(full_visit_serializer.data)
        return Response(status_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
