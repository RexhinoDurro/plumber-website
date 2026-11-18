from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Review(models.Model):
    """A real customer review. Publishing requires the customer's consent."""

    name = models.CharField(max_length=80)
    place = models.CharField(max_length=80, blank=True)
    job = models.CharField(max_length=80, blank=True)
    quote = models.TextField(max_length=1200)
    rating = models.PositiveSmallIntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(5)])
    source = models.CharField(max_length=40, default="Google")
    source_url = models.URLField(blank=True)
    consent = models.BooleanField(default=False, help_text="Customer agreed to have this review shown on the website.")
    published = models.BooleanField(default=False)
    demo = models.BooleanField(default=False, help_text="Sample record created by seed_demo --demo; removed by clear_demo.")
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def clean(self):
        if self.published and not self.consent:
            raise ValidationError("A review can only be published with the customer's consent.")

    def __str__(self):
        return f"{self.name}: {self.quote[:40]}"
