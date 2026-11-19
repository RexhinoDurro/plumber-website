"""
Who is connected right now, kept in the cache (Redis in production):
- how many staff have the dashboard open, and when the last one left ("last seen")
- how many tabs each visitor has open on their conversation
"""

from django.core.cache import cache
from django.utils import timezone

ADMINS_KEY = "chat:admins_online"
ADMINS_SEEN = "chat:admins_last_seen"


def _change(key: str, delta: int) -> int:
    try:
        n = cache.incr(key, delta)
    except ValueError:
        n = max(delta, 0)
        cache.set(key, n, None)
    if n < 0:
        cache.set(key, 0, None)
        n = 0
    return n


def admins_online() -> int:
    return max(int(cache.get(ADMINS_KEY, 0) or 0), 0)


def admins_last_seen():
    return cache.get(ADMINS_SEEN)


def change(delta: int) -> int:
    n = _change(ADMINS_KEY, delta)
    if n == 0:
        cache.set(ADMINS_SEEN, timezone.now().isoformat(), None)
    return n


def _vkey(conv_id) -> str:
    return f"chat:visitor:{conv_id}"


def visitor_online(conv_id) -> bool:
    return int(cache.get(_vkey(conv_id), 0) or 0) > 0


def visitor_change(conv_id, delta: int) -> int:
    n = _change(_vkey(conv_id), delta)
    if n == 0:
        cache.set(_vkey(conv_id) + ":seen", timezone.now().isoformat(), None)
    return n


def visitor_last_seen(conv_id):
    return cache.get(_vkey(conv_id) + ":seen")


def business_status() -> dict:
    return {"online": admins_online() > 0, "last_seen": admins_last_seen()}
