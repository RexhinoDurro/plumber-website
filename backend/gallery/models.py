from django.conf import settings
from django.db import models

VIDEO_EXT = {".mp4", ".webm", ".mov", ".m4v"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".avif"}


class MediaItem(models.Model):
    class Kind(models.TextChoices):
        IMAGE = "image", "Photo"
        VIDEO = "video", "Video"

    class Category(models.TextChoices):
        REPAIRS = "Repairs"
        BATHROOMS = "Bathrooms"
        KITCHENS = "Kitchens"
        HEATING = "Heating"
        PIPEWORK = "Pipework"

    title = models.CharField(max_length=80)
    alt = models.CharField(max_length=200, help_text="Describe what the photo shows, for screen readers.")
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.REPAIRS)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.IMAGE)
    file = models.FileField(upload_to="gallery/%Y/%m/", blank=True)
    poster = models.ImageField(upload_to="gallery/posters/", blank=True, help_text="Still image shown before a video plays.")
    # Seeded/remote media (e.g. the Pexels placeholders) live at an external URL instead of an upload.
    external_url = models.URLField(blank=True)
    external_poster = models.URLField(blank=True)
    credit = models.CharField(max_length=80, blank=True)
    credit_url = models.URLField(blank=True)
    published = models.BooleanField(default=True)
    featured = models.BooleanField(default=False, help_text="Show in the home page 'Recent work' grid.")
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title

    def _abs(self, f):
        return f"{settings.PUBLIC_API_URL}{f.url}" if f else ""

    @property
    def media_url(self):
        return self._abs(self.file) if self.file else self.external_url

    @property
    def poster_url(self):
        if self.poster:
            return self._abs(self.poster)
        if self.external_poster:
            return self.external_poster
        return self.media_url if self.kind == self.Kind.IMAGE else ""
