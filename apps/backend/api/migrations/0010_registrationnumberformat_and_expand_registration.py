import api.models
from django.db import migrations, models


def seed_default_format(apps, schema_editor):
    Format = apps.get_model("api", "RegistrationNumberFormat")
    Format.objects.get_or_create(
        singleton_enforcer=True,
        defaults={"digit_groups": [2, 2, 3], "separators": ["-", "-"]},
    )


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0009_bootstrap_groups"),
    ]

    operations = [
        migrations.CreateModel(
            name="RegistrationNumberFormat",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "singleton_enforcer",
                    models.BooleanField(default=True, editable=False, unique=True),
                ),
                ("digit_groups", models.JSONField(default=list)),
                ("separators", models.JSONField(default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["-updated_at"]},
        ),
        migrations.AlterField(
            model_name="patient",
            name="registration_number",
            field=models.CharField(
                max_length=15,
                primary_key=True,
                serialize=False,
                unique=True,
                validators=[api.models.validate_registration_number_format],
            ),
        ),
        migrations.RunPython(seed_default_format, migrations.RunPython.noop),
    ]
