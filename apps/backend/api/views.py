from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from django.db.models import Q  # For complex lookups (patient search)
import datetime  # Required for date operations
import logging
import re  # For registration number pattern matching

from .models import (
    Visit,
    Patient,
    Queue,
    PrescriptionImage,
    RegistrationNumberFormat,
    get_registration_number_format,
)
from .serializers import (
    VisitSerializer,
    VisitStatusSerializer,
    PatientSerializer,
    QueueSerializer,
    PrescriptionImageSerializer,
    RegistrationNumberFormatSerializer,
)
from .pagination import StandardResultsSetPagination
from .google_drive import upload_prescription_image
from .permissions import IsDoctor, IsAssistant, IsDisplay

logger = logging.getLogger(__name__)

try:
    from googleapiclient.errors import GoogleApiError
except Exception:  # pragma: no cover - optional dependency
    GoogleApiError = None


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    """Return the current user's username and role memberships."""
    roles = list(request.user.groups.values_list("name", flat=True))
    return Response({"username": request.user.username, "roles": roles})


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(request):
    """
    Health check endpoint for monitoring and connectivity testing.

    Parameters:
        request (Request): The HTTP request object.

    Returns:
        Response: A JSON response containing the service status, name, and current timestamp.
    """
    return Response(
        {
            "status": "ok",
            "service": "clinicq-backend",
            "timestamp": timezone.now().isoformat(),
        }
    )


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
        format_config = get_registration_number_format()
        pattern = re.compile(format_config["pattern"])
        reg_nums = self.request.query_params.get("registration_numbers")
        if reg_nums:
            raw_numbers = [num.strip() for num in reg_nums.split(",")]

            if len(raw_numbers) > 50:
                raise ValidationError(
                    {"registration_numbers": "A maximum of 50 registration numbers are allowed."}
                )

            numbers = []
            for num in raw_numbers:
                # Accept formatted registration numbers based on configuration
                if pattern.match(num):
                    numbers.append(num)
                # Also accept old numeric format for backward compatibility
                # during transition
                elif num.isdigit():
                    if len(num) > format_config["total_digits"]:
                        raise ValidationError(
                            {
                                "registration_numbers": (
                                    "Registration numbers may not exceed "
                                    f"{format_config['total_digits']} digits."
                                ),
                            }
                        )
                    numbers.append(num)

            if numbers:
                queryset = queryset.filter(registration_number__in=numbers)
            else:
                # If all provided registration numbers are invalid,
                # return empty
                return Patient.objects.none()
        return queryset

    def perform_create(self, serializer):
        cache.clear()
        patient = serializer.save()
        logger.info(
            f"Patient created: {patient.registration_number} ({patient.name}) "
            f"by user {self.request.user.username}"
        )

    def perform_update(self, serializer):
        cache.clear()
        old_data = {
            "name": self.get_object().name,
            "phone": self.get_object().phone,
            "gender": self.get_object().gender,
        }
        patient = serializer.save()
        logger.info(
            f"Patient updated: {patient.registration_number} "
            f"by user {self.request.user.username}. "
            f"Old data: {old_data}, "
            f"New data: {{name: {patient.name}, phone: {patient.phone}, "
            f"gender: {patient.gender}}}"
        )

    def perform_destroy(self, instance):
        cache.clear()
        logger.warning(
            f"Patient deleted: {instance.registration_number} ({instance.name}) "
            f"by user {self.request.user.username}"
        )
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
        # registration_number: exact match (if query matches format or is numeric)
        # name: case-insensitive contains
        # phone: case-insensitive contains
        # (searches for part of a phone number)

        filters = Q(name__icontains=query) | Q(phone__icontains=query)

        format_config = get_registration_number_format()
        pattern = re.compile(format_config["pattern"])

        # Check if query matches registration number format
        if pattern.match(query):
            filters |= Q(registration_number=query)
        # Also check for old numeric format for backward compatibility
        elif query.isdigit():
            # For numeric queries, try both exact match and also try to
            # find registration numbers that might match this pattern
            filters |= Q(registration_number=query)

        patients = Patient.objects.filter(filters).order_by("registration_number")

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
        elif self.action in ["start", "in_room", "send_back_to_waiting", "done"]:
            permission_classes = [IsDoctor]
        elif (
            self.action == "list"
            and self.request.user.groups.filter(name__iexact="display").exists()
        ):
            permission_classes = [IsDisplay]
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
            statuses = [s.strip().upper() for s in status_param.split(",")]
            queryset = queryset.filter(status__in=statuses)
            if "WAITING" in statuses:
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

        visit = serializer.save(
            token_number=next_token_number,
            visit_date=today,
            status="WAITING",
        )

        logger.info(
            f"Visit created: Token {visit.token_number} "
            f"for patient {visit.patient.registration_number} "
            f"in queue {visit.queue.name} "
            f"by user {self.request.user.username}"
        )

    def _update_status(self, request, pk, new_status, expected_current_statuses):
        visit = self.get_object()
        old_status = visit.status

        if visit.status not in expected_current_statuses:
            logger.warning(
                f"Invalid status transition attempted: "
                f"Visit {visit.id} (Token {visit.token_number}) "
                f"from {old_status} to {new_status} "
                f"by user {request.user.username}. "
                f"Expected current status to be one of: {expected_current_statuses}"
            )
            return Response(
                {
                    "detail": f"Visit must be in one of the following "
                    f"states: {', '.join(expected_current_statuses)}"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = VisitStatusSerializer(visit, data={"status": new_status}, partial=True)
        if serializer.is_valid():
            serializer.save()
            full_visit_serializer = VisitSerializer(visit, context={"request": request})

            return Response(full_visit_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["patch"])
    def start(self, request, pk=None):
        return self._update_status(request, pk, "START", ["WAITING"])

    @action(detail=True, methods=["patch"])
    def in_room(self, request, pk=None):
        return self._update_status(request, pk, "IN_ROOM", ["START"])

    @action(detail=True, methods=["patch"])
    def send_back_to_waiting(self, request, pk=None):
        return self._update_status(request, pk, "WAITING", ["START", "IN_ROOM"])

    @action(detail=True, methods=["patch"])
    def done(self, request, pk=None):
        return self._update_status(request, pk, "DONE", ["IN_ROOM"])


class PrescriptionImageViewSet(viewsets.ModelViewSet):
    queryset = PrescriptionImage.objects.all().order_by("-created_at")
    serializer_class = PrescriptionImageSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            permission_classes = [IsDoctor]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [perm() for perm in permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        visit_id = self.request.query_params.get("visit")
        patient_reg = self.request.query_params.get("patient")
        if visit_id:
            queryset = queryset.filter(visit_id=visit_id)
        if patient_reg:
            queryset = queryset.filter(visit__patient__registration_number=patient_reg)
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
class RegistrationNumberFormatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH"):
            return [IsDoctor()]
        return super().get_permissions()

    def get(self, request):
        instance = RegistrationNumberFormat.load()
        serializer = RegistrationNumberFormatSerializer(instance)
        payload = serializer.data
        payload["pattern"] = get_registration_number_format()["pattern"]
        return Response(payload)

    def put(self, request):
        instance = RegistrationNumberFormat.load()
        serializer = RegistrationNumberFormatSerializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        cache.clear()
        payload = serializer.data
        payload["pattern"] = get_registration_number_format()["pattern"]
        return Response(payload)

    def patch(self, request):
        instance = RegistrationNumberFormat.load()
        serializer = RegistrationNumberFormatSerializer(
            instance, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        cache.clear()
        payload = serializer.data
        payload["pattern"] = get_registration_number_format()["pattern"]
        return Response(payload)
