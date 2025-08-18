from django.contrib import admin
from .models import Visit

@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ('token_number', 'patient', 'queue', 'visit_date', 'status', 'created_at')
    list_filter = ('status', 'visit_date', 'queue')
    search_fields = ('patient__name', 'token_number')
    date_hierarchy = 'visit_date'
    ordering = ('-visit_date', 'token_number')
