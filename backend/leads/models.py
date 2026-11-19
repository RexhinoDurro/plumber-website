from django.db import models
from django.utils import timezone


class Lead(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New"
        CONTACTED = "contacted", "Contacted"
        QUOTED = "quoted", "Quoted"
        BOOKED = "booked", "Booked"
        LOST = "lost", "Lost"

    class Source(models.TextChoices):
        HERO = "hero", "Quick quote"
        CONTACT = "contact", "Contact form"
        CHAT = "chat", "Live chat"
        COI = "coi", "Building / COI request"

    name = models.CharField(max_length=80)
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    postcode = models.CharField(max_length=40, blank=True)
    job = models.CharField(max_length=60, blank=True)
    message = models.TextField(max_length=3000, blank=True)
    urgent = models.BooleanField(default=False)
    source = models.CharField(max_length=10, choices=Source.choices, default=Source.CONTACT)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.NEW)
    demo = models.BooleanField(default=False, help_text="Sample record created by seed_demo --demo; removed by clear_demo.")
    notes = models.TextField(blank=True)
    first_contacted_at = models.DateTimeField(null=True, blank=True)
    review_requested_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status", "-created_at"]), models.Index(fields=["-created_at"])]

    def __str__(self):
        return f"{self.name} · {self.job or self.get_source_display()}"

    def save(self, *args, **kwargs):
        # Speed-to-lead: remember when the lead first left "new".
        if self.status != self.Status.NEW and self.first_contacted_at is None:
            self.first_contacted_at = timezone.now()
        super().save(*args, **kwargs)


class Payment(models.Model):
    """A customer who paid: who, what service, how much, how. Linked to the request it came from when there is one."""

    class Method(models.TextChoices):
        CARD = "card", "Card"
        CASH = "cash", "Cash"
        CHECK = "check", "Check"
        ZELLE = "zelle", "Zelle"
        BANK = "bank", "Bank transfer"
        OTHER = "other", "Other"

    lead = models.ForeignKey(Lead, null=True, blank=True, on_delete=models.SET_NULL, related_name="payments")
    customer_name = models.CharField(max_length=80)
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=160, blank=True)
    service = models.CharField(max_length=60)
    description = models.CharField(max_length=300, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=10, choices=Method.choices, default=Method.CARD)
    paid_at = models.DateField(default=timezone.localdate)
    invoice_number = models.CharField(max_length=40, blank=True)
    notes = models.TextField(blank=True)
    demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-paid_at", "-created_at"]
        indexes = [models.Index(fields=["-paid_at"]), models.Index(fields=["service", "-paid_at"])]

    def __str__(self):
        return f"{self.customer_name} · {self.service} · ${self.amount}"
