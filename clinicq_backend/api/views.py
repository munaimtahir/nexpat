from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from django.db.models import Q  # For complex lookups (patient search)
import datetime  # Required for date operations
import logging

from .models import Visit, Patient, Queue, PrescriptionImage
from .serializers import (
    VisitSerializer,
    VisitStatusUpdateSerializer,
    PatientSerializer,
    QueueSerializer,
    PrescriptionImageSerializer,
)
from .pagination import StandardResultsSetPagination
from .google_drive import upload_prescription_image
from .permissions import IsDoctor, IsAssistant

logger = logging.getLogger(__name__)

try:
    from googleapiclient.errors import GoogleApiError
except Exception:  # pragma: no cover - optional dependency
    GoogleApiError = None


@method_decorator(cache_page(60 * 5), name="list")
@method_decorator(cache_page(60 * 5), name="retrieve")
class QueueViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint that allows queues to be viewed."""

    queryset = Queue.objects.all().order_by("name")
    serializer_class = QueueSerializer
    permission_classes = [permissions.IsAuthenticated]


@method_decorator(cache_page(60 * 5), name="list")
@method_decorator(cache_page(60 * 5), name="retrieve")
class PatientViewSet(viewsets.ModelViewSet):
    """API endpoint that allows patients to be viewed or edited."""

    queryset = Patient.objects.all().order_by("registration_number")
    serializer_class = PatientSerializer
    pagination_class = StandardResultsSetPagination
    # Use registration_number for single patient lookups
    lookup_field = "registration_number"
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == "destroy":
            permission_classes = [IsDoctor]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [perm() for perm in permission_classes]

    def get_queryset(self):
        """Optionally filter patients by a comma-separated list of
        registration numbers.
        """
        queryset = super().get_queryset()
        reg_nums = self.request.query_params.get("registration_numbers")
        if reg_nums:
            numbers = [n.strip() for n in reg_nums.split(",") if n.strip().isdigit()]
            if numbers:
                queryset = queryset.filter(registration_number__in=numbers)
            else:
                return Patient.objects.none()
        return queryset

    def perform_create(self, serializer):
        cache.clear()
        return super().perform_create(serializer)

    def perform_update(self, serializer):
        cache.clear()
        return super().perform_update(serializer)

    def perform_destroy(self, instance):
        cache.clear()
        return super().perform_destroy(instance)

    @method_decorator(cache_page(60 * 5))
    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        """
        Search for patients by registration number,
        name fragment, or phone fragment.
        Usage: GET /api/patients/search/?q=<query_term>
        """
        query = request.query_params.get("q", None)
        if not query:
            return Response(
                {"error": "Query parameter 'q' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Build Q objects for searching
        # registration_number: exact match (if query is numeric)
        # name: case-insensitive contains
        # phone: case-insensitive contains
        # (searches for part of a phone number)

        filters = Q(name__icontains=query) | Q(phone__icontains=query)
        if query.isdigit():
            filters |= Q(registration_number=int(query))

        patients = Patient.objects.filter(filters)

        # Paginate results if pagination is configured globally,
        # otherwise return all
        page = self.paginate_queryset(patients)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(patients, many=True)
        return Response(serializer.data)


class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.all()
    serializer_class = VisitSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsAssistant]
        elif self.action == "done":
            permission_classes = [IsDoctor]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [perm() for perm in permission_classes]

    def get_queryset(self):
        """
        Filter visits:
        - By status (e.g., 'WAITING'). If 'WAITING', defaults to today's date.
        - By queue ID using `queue=<id>`.
        Ordering is based on queue name, then token number.
        """
        queryset = Visit.objects.select_related(
            "patient", "queue"
        ).all()  # Optimize by fetching related objects

        status_param = self.request.query_params.get("status")
        queue_id_param = self.request.query_params.get("queue")

        if status_param:
            queryset = queryset.filter(status__iexact=status_param)
            if status_param.upper() == "WAITING":
                # For WAITING status, always filter by today's date
                queryset = queryset.filter(visit_date=timezone.now().date())

        if queue_id_param:
            queryset = queryset.filter(queue__id=queue_id_param)

        # Default ordering
        return queryset.order_by("visit_date", "queue__name", "token_number")

    def perform_create(self, serializer):
        """
        Custom logic for creating a Visit:
        - Auto-assign token_number (per queue, per day).
        - Set visit_date to today.
        - Set status to 'WAITING'.
        """
        today = datetime.date.today()
        queue_instance = serializer.validated_data["queue"]

        # Determine next token number for this specific queue and date
        last_visit_in_queue_today = (
            Visit.objects.filter(queue=queue_instance, visit_date=today)
            .order_by("-token_number")
            .first()
        )

        next_token_number = 1
        if last_visit_in_queue_today:
            next_token_number = last_visit_in_queue_today.token_number + 1

        # Save the visit with the auto-generated and assigned fields
        # The serializer already has 'patient' (Patient instance) and
        # 'queue' (Queue instance) from validated_data.
        serializer.save(
            token_number=next_token_number,
            visit_date=today,
            status="WAITING",
        )

    @action(
        detail=True,
        methods=["patch"],
        serializer_class=VisitStatusUpdateSerializer,
    )
    def done(self, request, pk=None):
        visit = self.get_object()
        if visit.status == "DONE":
            return Response(
                {"detail": "Visit is already marked as done."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Use the specific serializer for status updates
        status_serializer = VisitStatusUpdateSerializer(
            visit, data={"status": "DONE"}, partial=True
        )
        if status_serializer.is_valid():
            status_serializer.save()
            # Return the full visit details using the main VisitSerializer
            full_visit_serializer = VisitSerializer(
                visit, context={"request": request}
            )  # Add context for HATEOAS links if used
            return Response(full_visit_serializer.data)
        return Response(
            status_serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class PrescriptionImageViewSet(viewsets.ModelViewSet):
    queryset = PrescriptionImage.objects.all().order_by("-created_at")
    serializer_class = PrescriptionImageSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        visit_id = self.request.query_params.get("visit")
        patient_reg = self.request.query_params.get("patient")
        if visit_id:
            queryset = queryset.filter(visit_id=visit_id)
        if patient_reg:
            queryset = queryset.filter(
                visit__patient__registration_number=patient_reg
            )
        return queryset

    def create(self, request, *args, **kwargs):
        image_file = request.FILES.get("image")
        visit_id = request.data.get("visit")
        if not image_file or not visit_id:
            return Response(
                {"detail": "visit and image are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        visit = get_object_or_404(Visit, pk=visit_id)
        file_id = ""
        file_url = ""
        if GoogleApiError:
            try:
                file_id, file_url = upload_prescription_image(image_file)
            except GoogleApiError as e:
                logger.error(
                    "Google API error while uploading prescription image: %s",
                    e,
                    exc_info=True,
                )
            except Exception as e:
                logger.error(
                    "Unexpected error while uploading prescription image: %s",
                    e,
                    exc_info=True,
                )
        else:
            try:
                file_id, file_url = upload_prescription_image(image_file)
            except Exception as e:
                logger.error(
                    "Unexpected error while uploading prescription image: %s",
                    e,
                    exc_info=True,
                )
        instance = PrescriptionImage.objects.create(
            visit=visit,
            drive_file_id=file_id or "",
            image_url=file_url or "",
        )
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
