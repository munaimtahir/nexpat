from rest_framework import serializers
from .models import Visit
from django.utils import timezone
import datetime

class VisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = ['id', 'token_number', 'patient_name', 'patient_gender', 'visit_date', 'status', 'created_at']
        read_only_fields = ['token_number', 'visit_date', 'status', 'created_at']

    def create(self, validated_data):
        today = datetime.date.today()
        last_visit_today = Visit.objects.filter(visit_date=today).order_by('-token_number').first()

        next_token_number = 1
        if last_visit_today:
            next_token_number = last_visit_today.token_number + 1

        validated_data['token_number'] = next_token_number
        validated_data['visit_date'] = today
        validated_data['status'] = 'WAITING' # Ensure status is WAITING on creation

        return Visit.objects.create(**validated_data)

class VisitStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = ['status']

    def validate_status(self, value):
        if value != 'DONE':
            raise serializers.ValidationError("This endpoint only allows updating status to 'DONE'.")
        return value
