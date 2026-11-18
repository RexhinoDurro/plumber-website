from rest_framework import serializers

from .models import Conversation, Message, QuickReply


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "sender", "body", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id", "visitor_name", "visitor_contact", "page_url", "status", "unread_for_admin",
            "first_admin_reply_at", "last_message_at", "created_at", "last_message", "lead", "demo",
        ]

    def get_last_message(self, obj):
        m = obj.messages.order_by("-created_at").first()
        return MessageSerializer(m).data if m else None


class StartChatSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80, min_length=2)
    contact = serializers.CharField(max_length=120, required=False, allow_blank=True)
    message = serializers.CharField(max_length=2000, min_length=1)
    page = serializers.CharField(max_length=300, required=False, allow_blank=True)
    website = serializers.CharField(required=False, allow_blank=True)  # honeypot: must stay empty


class QuickReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = QuickReply
        fields = ["id", "label", "text", "order"]
