from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers
from .models import (
    Visit,
    Patient,
    Queue,
    PrescriptionImage,
    RegistrationNumberFormat,
    get_registration_number_format,
    ensure_format_can_fit_existing_patients,
    reformat_patients_to_format,
)


class PatientSerializer(serializers.ModelSerializer):
    last_5_visit_dates = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            "registration_number",
            "name",
            "phone",
            "gender",
            "created_at",
            "updated_at",
            "last_5_visit_dates",
        ]
        read_only_fields = ["registration_number", "created_at", "updated_at"]

    def get_last_5_visit_dates(self, obj):
        return obj.visits.order_by("-visit_date").values_list("visit_date", flat=True)[:5]


class QueueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Queue
        fields = ["id", "name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class VisitSerializer(serializers.ModelSerializer):
    # Read-only fields for displaying related data
    patient_registration_number = serializers.CharField(
        source="patient.registration_number",
        read_only=True,
    )
    patient_full_name = serializers.CharField(
        source="patient.name",
        read_only=True,
    )
    queue_name = serializers.CharField(
        source="queue.name",
        read_only=True,
    )

    # Writeable fields for linking to Patient and Queue
    # The client will send 'patient' (registration_number) and 'queue' (id).
    patient = serializers.PrimaryKeyRelatedField(
        queryset=Patient.objects.all(),
        required=True,  # A visit must be associated with a patient.
    )
    queue = serializers.PrimaryKeyRelatedField(
        queryset=Queue.objects.all(),
        required=True,  # A visit must be associated with a queue.
    )

    class Meta:
        model = Visit
        fields = [
            "id",
            "token_number",
            "visit_date",
            "status",
            "created_at",
            "updated_at",  # model's updated_at
            "patient",  # write-only FK to Patient model (expects Patient PK)
            "queue",  # write-only FK to Queue model (expects Queue PK)
            "patient_registration_number",  # read-only representation
            "patient_full_name",  # read-only representation
            "queue_name",  # read-only representation
        ]
        read_only_fields = [
            "token_number",
            "visit_date",
            "status",
            "created_at",
            "updated_at",
            "patient_registration_number",
            "patient_full_name",
            "queue_name",
        ]

    # The token generation logic from the old VisitSerializer.create method
    # needs to be moved to the ViewSet's perform_create method, as it now
    # depends on the selected Queue.
    # def create(self, validated_data):
    #     ... logic moved to ViewSet ...
    #     return Visit.objects.create(**validated_data)


class VisitStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = ["status"]


class PrescriptionImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionImage
        fields = ["id", "visit", "drive_file_id", "image_url", "created_at"]
        read_only_fields = ["id", "drive_file_id", "image_url", "created_at"]


class RegistrationNumberFormatSerializer(serializers.ModelSerializer):
    digit_groups = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
    )
    separators = serializers.ListField(
        child=serializers.CharField(allow_blank=False),
        allow_empty=True,
    )
    total_digits = serializers.SerializerMethodField()
    formatted_length = serializers.SerializerMethodField()

    class Meta:
        model = RegistrationNumberFormat
        fields = ["digit_groups", "separators", "total_digits", "formatted_length"]

    def get_total_digits(self, obj):
        return obj.total_digits

    def get_formatted_length(self, obj):
        return obj.formatted_length

    def validate(self, attrs):
        digit_groups = attrs.get("digit_groups")
        separators = attrs.get("separators")

        if self.instance:
            if digit_groups is None:
                digit_groups = list(self.instance.digit_groups)
            if separators is None:
                separators = list(self.instance.separators)

        if digit_groups is None:
            digit_groups = []
        if separators is None:
            separators = []

        if len(separators) != max(len(digit_groups) - 1, 0):
            raise serializers.ValidationError(
                {
                    "separators": (
                        "Separators count must be exactly one less "
                        "than the number of digit groups."
                    ),
                }
            )

        invalid_separators = [sep for sep in separators if sep not in {"-", "+"}]
        if invalid_separators:
            raise serializers.ValidationError(
                {"separators": "Only '-' and '+' separators are supported."}
            )

        total_digits = sum(digit_groups)
        if total_digits > 15:
            raise serializers.ValidationError({"digit_groups": "Total digits cannot exceed 15."})

        formatted_length = total_digits + len(separators)
        if formatted_length > 15:
            raise serializers.ValidationError(
                {
                    "digit_groups": (
                        "Formatted length (digits + separators) cannot exceed 15 characters."
                    )
                }
            )

        return attrs

    def update(self, instance, validated_data):
        instance.digit_groups = validated_data.get("digit_groups", instance.digit_groups)
        instance.separators = validated_data.get("separators", instance.separators)
        try:
            instance.full_clean()
            ensure_format_can_fit_existing_patients(instance)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict or exc.messages) from exc
        with transaction.atomic():
            instance.save(update_fields=["digit_groups", "separators", "updated_at"])
            reformat_patients_to_format(instance)
        # Refresh cache so future validations use the updated format
        get_registration_number_format(force_reload=True)
        return instance
