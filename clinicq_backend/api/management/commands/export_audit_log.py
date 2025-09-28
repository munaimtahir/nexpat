import logging
import json
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Patient, Visit, Queue

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Export audit log data for verification and demonstrate import/export pipeline'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Number of days to export (default: 7)'
        )
        parser.add_argument(
            '--format', 
            choices=['json', 'csv'],
            default='json',
            help='Output format (default: json)'
        )

    def handle(self, *args, **options):
        days = options['days']
        format_type = options['format']
        
        # Calculate date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        logger.info(f"Starting audit log export for {days} days ({start_date} to {end_date})")
        
        # Export patient data
        patients = Patient.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        ).values(
            'registration_number', 'name', 'gender', 'phone', 'created_at', 'updated_at'
        )
        
        # Export visit data 
        visits = Visit.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        ).select_related('patient', 'queue').values(
            'id', 'token_number', 'visit_date', 'status',
            'patient__registration_number', 'patient__name',
            'queue__name', 'created_at', 'updated_at'
        )
        
        # Export queue data
        queues = Queue.objects.all().values(
            'id', 'name', 'created_at', 'updated_at'
        )
        
        audit_data = {
            'export_metadata': {
                'timestamp': timezone.now().isoformat(),
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'record_counts': {
                    'patients': len(patients),
                    'visits': len(visits),
                    'queues': len(queues)
                }
            },
            'patients': list(patients),
            'visits': list(visits),
            'queues': list(queues)
        }
        
        if format_type == 'json':
            # Convert datetime objects to strings for JSON serialization
            def json_serializer(obj):
                if isinstance(obj, datetime):
                    return obj.isoformat()
                raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
            
            output = json.dumps(audit_data, indent=2, default=json_serializer)
            self.stdout.write(output)
        else:
            # Simple CSV output
            self.stdout.write("Entity,ID,Name,Status,Created,Updated")
            for patient in patients:
                self.stdout.write(f"Patient,{patient['registration_number']},{patient['name']},,{patient['created_at']},{patient['updated_at']}")
            for visit in visits:
                self.stdout.write(f"Visit,{visit['id']},{visit['patient__name']},{visit['status']},{visit['created_at']},{visit['updated_at']}")
        
        # Log completion
        logger.info(f"Audit log export completed. Exported {len(patients)} patients, {len(visits)} visits, {len(queues)} queues")
        
        self.style.SUCCESS(f"Successfully exported audit data for {days} days")