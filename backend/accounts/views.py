from datetime import timedelta

from django.contrib.auth import authenticate
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from chat.models import Conversation, Message
from gallery.models import MediaItem
from leads.models import Lead, Payment
from reviews.models import Review


class LoginThrottle(AnonRateThrottle):
    scope = "login"


def user_payload(user):
    return {"id": user.id, "username": user.username, "name": user.get_full_name() or user.username}


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login(request):
    user = authenticate(username=request.data.get("username", ""), password=request.data.get("password", ""))
    if not user or not user.is_staff or not user.is_active:
        return Response({"detail": "Wrong username or password."}, status=status.HTTP_400_BAD_REQUEST)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": user_payload(user)})


@api_view(["POST"])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def me(request):
    return Response(user_payload(request.user))


def _avg_minutes(pairs):
    secs = [(b - a).total_seconds() for a, b in pairs if a and b]
    return round(sum(secs) / len(secs) / 60, 1) if secs else None


def _response_pairs(since, until):
    leads = Lead.objects.filter(created_at__gte=since, created_at__lt=until, first_contacted_at__isnull=False)
    convs = Conversation.objects.filter(created_at__gte=since, created_at__lt=until, first_admin_reply_at__isnull=False)
    return [(l.created_at, l.first_contacted_at) for l in leads] + [(c.created_at, c.first_admin_reply_at) for c in convs]


def waiting_items(now):
    """Everything still waiting for a first answer: new leads + chats whose last message is from the visitor."""
    items = [
        {"type": "lead", "id": l.id, "name": l.name, "detail": l.job or l.message[:80], "since": l.created_at, "urgent": l.urgent}
        for l in Lead.objects.filter(status=Lead.Status.NEW)[:200]
    ]
    for c in Conversation.objects.filter(status=Conversation.Status.OPEN).prefetch_related("messages")[:200]:
        msgs = [m for m in c.messages.all() if not m.auto]
        if msgs and msgs[-1].sender == Message.Sender.VISITOR:
            # waiting since the first visitor message after the last admin reply
            since = msgs[-1].created_at
            for m in reversed(msgs):
                if m.sender != Message.Sender.VISITOR:
                    break
                since = m.created_at
            items.append({"type": "chat", "id": str(c.id), "name": c.display_name, "detail": msgs[-1].body[:80] or "📷 Photo", "since": since, "urgent": False})
    items.sort(key=lambda i: i["since"])
    return items


@api_view(["GET"])
@permission_classes([IsAdminUser])
def stats(request):
    """Numbers for the overview page. Every headline number has last week's value next to it."""
    now = timezone.now()
    week_ago, two_weeks_ago = now - timedelta(days=7), now - timedelta(days=14)
    start = (timezone.localtime(now) - timedelta(days=13)).replace(hour=0, minute=0, second=0, microsecond=0)

    def per_day(qs):
        return {r["day"]: r["n"] for r in qs.filter(created_at__gte=start).annotate(day=TruncDate("created_at")).values("day").annotate(n=Count("id"))}

    lead_days, chat_days = per_day(Lead.objects.all()), per_day(Conversation.objects.all())
    days = []
    for i in range(14):
        d = (start + timedelta(days=i)).date()
        days.append({"date": d.isoformat(), "leads": lead_days.get(d, 0), "chats": chat_days.get(d, 0)})

    def window(qs, a, b, field="created_at"):
        return qs.filter(**{f"{field}__gte": a, f"{field}__lt": b}).count()

    requests_week = window(Lead.objects.exclude(source=Lead.Source.CHAT), week_ago, now) + window(Conversation.objects, week_ago, now)
    requests_prev = window(Lead.objects.exclude(source=Lead.Source.CHAT), two_weeks_ago, week_ago) + window(Conversation.objects, two_weeks_ago, week_ago)
    booked = Lead.objects.filter(status=Lead.Status.BOOKED)

    waiting = waiting_items(now)
    activity = [
        {"type": "lead", "id": l.id, "title": f"{l.name} sent a {l.get_source_display().lower()} request", "detail": l.job, "at": l.created_at}
        for l in Lead.objects.exclude(source=Lead.Source.CHAT).order_by("-created_at")[:8]
    ] + [
        {"type": "chat", "id": str(c.id), "title": f"{c.display_name} started a chat", "detail": c.last_preview(), "at": c.created_at}
        for c in Conversation.objects.order_by("-created_at")[:8]
    ] + [
        {"type": "booked", "id": l.id, "title": f"{l.name} booked", "detail": l.job, "at": l.updated_at}
        for l in booked.order_by("-updated_at")[:5]
    ]
    activity.sort(key=lambda a: a["at"], reverse=True)

    return Response(
        {
            "waiting": waiting[:6],
            "waiting_count": len(waiting),
            "oldest_waiting_since": waiting[0]["since"] if waiting else None,
            "requests_week": requests_week,
            "requests_prev": requests_prev,
            "booked_week": window(booked, week_ago, now, "updated_at"),
            "booked_prev": window(booked, two_weeks_ago, week_ago, "updated_at"),
            "response_week": _avg_minutes(_response_pairs(week_ago, now)),
            "response_prev": _avg_minutes(_response_pairs(two_weeks_ago, week_ago)),
            "open_chats": Conversation.objects.filter(status=Conversation.Status.OPEN).count(),
            "gallery_items": MediaItem.objects.filter(published=True).count(),
            "reviews_published": Review.objects.filter(published=True, demo=False).count(),
            "pipeline": {r["status"]: r["n"] for r in Lead.objects.values("status").annotate(n=Count("id")).order_by()},
            "by_source": {r["source"]: r["n"] for r in Lead.objects.values("source").annotate(n=Count("id")).order_by()},
            "days": days,
            "activity": activity[:10],
            "chat_reply_seconds": _chat_reply_seconds(week_ago, now),
            "chat_reply_seconds_prev": _chat_reply_seconds(two_weeks_ago, week_ago),
            "heatmap": heatmap(now),
            "insights": insights(now),
            "demo_records": Payment.objects.filter(demo=True).count() + Lead.objects.filter(demo=True).count() + Conversation.objects.filter(demo=True).count() + Review.objects.filter(demo=True).count(),
        }
    )


