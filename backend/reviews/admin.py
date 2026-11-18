from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["name", "rating", "source", "consent", "published"]
    list_filter = ["published", "consent"]
