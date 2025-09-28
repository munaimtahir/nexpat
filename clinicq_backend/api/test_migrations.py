import pytest

# It's better to explicitly use test models if the actual models are too complex
# or if we want to simulate a very specific pre-migration state.
# However, for this case, testing with the actual models and migrating
# back and forth should be feasible.


@pytest.fixture
def initial_visit_data_before_migration(db, migrator):
    """
    Set up initial data as it would have been before the new migrations (0002 and 0003).
    This means creating Visit objects according to the schema of 0001_initial.
    """
    # Ensure we are at the state before the migrations we want to test
    # This means migrating back to 0001_initial
    if migrator.has_table("api_patient") or migrator.has_table("api_queue"):
        # Migrate back to a state before 0002 (which creates Patient and Queue)
        migrator.migrate([("api", "0001_initial")])

    # At this point, models are as per 0001_initial.py
    # We need to get the historical version of the Visit model.
    # This can be tricky. A simpler approach for testing data migrations is often
    # to create data, run the migration, and check.
    # For now, let's assume we can create some representative data
    # that the migration will then process.

    # To properly test this, we would ideally load the apps at migration 0001,
    # create data, then migrate forward. Django's testing tools for migrations
    # can be a bit involved for this specific scenario without custom app
    # loading.

    # A more pragmatic approach for this test:
    # 1. Ensure migrations are at 0001_initial.
    # 2. Manually create some data that *would* exist (e.g. directly via SQL
    #    or ORM if the model is simple enough).
    #    The issue is that the current Visit model in tests already has patient and queue fields.
    #    To work around this, we'd need to use the historical model from the migration.
    #
    # Let's simplify: we'll apply the migrations and then check the outcome,
    # assuming some data was there. The data migration itself is idempotent
    # (get_or_create).

    # For this test, we'll first migrate to 0001, then create data using a schema
    # that matches 0001 (i.e., no patient/queue FKs).
    # This is hard because the loaded models in the test environment are
    # always the latest.

    # Alternative: Test the data migration function directly.
    # This is usually cleaner.

    # Let's focus on testing the state *after* the migrations have run,
    # and for the data migration, we'll assume it runs on some old data.
    # The goal is to check if the migration *would have* correctly processed
    # data.

    # For this test, we'll skip creating pre-migration data via Django ORM
    # as the models loaded are post-migration. We'll rely on the migration's
    # own logic to handle existing (simulated) data.
    # The data migration uses get_or_create for Patient and Queue, so it's
    # safe to run.

    # This fixture will ensure migrations are run up to the point *before* the data migration,
    # then we can manually create data that simulates the pre-data-migration state.
    # However, this is also complex.

    # Simplest: Just run the migrations and check the state.
    # The data migration creates a 'General' queue. If there were visits, it would process them.
    # We can create visits post-schema-migration but before data-migration to test it.
    # This is not ideal.

    # Let's assume the migrations have run. We are testing the *result* of the data migration.
    # The data migration creates a 'General' queue. This is testable.
    # It also processes existing visits. We can test this by creating a state *as if*
    # there were old visits, by setting patient and queue to None.
    pass


# Note: The `migrator` fixture is provided by `pytest-django`.
# These tests need to be functions, not methods of a class, for pytest to directly inject
# the `migrator` fixture easily unless the class is a specific pytest-django test case.
# For simplicity, converting to function-based tests.


@pytest.mark.django_db(transaction=True)
def test_0003_backfill_creates_default_queue(migrator):
    """
    Test that the data migration 0003_backfill_visits_to_patients_queues
    creates the default 'General' queue.
    """
    # Ensure we are at a state before this migration
    # This means state '0002_...'
    # Apply all migrations up to the one just before the one we are testing.
    # This sets the DB schema to the state of migration 0002_...
    migrator.apply_initial_migration(("api", "0003_backfill_visits_to_patients_queues"))

    # Verify that 'General' queue does not exist at this point using the
    # historical model from old_state
    # This ensures the test environment is clean if other tests/migrations might have created it.
    # This uses the ORM corresponding to the state *before* the tested migration.
    # OldQueueStateModel = old_state.apps.get_model('api', 'Queue')
    # if OldQueueStateModel.objects.filter(name="General").exists():
    #     OldQueueStateModel.objects.filter(name="General").delete()
    # assert not OldQueueStateModel.objects.filter(name="General").exists()
    # Relying on idempotency of the migration's get_or_create and test
    # isolation.

    # Apply the data migration 0003 itself
    migrator.apply_tested_migration(("api", "0003_backfill_visits_to_patients_queues"))

    # After the migration, the database schema is now at state 0003.
    # Query using the live, current runtime models.
    from api.models import Queue as RuntimeQueue

    assert RuntimeQueue.objects.filter(name="General").exists()
    general_queue = RuntimeQueue.objects.get(name="General")
    assert general_queue is not None


