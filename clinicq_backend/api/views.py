from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Visit
from .serializers import VisitSerializer, VisitStatusUpdateSerializer
from django.utils import timezone

class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.all()
    serializer_class = VisitSerializer

    def get_queryset(self):
        queryset = Visit.objects.all()

        # Filter by today's date by default for general listing unless specified otherwise
        # For this application, we are mostly interested in today's visits.
        # However, the requirement is /api/visits/?status=WAITING, implying date isn't a primary filter here.
        # Let's stick to the requirement and filter by status if provided.

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status__iexact=status_param)

        # Requirement: "List waiting tokens, auto-refresh 5 s, highlight first waiting."
        # This implies ordering by token_number for waiting lists.
        # And also by date, as tokens reset daily.
        if status_param == 'WAITING':
             queryset = queryset.filter(visit_date=timezone.now().date()).order_by('token_number')
        else:
            # Default ordering for other views or if no status specified
            queryset = queryset.order_by('-visit_date', 'token_number')

        return queryset

    # POST /api/visits/ is handled by ModelViewSet.create, which uses VisitSerializer.create()
    # GET /api/visits/?status=WAITING is handled by ModelViewSet.list with get_queryset() filtering

    @action(detail=True, methods=['patch'], serializer_class=VisitStatusUpdateSerializer)
    def done(self, request, pk=None):
        visit = self.get_object()
        if visit.status == 'DONE':
            return Response({'detail': 'Visit is already marked as done.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = VisitStatusUpdateSerializer(visit, data={'status': 'DONE'}, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return the full visit details after marking as done
            full_serializer = VisitSerializer(visit)
            return Response(full_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
