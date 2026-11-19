"""Our own job photos (files in gallery/seed/work). Used by the seed command and by a data migration."""

from pathlib import Path

from django.core.files import File
from django.db.models import Q

WORK_DIR = Path(__file__).resolve().parent / "seed" / "work"

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


def remove_stock(MediaItem) -> int:
    """Delete the old stock (Pexels) placeholders. The gallery is for our own jobs only."""
    stock = MediaItem.objects.filter(Q(external_url__contains="pexels.com") | Q(external_poster__contains="pexels.com"))
    n = stock.count()
    stock.delete()
    return n


def add_our_work(MediaItem) -> int:
    """Add any of our job photos that aren't in the gallery yet. Safe to run more than once."""
    made = 0
    for i, (name, title, category, alt, featured) in enumerate(OUR_WORK):
        if MediaItem.objects.filter(title=title).exists():
            continue
        item = MediaItem(title=title, alt=alt, category=category, kind="image", featured=featured, order=i)
        with open(WORK_DIR / f"{name}.jpg", "rb") as f:
            item.file.save(f"{name}.jpg", File(f), save=False)
        item.save()
        made += 1
    return made
