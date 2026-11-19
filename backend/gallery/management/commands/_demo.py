"""Sample leads, chats, payments and reviews so the dashboard can be tried out. Every record has demo=True."""

import random
from datetime import timedelta

from django.utils import timezone

from chat.models import Conversation, Message
from decimal import Decimal

from leads.models import Lead, Payment
from reviews.models import Review

FIRST = ["Ana", "Ben", "Chloe", "Darnell", "Elena", "Felix", "Grace", "Hector", "Isaac", "Jasmine", "Kevin", "Liam", "Maya", "Noah", "Olivia", "Priya", "Rosa", "Sam", "Tyrone", "Wei"]
LAST = ["Rodriguez", "Smith", "Chen", "Johnson", "Patel", "Brown", "Cohen", "Williams", "Kim", "Rivera"]
AREAS = ["10025", "11215", "11375", "10463", "10314", "11211", "11101", "10031"]
PRICES = {
    "Leak or burst pipe": (275, 650), "Blocked drain": (195, 420), "Boiler or heating": (240, 900), "Bathroom": (6500, 14000),
    "Kitchen": (650, 1800), "Pipework": (450, 1200), "Not sure": (175, 300), "Gas or Local Law 152": (850, 2400),
}
JOBS = [
    ("Leak or burst pipe", "Water coming through the kitchen ceiling from the apartment above, it's dripping on the lights.", True),
    ("Blocked drain", "Shower drains really slowly and the sink gurgles when the washing machine empties.", False),
    ("Boiler or heating", "Boiler shows a pressure fault every morning, radiators cold upstairs.", False),
    ("Bathroom", "Looking to replace the bath with a walk-in shower. Room is about 7 by 8 feet.", False),
    ("Kitchen", "Need a new sink and dishwasher plumbed in when the new kitchen arrives on the 28th.", False),
    ("Leak or burst pipe", "Pipe under the sink split, I've turned the main shut-off valve off. Can someone come today?", True),
    ("Pipework", "Moving a radiator to the other wall during a renovation.", False),
    ("Not sure", "Toilet keeps running after flushing, fills for ages.", False),
    ("Gas or Local Law 152", "Our 24-unit building in Washington Heights is due for its LL152 inspection this year.", False),
    ("Boiler or heating", "Steam radiators banging all night in a pre-war apartment, super says it's the riser.", False),
]
CHATS = [
    [("v", "Hi, do you cover Astoria?"), ("a", "Hi! Yes we do. What's the problem?"), ("v", "Radiator in the bedroom is cold at the top"), ("a", "Sounds like it needs bleeding, or air in the system. We can come Thursday morning, 8–10?"), ("v", "Perfect, thanks")],
    [("v", "How much roughly to fit a new faucet?"), ("a", "Usually a fixed price for fitting; supplying the faucet is extra. Do you have one already?")],
    [("v", "Water leaking from the ceiling!! What do I do"), ("a", "Turn off the main shut-off valve (usually under the kitchen sink) and switch the electrics off in that room if water is near lights. What's your address?"), ("v", "Done. We're on W 104th St, near Amsterdam")],
    [("v", "Can I send photos of my boiler here?")],
    [("v", "Hello, I'd like a quote for a bathroom remodel in our co-op"), ("v", "The board needs your COI first")],
    [("v", "Do you work weekends?"), ("a", "For emergencies yes, 7 days. Planned work in buildings follows their hours, usually weekdays 9 to 5.")],
]
REVIEWS = [
    ("Sample review: came within the hour for a burst pipe and explained everything before starting.", "Emergency leak"),
    ("Sample review: fixed price was exactly what we paid. Bathroom finished on time and left spotless.", "Bathroom remodel"),
    ("Sample review: friendly, tidy, and the boiler has been fine all winter.", "Boiler service"),
]


