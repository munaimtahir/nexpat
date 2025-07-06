from rest_framework import serializers
from .models import Visit, Patient, Queue # Added Patient and Queue
from django.utils import timezone
import datetime

class PatientSerializer(serializers.ModelSerializer):
    last_5_visit_dates = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'registration_number', 'name', 'phone', 'gender',
            'created_at', 'updated_at', 'last_5_visit_dates'
        ]
        read_only_fields = ['registration_number', 'created_at', 'updated_at']

    def get_last_5_visit_dates(self, obj):
        return obj.visits.order_by('-visit_date').values_list('visit_date', flat=True)[:5]

class QueueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Queue
        fields = ['id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class VisitSerializer(serializers.ModelSerializer):
    # Read-only fields for displaying related data
    patient_registration_number = serializers.CharField(source='patient.registration_number', read_only=True, allow_null=True)
    patient_full_name = serializers.CharField(source='patient.name', read_only=True, allow_null=True)
    queue_name = serializers.CharField(source='queue.name', read_only=True, allow_null=True)

    # Writeable fields for linking to Patient and Queue
    # The client will send 'patient' (registration_number) and 'queue' (id).
    patient = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(),
        # source='patient', # This is implied by the field name
        # Not using registration_number as pk directly in DRF for relations by default,
        # DRF uses actual PK of Patient model. Client will send Patient's PK (which is reg_number).
        required=True # A visit must be associated with a patient.
    )
    queue = serializers.PrimaryKeyRelatedField(
        queryset=Queue.objects.all(),
        # source='queue', # Implied
        required=True # A visit must be associated with a queue.
    )

    # The model fields patient_name and patient_gender are kept for historical data (see model definition comments)
    # and are populated from the linked Patient object upon saving if not already there (e.g. via data migration).
    # For new visits created via API, these fields on Visit model will be populated from the Patient instance.
    # So, we make them read-only in the serializer to avoid confusion.

    class Meta:
        model = Visit
        fields = [
            'id', 'token_number',
            'visit_date', 'status',
            'created_at', 'updated_at', # model's updated_at
            'patient', # write-only FK to Patient model (expects Patient PK)
            'queue',   # write-only FK to Queue model (expects Queue PK)
            'patient_registration_number', # read-only representation
            'patient_full_name', # read-only representation
            'queue_name', # read-only representation
            'patient_name', # read-only (historical/derived)
            'patient_gender' # read-only (historical/derived)
        ]
        read_only_fields = [
            'token_number', 'visit_date', 'status',
            'created_at', 'updated_at',
            'patient_registration_number', 'patient_full_name', 'queue_name',
            'patient_name', 'patient_gender' # Explicitly make these read-only
        ]

    # The token generation logic from the old VisitSerializer.create method
    # needs to be moved to the ViewSet's perform_create method, as it now
    # depends on the selected Queue.
    # def create(self, validated_data):
    #     ... logic moved to ViewSet ...
    #     return Visit.objects.create(**validated_data)

class VisitStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = ['status']

    def validate_status(self, value):
        if value != 'DONE':
            raise serializers.ValidationError("This endpoint only allows updating status to 'DONE'.")
        return value
