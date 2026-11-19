from rest_framework import serializers

from .models import Lead


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

    def get_conversation(self, lead):
        c = lead.conversations.first()
        return str(c.id) if c else None

    class Meta:
        model = Lead
        fields = [
            "id", "name", "phone", "email", "postcode", "job", "message", "urgent", "source", "source_label",
            "status", "notes", "first_contacted_at", "review_requested_at", "conversation", "created_at", "updated_at", "demo",
        ]
        read_only_fields = ["first_contacted_at", "created_at", "updated_at", "source", "demo"]
