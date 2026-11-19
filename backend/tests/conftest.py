import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient


@pytest.fixture(scope="session")
def django_db_modify_db_settings(tmp_path_factory):
    # Migrations copy our job photos into MEDIA_ROOT when the test database is built: keep them out of backend/media.
    from django.conf import settings

    settings.MEDIA_ROOT = tmp_path_factory.mktemp("media")


@pytest.fixture(autouse=True)
def _clean(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    settings.FOLLOWUP_SYNC = True  # no background timers in tests; checks are called directly
    settings.PUSH_SYNC = True
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    settings.VAPID_FILE = tmp_path / "vapid.json"
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def staff(db):
    return get_user_model().objects.create_user("boss", password="pw-strong-123", is_staff=True)


@pytest.fixture
def token(staff):
    return Token.objects.create(user=staff).key


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def admin_api(token):
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f"Token {token}")
    return c
