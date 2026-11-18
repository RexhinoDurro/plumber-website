from django.contrib import admin

from .models import Conversation, Message, QuickReply


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ["sender", "body", "created_at"]


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ["visitor_name", "visitor_contact", "status", "unread_for_admin", "last_message_at"]
    list_filter = ["status"]
    inlines = [MessageInline]


admin.site.register(QuickReply)
