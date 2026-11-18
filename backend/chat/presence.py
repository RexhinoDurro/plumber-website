"""How many admins have the dashboard open. Stored in the cache (Redis in production)."""

from django.core.cache import cache

KEY = "chat:admins_online"


def admins_online() -> int:
    return max(int(cache.get(KEY, 0) or 0), 0)


def change(delta: int) -> int:
    try:
        n = cache.incr(KEY, delta)
    except ValueError:
        cache.set(KEY, max(delta, 0), None)
        n = max(delta, 0)
    if n < 0:
        cache.set(KEY, 0, None)
        n = 0
    return n
