import hmac

from django.conf import settings
from rest_framework.throttling import AnonRateThrottle


class PublicPostThrottle(AnonRateThrottle):
    """
    Limits anonymous form posts / chat starts per visitor (rate in settings: public_post).

    Quote forms are posted by the Next.js server, so every request would share the web
    server's IP. When the request carries the shared INTERNAL_API_KEY, the visitor's IP
    from X-Client-IP is used instead.
    """

    scope = "public_post"

    def get_ident(self, request):
        key = getattr(settings, "INTERNAL_API_KEY", "")
        sent = request.headers.get("X-Internal-Key", "")
        if key and sent and hmac.compare_digest(key, sent):
            ip = request.headers.get("X-Client-IP", "").strip()
            if ip:
                return f"client:{ip}"
        return super().get_ident(request)
