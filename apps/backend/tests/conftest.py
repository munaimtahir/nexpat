import pytest


@pytest.fixture(autouse=True)
def disable_migrations(settings):
    """Disable Django migrations during tests to avoid conflicting historical branches."""
    settings.MIGRATION_MODULES = {
        app.split('.')[-1]: None for app in settings.INSTALLED_APPS
    }
