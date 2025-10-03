from django.db import migrations

def create_groups(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    for name in ["Doctor", "Assistant"]:
        Group.objects.get_or_create(name=name)

class Migration(migrations.Migration):
    dependencies = [("api", "0008_alter_patient_registration_number")]
    operations = [migrations.RunPython(create_groups, migrations.RunPython.noop)]