def make_demo(seed=7):
    rnd = random.Random(seed)
    now = timezone.now()
    made = {"leads": 0, "chats": 0, "payments": 0, "reviews": 0}

    for i in range(34):
        job, msg, urgent = rnd.choice(JOBS)
        created = now - timedelta(days=rnd.uniform(0, 13.5) if i > 2 else rnd.uniform(0, 0.02), minutes=rnd.randint(0, 50))
        age_days = (now - created).days
        status = "new" if (i <= 2 or age_days < 1 and rnd.random() < 0.4) else rnd.choices(
            ["contacted", "quoted", "booked", "lost"], weights=[2, 3, 4, 1]
        )[0]
        name = f"{rnd.choice(FIRST)} {rnd.choice(LAST)}"
        lead = Lead.objects.create(
            name=name,
            phone=f"({rnd.choice([212, 347, 646, 718, 917, 929])}) {rnd.randint(200, 999)}-{rnd.randint(1000, 9999)}",
            email=f"{name.split()[0].lower()}@example.com" if rnd.random() < 0.5 else "",
            postcode=rnd.choice(AREAS),
            job=job,
            message=msg,
            urgent=urgent,
            source=rnd.choices(["hero", "contact"], weights=[3, 2])[0],
            status=status,
            demo=True,
        )
        contacted = created + timedelta(minutes=rnd.choice([2, 4, 6, 9, 14, 25, 48, 95])) if status != "new" else None
        Lead.objects.filter(pk=lead.pk).update(created_at=created, first_contacted_at=contacted, updated_at=(contacted or created) + timedelta(hours=rnd.randint(0, 30)))
        made["leads"] += 1
        if status == "booked" and rnd.random() < 0.75:
            lo, hi = PRICES.get(job, (200, 600))
            Payment.objects.create(
                lead=lead, customer_name=name, phone=lead.phone, email=lead.email, address=lead.postcode, service=job,
                description=msg[:120], amount=Decimal(rnd.randrange(lo, hi, 5)), method=rnd.choices(["card", "zelle", "check", "cash"], [5, 3, 1, 1])[0],
                paid_at=(created + timedelta(days=rnd.randint(0, 2))).date(), invoice_number=f"DEMO-{1000 + i}", demo=True,
            )
            made["payments"] += 1

    # Older paid jobs so the monthly totals have history.
    for i in range(46):
        job = rnd.choice(list(PRICES))
        lo, hi = PRICES[job]
        if job == "Bathroom" and rnd.random() < 0.7:
            job, (lo, hi) = "Leak or burst pipe", PRICES["Leak or burst pipe"]
        name = f"{rnd.choice(FIRST)} {rnd.choice(LAST)}"
        Payment.objects.create(
            customer_name=name, phone=f"({rnd.choice([212, 347, 646, 718, 917])}) {rnd.randint(200, 999)}-{rnd.randint(1000, 9999)}",
            email=f"{name.split()[0].lower()}.{name.split()[1].lower()}@example.com" if rnd.random() < 0.6 else "",
            address=rnd.choice(AREAS), service=job, amount=Decimal(rnd.randrange(lo, hi, 5)),
            method=rnd.choices(["card", "zelle", "check", "cash", "bank"], [5, 3, 1, 1, 1])[0],
            paid_at=(now - timedelta(days=rnd.uniform(14, 330))).date(), invoice_number=f"DEMO-{2000 + i}", demo=True,
        )
        made["payments"] += 1

    for j, thread in enumerate(CHATS):
        created = now - (timedelta(minutes=rnd.randint(3, 40)) if j in (2, 3, 4) else timedelta(days=rnd.uniform(1, 12)))
        conv = Conversation.objects.create(visitor_name=f"{rnd.choice(FIRST)} {rnd.choice(LAST)}", page_url=rnd.choice(["/", "/services", "/emergency", "/gallery"]), demo=True)
        t = created
        first_reply = None
        for who, body in thread:
            m = Message.objects.create(conversation=conv, sender="visitor" if who == "v" else "admin", body=body)
            Message.objects.filter(pk=m.pk).update(created_at=t)
            if who == "a" and not first_reply:
                first_reply = t
            t += timedelta(minutes=rnd.randint(1, 6))
        unread = 0
        for who, _ in reversed(thread):
            if who != "v":
                break
            unread += 1
        Conversation.objects.filter(pk=conv.pk).update(
            created_at=created, last_message_at=t, first_admin_reply_at=first_reply, unread_for_admin=unread if j in (2, 3, 4) else 0,
            status="open" if j in (2, 3, 4, 1) else "closed",
        )
        made["chats"] += 1

    for k, (quote, job) in enumerate(REVIEWS):
        Review.objects.create(name=f"{rnd.choice(FIRST)} {rnd.choice(LAST)[0]}.", place=rnd.choice(AREAS), job=job, quote=quote, rating=5, consent=False, published=False, order=k, demo=True)
        made["reviews"] += 1
    return made


def clear_demo():
    return Payment.objects.filter(demo=True).delete()[0] + Lead.objects.filter(demo=True).delete()[0] + Conversation.objects.filter(demo=True).delete()[0] + Review.objects.filter(demo=True).delete()[0]
