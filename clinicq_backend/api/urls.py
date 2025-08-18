from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VisitViewSet,
    PatientViewSet,
    QueueViewSet,
    PrescriptionImageViewSet,
)

router = DefaultRouter()
router.register(r'visits', VisitViewSet, basename='visit')
router.register(r'patients', PatientViewSet, basename='patient') # Added patient route
router.register(r'queues', QueueViewSet, basename='queue') # Added queue route
router.register(r'prescriptions', PrescriptionImageViewSet, basename='prescription')

urlpatterns = [
    path('', include(router.urls)),
    # The patient search endpoint is registered as an action within PatientViewSet
    # so it will be available at /api/patients/search/
]
