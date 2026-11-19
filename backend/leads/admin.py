from django.contrib import admin

from .models import Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ["name", "phone", "job", "source", "status", "urgent", "created_at"]
    list_filter = ["status", "source", "urgent"]
    search_fields = ["name", "phone", "email", "message"]

from .models import Payment  # noqa: E402


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("paid_at", "customer_name", "phone", "email", "service", "amount", "method", "demo")
    list_filter = ("method", "service", "demo")
    search_fields = ("customer_name", "phone", "email", "invoice_number")
