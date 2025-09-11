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
    raw_id_fields = ("patient", "queue")


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("registration_number", "name", "phone", "gender", "created_at")
    list_filter = ("gender", "created_at")
    search_fields = ("name", "phone", "registration_number")
    ordering = ("-created_at",)


@admin.register(Queue)
class QueueAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)


@admin.register(PrescriptionImage)
class PrescriptionImageAdmin(admin.ModelAdmin):
    list_display = ("visit", "image_url_link", "created_at")
    list_filter = ("created_at",)
    raw_id_fields = ("visit",)

    def image_url_link(self, obj):
        from django.utils.html import format_html

        if obj.image_url:
            return format_html('<a href="{0}" target="_blank">{0}</a>', obj.image_url)
        return "No URL"

    image_url_link.short_description = "Image URL"  # type: ignore