DAYS = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"]


def _request_times(since):
    """When customers got in touch: form requests + chats (chat leads are already counted as chats)."""
    lead_times = Lead.objects.filter(created_at__gte=since).exclude(source=Lead.Source.CHAT).values_list("created_at", flat=True)
    chat_times = Conversation.objects.filter(created_at__gte=since).values_list("created_at", flat=True)
    return [timezone.localtime(t) for t in list(lead_times) + list(chat_times)]


def _chat_reply_seconds(since, until):
    """Median seconds from a visitor's first message to the first real (not automatic) staff reply."""
    secs = []
    for c in Conversation.objects.filter(created_at__gte=since, created_at__lt=until).prefetch_related("messages"):
        msgs = list(c.messages.all())
        first_v = next((m for m in msgs if m.sender == Message.Sender.VISITOR), None)
        first_a = next((m for m in msgs if m.sender == Message.Sender.ADMIN and not m.auto and first_v and m.created_at >= first_v.created_at), None)
        if first_v and first_a:
            secs.append((first_a.created_at - first_v.created_at).total_seconds())
    if not secs:
        return None
    secs.sort()
    mid = len(secs) // 2
    return round(secs[mid] if len(secs) % 2 else (secs[mid - 1] + secs[mid]) / 2)


def _after_hours(t):
    # Matches the default opening hours on the website; adjust with your real hours.
    wd, h = t.weekday(), t.hour + t.minute / 60
    if wd == 6:
        return True
    if wd == 5:
        return not (8 <= h < 14)
    return not (7.5 <= h < 18)


def _fmt_secs(s):
    return f"{s} s" if s < 90 else f"{round(s / 60)} min"


def insights(now):
    """Two or three plain-language suggestions worked out from the numbers."""
    out = []
    month = _request_times(now - timedelta(days=30))
    if month:
        late = sum(1 for t in month if _after_hours(t))
        if late:
            out.append(
                {
                    "tone": "warn" if late / len(month) >= 0.3 else "info",
                    "text": f"{late} of {len(month)} requests in the last 30 days came outside working hours. Turn on phone alerts so they still get a fast answer.",
                }
            )
    quarter = _request_times(now - timedelta(days=90))
    if len(quarter) >= 5:
        buckets = {}
        for t in quarter:
            k = (t.weekday(), t.hour // 2 * 2)
            buckets[k] = buckets.get(k, 0) + 1
        (wd, h), n = max(buckets.items(), key=lambda kv: kv[1])
        out.append({"tone": "info", "text": f"Busiest time: {DAYS[wd]} between {h:02d}:00 and {h + 2:02d}:00 ({n} requests in 90 days). Try to be reachable then."})
    week = _chat_reply_seconds(now - timedelta(days=7), now)
    if week is not None:
        if week > 60:
            out.append({"tone": "warn", "text": f"Chats waited a median of {_fmt_secs(week)} for a first reply this week. People expect an answer within a minute."})
        else:
            out.append({"tone": "ok", "text": f"Chats got a first reply in a median of {_fmt_secs(week)} this week, inside the 1-minute goal."})
    stale = Lead.objects.filter(status=Lead.Status.NEW, created_at__lt=now - timedelta(days=1)).count()
    if stale:
        out.append({"tone": "warn", "text": f"{stale} {'request has' if stale == 1 else 'requests have'} waited over a day. Call today, or mark {'it' if stale == 1 else 'them'} Lost to keep the list honest."})
    return out[:4]


def heatmap(now):
    grid = [[0] * 24 for _ in range(7)]
    for t in _request_times(now - timedelta(days=90)):
        grid[t.weekday()][t.hour] += 1
    return grid


@api_view(["POST"])
@permission_classes([IsAdminUser])
def clear_demo(request):
    """Delete every sample record so only real data is left."""
    from gallery.management.commands._demo import clear_demo as wipe

    return Response({"deleted": wipe()})


@api_view(["GET"])
def push_key(request):
    from .push import keys

    return Response({"key": keys()["public"]})


@api_view(["POST", "DELETE"])
def push_subscribe(request):
    """Save (POST) or remove (DELETE) this device's push subscription."""
    from .models import PushSubscription

    sub = request.data.get("subscription") or {}
    endpoint = sub.get("endpoint", "")
    if request.method == "DELETE":
        PushSubscription.objects.filter(endpoint=endpoint, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    k = sub.get("keys") or {}
    if not (endpoint.startswith("https://") and k.get("p256dh") and k.get("auth")):
        return Response({"detail": "Not a valid push subscription."}, status=status.HTTP_400_BAD_REQUEST)
    PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={"user": request.user, "p256dh": k["p256dh"], "auth": k["auth"], "user_agent": request.headers.get("User-Agent", "")[:200]},
    )
    return Response({"ok": True}, status=status.HTTP_201_CREATED)
