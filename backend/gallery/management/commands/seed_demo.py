"""
Load starting content so the site and dashboard aren't empty:
- the gallery: our own job photos (backend/seed/work). Any old stock (Pexels) placeholders are removed
- a few saved quick replies for live chat
- optionally a staff login (set ADMIN_USERNAME / ADMIN_PASSWORD)

Safe to run more than once. Add --demo to also create sample leads, chats and reviews
(marked demo=True, never shown on the public site). Remove them with `clear_demo`
or the "Remove demo data" button in the dashboard.
"""

import os
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.files import File
from django.core.management.base import BaseCommand
from django.db.models import Q

from chat.models import QuickReply
from gallery.models import MediaItem

WORK_DIR = Path(__file__).resolve().parents[2] / "seed" / "work"

# Our own job photos: (file name in seed/work, title, category, description for screen readers, show on home page)
OUR_WORK = [
    ("bathroom-remodel", "Small bathroom remodel", "Bathrooms",
     "Finished small bathroom with gray textured tile, an open shower with a matte black rain head and a wall niche, a wall-hung oak vanity, a one-piece toilet and a lit mirror cabinet", True),
    ("kitchen-high-rise", "Kitchen sink & drinking-water faucet", "Kitchens",
     "Stainless steel double sink with a pull-down faucet and a separate drinking-water faucet in a high-rise kitchen overlooking Manhattan", True),
    ("boiler-install", "High-efficiency boiler install", "Heating",
     "Wall-hung high-efficiency boiler with PVC venting, insulated heating pipes, circulator pumps, zone valves and an expansion tank in a basement", True),
    ("water-heaters", "Building water heater & storage tank", "Heating",
     "Commercial gas water heater next to a hot-water storage tank, with an expansion tank and new copper piping in a building's mechanical room", True),
    ("sump-pumps", "Sump pumps with battery backup", "Repairs",
     "Main and backup sump pumps in a basement pit with PVC discharge piping and a battery backup system", True),
    ("backflow-preventer", "Backflow preventer install", "Pipework",
     "New brass backflow preventer with test cocks, fitted on the copper water service in a basement", False),
    ("bathroom-rough-in", "Bathroom rough-in", "Pipework",
     "Bathroom opened to the studs: cast-iron drain stack, new copper supply lines with shut-off valves and a shower valve roughed in", False),
    ("shower-valve", "Shower valve replacement", "Repairs",
     "New shower mixing valve on copper supply lines, fitted through a small opening in a plaster wall", False),
    ("crawlspace-drain", "Crawl space drain line", "Pipework",
     "New white PVC drain line run through a crawl space and connected to the existing cast-iron pipe", False),
]

QUICK_REPLIES = [
    ("Hello", "Hi, thanks for getting in touch. I'm reading your message now."),
    ("Ask for photos", "Could you send a photo or two of the problem? It helps us quote properly before we visit."),
    ("Ask ZIP code", "What's your ZIP code? I'll check we cover your area and when we could get to you."),
    ("Water off", "If water is leaking, close the main water shut-off valve (usually by the water meter or under the kitchen sink) and switch off the boiler. We're on our way as soon as we can."),
    ("Call you", "Easier to talk it through. What's the best number to call you on, and when?"),
    ("Booked", "Great, you're booked in. You'll get a text the evening before with the arrival window."),
]


class Command(BaseCommand):
    help = "Seed the gallery with our job photos, quick replies and (optionally) a staff user."

    def add_arguments(self, parser):
        parser.add_argument("--demo", action="store_true", help="Also create sample leads, chats and reviews.")

    def handle(self, *args, **opts):
        stock = MediaItem.objects.filter(Q(external_url__contains="pexels.com") | Q(external_poster__contains="pexels.com"))
        removed = stock.count()
        stock.delete()

        made = 0
        for i, (name, title, category, alt, featured) in enumerate(OUR_WORK):
            if MediaItem.objects.filter(title=title).exists():
                continue
            item = MediaItem(title=title, alt=alt, category=category, kind=MediaItem.Kind.IMAGE, featured=featured, order=i)
            with open(WORK_DIR / f"{name}.jpg", "rb") as f:
                item.file.save(f"{name}.jpg", File(f), save=False)
            item.save()
            made += 1
        self.stdout.write(
            f"Gallery: {made} of our job photos added, {removed} stock placeholders removed ({MediaItem.objects.count()} total)."
        )

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
