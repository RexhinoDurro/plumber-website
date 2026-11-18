from django.contrib import admin

from .models import MediaItem


@admin.register(MediaItem)
class MediaItemAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "kind", "published", "featured", "order"]
    list_filter = ["category", "kind", "published"]
    list_editable = ["published", "featured", "order"]
