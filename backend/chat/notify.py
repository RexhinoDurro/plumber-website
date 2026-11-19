"""
Reaching visitors who have left the website: email, SMS or WhatsApp.

Email works through Django's email settings. SMS and WhatsApp need a Twilio account
(TWILIO_* settings); without one, nothing is sent automatically and staff use the
Text / WhatsApp buttons in the inbox instead.
"""

import base64
import logging
import re
import urllib.parse
import urllib.request

from django.conf import settings
from django.core.mail import send_mail

log = logging.getLogger(__name__)


def resume_link(conversation) -> str:
    return f"{settings.SITE_URL}/?chat={conversation.id}&t={conversation.visitor_token}"


def _digits(phone: str) -> str:
    """'+36 30 123 4567' -> '+36301234567' (numbers are expected in international format)."""
    return "+" + re.sub(r"\D", "", phone)


def _twilio(to: str, body: str, from_: str) -> bool:
    sid, token = settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN
    if not (sid and token and from_):
        return False
    data = urllib.parse.urlencode({"To": to, "From": from_, "Body": body}).encode()
    req = urllib.request.Request(f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json", data=data)
    req.add_header("Authorization", "Basic " + base64.b64encode(f"{sid}:{token}".encode()).decode())
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return 200 <= r.status < 300
    except Exception as e:  # pragma: no cover - network
        log.warning("Twilio send failed: %s", e)
        return False


def notify_visitor(conversation, text: str) -> str | None:
    """Send `text` (the reply) to the visitor by their chosen route. Returns the route used, or None."""
    via, to = conversation.contact_via, conversation.visitor_contact.strip()
    if not (via and to):
        return None
    link = resume_link(conversation)
    name = settings.BUSINESS_NAME
    if via == "email":
        try:
            send_mail(
                subject=f"{name} replied to your message",
                message=f"{text}\n\nReply or carry on the chat here:\n{link}\n\n{name} · {settings.BUSINESS_PHONE}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to],
            )
            return "email"
        except Exception as e:
            log.warning("Email to visitor failed: %s", e)
            return None
    body = f"{name}: {text}\n\nReply here: {link}"
    if via == "sms" and _twilio(_digits(to), body, settings.TWILIO_SMS_FROM):
        return "sms"
    if via == "whatsapp" and _twilio(f"whatsapp:{_digits(to)}", body, settings.TWILIO_WHATSAPP_FROM):
        return "whatsapp"
    return None


def channels_status() -> dict:
    """What the inbox can say about automatic follow-up."""
    return {
        "email": settings.EMAIL_BACKEND != "django.core.mail.backends.console.EmailBackend",
        "sms": bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_SMS_FROM),
        "whatsapp": bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_WHATSAPP_FROM),
    }

