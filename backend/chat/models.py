import secrets
import uuid

from django.db import models


def new_token():
    return secrets.token_urlsafe(32)


class Conversation(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        CLOSED = "closed", "Closed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visitor_name = models.CharField(max_length=80)
    visitor_contact = models.CharField(max_length=120, blank=True, help_text="Phone or email, if given")
    visitor_token = models.CharField(max_length=64, default=new_token, editable=False)
    page_url = models.CharField(max_length=300, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    unread_for_admin = models.PositiveIntegerField(default=0)
    unread_for_visitor = models.PositiveIntegerField(default=0)
    first_admin_reply_at = models.DateTimeField(null=True, blank=True)
    last_message_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    demo = models.BooleanField(default=False, help_text="Sample record created by seed_demo --demo; removed by clear_demo.")
    lead = models.ForeignKey("leads.Lead", null=True, blank=True, on_delete=models.SET_NULL, related_name="conversations")

    class Meta:
        ordering = ["-last_message_at"]

    def __str__(self):
        return f"{self.visitor_name} ({self.created_at:%Y-%m-%d %H:%M})"

    def last_preview(self):
        m = self.messages.order_by("-created_at").first()
        return (m.body[:90] if m else "")


class Message(models.Model):
    class Sender(models.TextChoices):
        VISITOR = "visitor", "Visitor"
        ADMIN = "admin", "Admin"

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.CharField(max_length=10, choices=Sender.choices)
    body = models.TextField(max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender}: {self.body[:40]}"


class QuickReply(models.Model):
    """Saved answers the admin can send with one click."""

    label = models.CharField(max_length=40)
    text = models.TextField(max_length=600)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.label
