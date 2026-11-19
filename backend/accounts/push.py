"""Web push to the dashboard app on staff phones and computers (VAPID, no third-party service)."""

import json
import logging
import threading

from django.conf import settings
from django.db import close_old_connections, connection

log = logging.getLogger(__name__)
_keys: dict | None = None


def keys() -> dict:
    """VAPID keys from settings, or generated once and kept in .vapid.json."""
    global _keys
    if _keys:
        return _keys
    if settings.VAPID_PUBLIC_KEY and settings.VAPID_PRIVATE_KEY:
        _keys = {"public": settings.VAPID_PUBLIC_KEY, "private": settings.VAPID_PRIVATE_KEY}
        return _keys
    path = settings.VAPID_FILE
    if path.exists():
        _keys = json.loads(path.read_text())
        return _keys
    import base64

    from cryptography.hazmat.primitives import serialization
    from py_vapid import Vapid

    v = Vapid()
    v.generate_keys()
    raw_pub = v.public_key.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    raw_priv = v.private_key.private_numbers().private_value.to_bytes(32, "big")
    b64 = lambda b: base64.urlsafe_b64encode(b).decode().rstrip("=")  # noqa: E731
    _keys = {"public": b64(raw_pub), "private": b64(raw_priv)}
    path.write_text(json.dumps(_keys))
    return _keys


def _send_all(payload: dict) -> int:
    from pywebpush import WebPushException, webpush

    from .models import PushSubscription

    sent = 0
    k = keys()
    for sub in PushSubscription.objects.all():
        try:
            webpush(
                subscription_info={"endpoint": sub.endpoint, "keys": {"p256dh": sub.p256dh, "auth": sub.auth}},
                data=json.dumps(payload),
                vapid_private_key=k["private"],
                vapid_claims={"sub": settings.VAPID_SUBJECT},
                ttl=3600,
            )
            sent += 1
        except WebPushException as e:
            status = getattr(e.response, "status_code", None)
            if status in (404, 410):  # the device unsubscribed
                sub.delete()
            else:
                log.warning("Push failed: %s", e)
        except Exception as e:  # pragma: no cover
            log.warning("Push failed: %s", e)
    return sent


def _send_in_thread(payload: dict) -> None:
    # A background thread gets its own DB connection; close it when done so none are leaked.
    close_old_connections()
    try:
        _send_all(payload)
    finally:
        connection.close()


def notify_staff(title: str, body: str, url: str = "/admin", tag: str = "") -> None:
    """Fire-and-forget push to every subscribed staff device."""
    payload = {"title": title, "body": body[:180], "url": url, "tag": tag or url}
    if getattr(settings, "PUSH_SYNC", False):  # tests
        _send_all(payload)
        return
    threading.Thread(target=_send_in_thread, args=(payload,), daemon=True).start()
