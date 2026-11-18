import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def _clean(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
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
