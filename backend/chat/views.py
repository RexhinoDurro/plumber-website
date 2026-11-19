from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.realtime import ADMINS, conv_group, push
from core.throttles import PublicPostThrottle
from leads.models import Lead

from . import presence
from .models import Conversation, Message, QuickReply
from .serializers import ConversationInfoSerializer, MessageSerializer, QuickReplySerializer, StartChatSerializer
from .services import add_message, conversation_payload, mark_read

MAX_PHOTO_MB = 10


def _photo(request):
    """The uploaded chat photo, or an error message."""
    f = request.FILES.get("photo")
    if not f:
        return None, "Choose a photo."
    if not (f.content_type or "").startswith("image/") or f.name.rsplit(".", 1)[-1].lower() not in {"jpg", "jpeg", "png", "webp", "heic", "heif", "gif"}:
        return None, "Send a photo (JPG, PNG, WebP or HEIC)."
    if f.size > MAX_PHOTO_MB * 1024 * 1024:
        return None, f"Photos can be up to {MAX_PHOTO_MB} MB."
    return f, None


@api_view(["GET"])
@permission_classes([AllowAny])
def chat_presence(request):
    return Response(presence.business_status())


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PublicPostThrottle])
def start_chat(request):
    """Open a conversation with the first message. No name or contact needed."""
    s = StartChatSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    if s.validated_data.get("website"):
        return Response({"detail": "ok"}, status=status.HTTP_201_CREATED)  # silently drop bots
    conv = Conversation.objects.create(
        visitor_name=s.validated_data.get("name", "").strip(),
        page_url=s.validated_data.get("page", "")[:300],
    )
    push(ADMINS, {"type": "conversation_new", "conversation": conversation_payload(conv)})
    if s.validated_data.get("message", "").strip():
        add_message(conv, Message.Sender.VISITOR, s.validated_data["message"], s.validated_data.get("client_id", ""))
    return Response(
        {
            "id": str(conv.id),
            "token": conv.visitor_token,
            "messages": MessageSerializer(conv.messages.all(), many=True).data,
            **presence.business_status(),
        },
        status=status.HTTP_201_CREATED,
    )


def _visitor_conv(request, pk):
    conv = get_object_or_404(Conversation, pk=pk)
    token = request.query_params.get("token") or (request.data.get("token") if request.method == "POST" else None)
    return conv if token and token == conv.visitor_token else None


@api_view(["GET"])
@permission_classes([AllowAny])
def visitor_messages(request, pk):
    conv = _visitor_conv(request, pk)
    if conv is None:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response(
        {
            "id": str(conv.id),
            "status": conv.status,
            "messages": MessageSerializer(conv.messages.all(), many=True).data,
            **presence.business_status(),
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PublicPostThrottle])
def visitor_photo(request, pk):
    """A visitor sends a photo (e.g. of the leak) into the chat."""
    conv = _visitor_conv(request, pk)
    if conv is None:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    f, err = _photo(request)
    if err:
        return Response({"photo": [err]}, status=status.HTTP_400_BAD_REQUEST)
    msg = add_message(conv, Message.Sender.VISITOR, request.data.get("body", ""), request.data.get("client_id", ""), attachment=f)
    return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


class ConversationAdminViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Conversation.objects.all()

    def list(self, request):
        qs = self.get_queryset()
        if request.query_params.get("status") in ("open", "closed"):
            qs = qs.filter(status=request.query_params["status"])
        return Response([conversation_payload(c) for c in qs[:200]])

    def retrieve(self, request, pk=None):
        conv = self.get_object()
        return Response({**conversation_payload(conv), "messages": MessageSerializer(conv.messages.all(), many=True).data})

    @action(detail=True, methods=["post"])
    def reply(self, request, pk=None):
        conv = self.get_object()
        body = str(request.data.get("body", "")).strip()
        if not body:
            return Response({"detail": "Message is empty."}, status=status.HTTP_400_BAD_REQUEST)
        msg = add_message(conv, Message.Sender.ADMIN, body)
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def photo(self, request, pk=None):
        conv = self.get_object()
        f, err = _photo(request)
        if err:
            return Response({"photo": [err]}, status=status.HTTP_400_BAD_REQUEST)
        msg = add_message(conv, Message.Sender.ADMIN, request.data.get("body", ""), request.data.get("client_id", ""), attachment=f)
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"])
    def info(self, request, pk=None):
        """Staff fill in the customer's name / phone once they know it."""
        conv = self.get_object()
        s = ConversationInfoSerializer(conv, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        payload = conversation_payload(conv)
        push(ADMINS, {"type": "conversation", "conversation": payload})
        return Response(payload)

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        conv = self.get_object()
        mark_read(conv.id, Message.Sender.ADMIN)
        conv.refresh_from_db()
        push(ADMINS, {"type": "conversation", "conversation": conversation_payload(conv)})
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        conv = self.get_object()
        conv.status = Conversation.Status.CLOSED if conv.status == Conversation.Status.OPEN else Conversation.Status.OPEN
        conv.save(update_fields=["status"])
        payload = conversation_payload(conv)
        push(ADMINS, {"type": "conversation", "conversation": payload})
        push(conv_group(conv.id), {"type": "status", "status": conv.status})
        return Response(payload)

    @action(detail=True, methods=["post"], url_path="to-lead")
    def to_lead(self, request, pk=None):
        """Turn a chat into a lead in the pipeline (keeps the transcript in the notes)."""
        conv = self.get_object()
        if conv.lead_id:
            return Response({"lead": conv.lead_id})
        contact = conv.visitor_contact
        transcript = "\n".join(f"{m.get_sender_display()}: {m.body or '[photo]'}" for m in conv.messages.all())
        lead = Lead.objects.create(
            name=conv.display_name,
            phone=contact if "@" not in contact else "",
            email=contact if "@" in contact else "",
            message=next((m.body for m in conv.messages.filter(sender=Message.Sender.VISITOR) if m.body), ""),
            source=Lead.Source.CHAT,
            notes=f"From live chat:\n{transcript}",
        )
        conv.lead = lead
        conv.save(update_fields=["lead"])
        push(ADMINS, {"type": "conversation", "conversation": conversation_payload(conv)})
        return Response({"lead": lead.id}, status=status.HTTP_201_CREATED)


class QuickReplyViewSet(viewsets.ModelViewSet):
    queryset = QuickReply.objects.all()
    serializer_class = QuickReplySerializer
