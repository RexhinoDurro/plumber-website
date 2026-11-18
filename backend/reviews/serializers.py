from rest_framework import serializers

from .models import Review


class ReviewPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "name", "place", "job", "quote", "rating", "source", "source_url"]


class ReviewAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "name", "place", "job", "quote", "rating", "source", "source_url", "consent", "published", "order", "created_at", "demo"]
        read_only_fields = ["created_at", "demo"]

    def validate(self, data):
        published = data.get("published", getattr(self.instance, "published", False))
        consent = data.get("consent", getattr(self.instance, "consent", False))
        if published and self.instance is not None and self.instance.demo:
            raise serializers.ValidationError({"published": "Sample reviews can't be published."})
        if published and not consent:
            raise serializers.ValidationError({"published": "Tick the customer's consent before publishing."})
        return data
