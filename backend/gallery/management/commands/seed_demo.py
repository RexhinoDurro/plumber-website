"""
Load starting content so the site and dashboard aren't empty:
- the placeholder gallery (free Pexels photos/videos the website already used)
- a few saved quick replies for live chat
- optionally a staff login (set ADMIN_USERNAME / ADMIN_PASSWORD)

Safe to run more than once. Add --demo to also create sample leads, chats and reviews
(marked demo=True, never shown on the public site). Remove them with `clear_demo`
or the "Remove demo data" button in the dashboard.
"""

import json
import os
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from chat.models import QuickReply
from gallery.models import MediaItem

FEATURED = ["bathroom", "radiator-pipe", "kitchen-sink-leak", "steel-pipes", "brass-shower"]

QUICK_REPLIES = [
    ("Hello", "Hi, thanks for getting in touch. I'm reading your message now."),
    ("Ask for photos", "Could you send a photo or two of the problem? It helps us quote properly before we visit."),
    ("Ask postcode", "What's your postcode? I'll check we cover your area and when we could get to you."),
    ("Water off", "If water is leaking, turn off the stopcock (usually under the kitchen sink) and switch off the boiler. We're on our way as soon as we can."),
    ("Call you", "Easier to talk it through. What's the best number to call you on, and when?"),
    ("Booked", "Great, you're booked in. You'll get a text the evening before with the arrival window."),
]


class Command(BaseCommand):
    help = "Seed the placeholder gallery, quick replies and (optionally) a staff user."

    def add_arguments(self, parser):
        parser.add_argument("--demo", action="store_true", help="Also create sample leads, chats and reviews.")

    def handle(self, *args, **opts):
        data = json.loads((Path(__file__).resolve().parents[2] / "seed" / "placeholder_gallery.json").read_text())
        made = 0
        for i, p in enumerate(data):
            if MediaItem.objects.filter(external_poster=p["src"]).exists() or MediaItem.objects.filter(external_url=p["src"]).exists():
                continue
            video = p.get("video")
            MediaItem.objects.create(
                title=p["title"],
                alt=p["alt"],
                category=p["category"],
                kind=MediaItem.Kind.VIDEO if video else MediaItem.Kind.IMAGE,
                external_url=video or p["src"],
                external_poster=p["src"] if video else "",
                credit=p.get("credit", ""),
                credit_url=p.get("creditUrl", ""),
                featured=p["id"] in FEATURED,
                order=i,
            )
            made += 1
        self.stdout.write(f"Gallery: {made} placeholder items added ({MediaItem.objects.count()} total).")

        if not QuickReply.objects.exists():
            for i, (label, text) in enumerate(QUICK_REPLIES):
                QuickReply.objects.create(label=label, text=text, order=i)
            self.stdout.write(f"Quick replies: {len(QUICK_REPLIES)} added.")

        if opts["demo"]:
            from ._demo import clear_demo, make_demo

            clear_demo()
            made = make_demo()
            self.stdout.write(f"Demo data: {made} (remove with: python manage.py clear_demo)")

        username, password = os.environ.get("ADMIN_USERNAME"), os.environ.get("ADMIN_PASSWORD")
        if username and password:
            User = get_user_model()
            user, created = User.objects.get_or_create(username=username, defaults={"is_staff": True, "is_superuser": True})
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f"Staff user '{username}' created.")
