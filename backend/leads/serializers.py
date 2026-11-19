from rest_framework import serializers

from .models import Lead, Payment


class LeadPublicSerializer(serializers.ModelSerializer):
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)  # honeypot

    class Meta:
        model = Lead
        fields = ["name", "phone", "email", "postcode", "job", "message", "urgent", "source", "website"]
        extra_kwargs = {"name": {"min_length": 2}}

    def validate_phone(self, v):
        if v and sum(c.isdigit() for c in v) < 7:
            raise serializers.ValidationError("Add a phone number we can call back.")
        return v

    def validate(self, data):
        if not data.get("phone") and not data.get("email"):
            raise serializers.ValidationError({"phone": "Add a phone number or email so we can reply."})
        return data

    def create(self, data):
        data.pop("website", None)
        return super().create(data)


class LeadAdminSerializer(serializers.ModelSerializer):
    source_label = serializers.CharField(source="get_source_display", read_only=True)
    conversation = serializers.SerializerMethodField()
    paid_total = serializers.SerializerMethodField()

    def get_paid_total(self, lead):
        from decimal import Decimal

        total = sum((p.amount for p in lead.payments.all()), Decimal(0))
        return str(total.quantize(Decimal("0.01"))) if total else None

    def get_conversation(self, lead):
        c = lead.conversations.first()
        return str(c.id) if c else None

    class Meta:
        model = Lead
        fields = [
            "id", "name", "phone", "email", "postcode", "job", "message", "urgent", "source", "source_label",
            "status", "notes", "first_contacted_at", "review_requested_at", "conversation", "paid_total", "created_at", "updated_at", "demo",
        ]
        read_only_fields = ["first_contacted_at", "created_at", "updated_at", "source", "demo"]


class PaymentSerializer(serializers.ModelSerializer):
    method_label = serializers.CharField(source="get_method_display", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id", "lead", "customer_name", "phone", "email", "address", "service", "description", "amount", "method", "method_label",
            "paid_at", "invoice_number", "notes", "demo", "created_at",
        ]
        read_only_fields = ["demo", "created_at"]

    def validate_amount(self, v):
        if v <= 0:
            raise serializers.ValidationError("Amount must be more than zero.")
        return v

    def validate(self, data):
        phone = data.get("phone", getattr(self.instance, "phone", ""))
        email = data.get("email", getattr(self.instance, "email", ""))
        if not phone and not email and not data.get("lead", getattr(self.instance, "lead", None)):
            raise serializers.ValidationError({"phone": "Add a phone number or email so you can reach the customer."})
        return data
