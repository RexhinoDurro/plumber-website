from django.conf import settings
from rest_framework import serializers

from . import presence
from .models import Conversation, Message, QuickReply


class MessageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "sender", "body", "image", "client_id", "delivered_at", "read_at", "created_at"]

    def get_image(self, m):
        return f"{settings.PUBLIC_API_URL}{m.attachment.url}" if m.attachment else None


class ConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    display_name = serializers.CharField(read_only=True)
    visitor_online = serializers.SerializerMethodField()
    visitor_last_seen = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id", "visitor_name", "display_name", "visitor_contact", "page_url", "status", "unread_for_admin",
            "first_admin_reply_at", "last_message_at", "created_at", "last_message", "lead", "demo",
            "visitor_online", "visitor_last_seen",
        ]

    def get_last_message(self, obj):
        m = obj.messages.order_by("-created_at").first()
        return MessageSerializer(m).data if m else None

    def get_visitor_online(self, obj):
        return presence.visitor_online(obj.id)

    def get_visitor_last_seen(self, obj):
        return presence.visitor_last_seen(obj.id)


class StartChatSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000, required=False, allow_blank=True)
    client_id = serializers.CharField(max_length=40, required=False, allow_blank=True)
    name = serializers.CharField(max_length=80, required=False, allow_blank=True)
    page = serializers.CharField(max_length=300, required=False, allow_blank=True)
    website = serializers.CharField(required=False, allow_blank=True)  # honeypot: must stay empty


class ConversationInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ["visitor_name", "visitor_contact"]


class QuickReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = QuickReply
        fields = ["id", "label", "text", "order"]
