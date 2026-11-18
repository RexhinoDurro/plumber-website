from django.contrib import admin

from .models import Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ["name", "phone", "job", "source", "status", "urgent", "created_at"]
    list_filter = ["status", "source", "urgent"]
    search_fields = ["name", "phone", "email", "message"]
