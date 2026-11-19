from django.db import models

# Create your models here.


class PushSubscription(models.Model):
    """A browser/phone that asked for dashboard push notifications."""

    user = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="push_subscriptions")
    endpoint = models.URLField(max_length=600, unique=True)
    p256dh = models.CharField(max_length=200)
    auth = models.CharField(max_length=100)
    user_agent = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} · {self.user_agent[:40]}"