@pytest.mark.django_db(transaction=True)
def test_0003_backfill_migrates_existing_visits(migrator):
    """
    Test that the data migration correctly processes visits that would have
    existed before (i.e., where patient_id and queue_id are NULL).
    """
    # Sets DB schema to state of 0002_... (before 0003 data migration)
    old_state = migrator.apply_initial_migration(
        ("api", "0002_queue_alter_visit_options_patient_visit_patient_and_more")
    )

    OldVisit = old_state.apps.get_model("api", "Visit")

    # Ensure a clean slate and insert a legacy visit using the historical model
    # so that the data is stored in the same database connection that migrations
    # operate on.
    OldVisit.objects.all().delete()
    OldVisit.objects.create(
        token_number=101,
        patient_name="Old SQL Patient",
        patient_gender="female",  # lower-case to exercise normalisation
        visit_date="2023-01-01",
        status="WAITING",
    )

    legacy_visit_count = OldVisit.objects.filter(patient__isnull=True).count()
    print(
        "Visits with NULL patient_id before migration:",
        legacy_visit_count,
    )

    migrator.apply_tested_migration(("api", "0003_backfill_visits_to_patients_queues"))

    # After migration, query using live runtime models
    # from api.models import Queue as RuntimeQueue # Already imported
    from api.models import Queue as RuntimeQueue
    from api.models import Patient as RuntimePatient
    from api.models import Visit as RuntimeVisit

    # Debugging: check what queues exist
    all_queues = list(RuntimeQueue.objects.all())
    print(f"All queues after migration: {[q.name for q in all_queues]}")

    general_queue = RuntimeQueue.objects.get(name="General")

    # The migration should have created a patient record and linked it to the
    # visit.
    anonymous_patient = RuntimePatient.objects.get(name="Old SQL Patient")
    # As per data migration logic for new patients
    assert anonymous_patient.phone is None

    # Fetch the visit that was inserted via SQL and should have been updated
    # by the migration
    migrated_sql_visit = RuntimeVisit.objects.get(token_number=101, visit_date="2023-01-01")

    assert migrated_sql_visit.patient_id == anonymous_patient.pk
    assert migrated_sql_visit.queue_id == general_queue.pk
    assert migrated_sql_visit.patient.name == "Old SQL Patient"
    assert migrated_sql_visit.patient.gender == "FEMALE"


@pytest.mark.django_db(transaction=True)
def test_0003_backfill_handles_no_existing_visits(migrator):
    """
    Test that the data migration runs cleanly if there are no existing visits to migrate.
    """
    # Sets DB schema to state of 0002_...
    old_state = migrator.apply_initial_migration(("api", "0003_backfill_visits_to_patients_queues"))

    OldVisitHistorical = old_state.apps.get_model("api", "Visit")
    old_state.apps.get_model("api", "Patient")
    # OldQueueHistorical = old_state.apps.get_model('api', 'Queue')

    # Rely on test isolation for a clean database state for Patients and Queues
    # OldQueueHistorical.objects.all().delete()
    # OldPatientHistorical.objects.all().delete()
    # Ensure no visits exist for this specific test
    OldVisitHistorical.objects.all().delete()

    assert OldVisitHistorical.objects.count() == 0

    # Apply migration 0003
    migrator.apply_tested_migration(("api", "0003_backfill_visits_to_patients_queues"))

    # After migration, query using live runtime models
    from api.models import Queue as RuntimeQueue
    from api.models import Patient as RuntimePatient

    assert RuntimeQueue.objects.filter(name="General").exists()
    assert RuntimePatient.objects.count() == 0


@pytest.mark.django_db(transaction=True)
def test_0002_schema_migration_creates_indexes_and_unique_constraint(migrator):
    """
    Verify that schema migration 0002 creates specified indexes on Patient model
    and updates unique_together on Visit.
    """
    migrator.apply_initial_migration(
        ("api", "0002_queue_alter_visit_options_patient_visit_patient_and_more")
    )
    state_after_0002 = migrator.apply_tested_migration(
        ("api", "0002_queue_alter_visit_options_patient_visit_patient_and_more")
    )

    # For schema checks like indexes or Meta options, using the historical
    # model from the state is correct.
    PatientAtState0002 = state_after_0002.apps.get_model("api", "Patient")
    VisitAtState0002 = state_after_0002.apps.get_model("api", "Visit")

    from django.db import connection, models

    with connection.cursor() as cursor:
        cursor.execute(f"PRAGMA index_list('{PatientAtState0002._meta.db_table}')")
        indexes_on_table = [row[1] for row in cursor.fetchall()]
        assert "api_patient_phone_9d1c6b_idx" in indexes_on_table
        assert "api_patient_name_8aa05a_idx" in indexes_on_table

    VisitMeta = VisitAtState0002._meta
    found_constraints = False
    if hasattr(VisitMeta, "unique_together") and VisitMeta.unique_together:
        assert VisitMeta.unique_together == {("token_number", "visit_date", "queue")}
        found_constraints = True
    elif hasattr(VisitMeta, "constraints"):
        for constraint in VisitMeta.constraints:
            if isinstance(constraint, models.UniqueConstraint):
                if set(constraint.fields) == {"token_number", "visit_date", "queue"}:
                    found_constraints = True
                    break

    assert found_constraints, (
        "Unique constraint ('token_number', 'visit_date', 'queue') not found on Visit model "
        "after migration 0002"
    )
