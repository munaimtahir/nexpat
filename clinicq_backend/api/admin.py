from django.contrib import admin
from .models import Visit, Patient, Queue, PrescriptionImage


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = (
        "token_number",
        "patient",
        "queue",
        "visit_date",
        "status",
        "created_at",
    )
    list_filter = ("status", "visit_date", "queue")
    search_fields = ("patient__name", "token_number")
    date_hierarchy = "visit_date"
    ordering = ("-visit_date", "token_number")


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = (
        "registration_number",
        "name",
        "phone",
        "gender",
        "created_at",
    )
    list_filter = ("gender", "created_at")
    search_fields = ("registration_number", "name", "phone")
    ordering = ("-created_at",)


@admin.register(Queue)
class QueueAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(PrescriptionImage)
class PrescriptionImageAdmin(admin.ModelAdmin):
    list_display = ("visit", "drive_file_id", "created_at")
    search_fields = ("visit__patient__name", "drive_file_id")
    ordering = ("-created_at",)
