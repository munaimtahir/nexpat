from django.contrib import admin
from .models import Visit

@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ('token_number', 'patient_name', 'patient_gender', 'visit_date', 'status', 'created_at')
    list_filter = ('status', 'visit_date', 'patient_gender')
    search_fields = ('patient_name', 'token_number')
    date_hierarchy = 'visit_date'
    ordering = ('-visit_date', 'token_number')
