from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.realtime import ADMINS, push
from core.throttles import PublicPostThrottle

from .models import Lead
from .serializers import LeadAdminSerializer, LeadPublicSerializer


def _payload(lead):
    data = LeadAdminSerializer(lead).data
    return {k: (v.isoformat() if hasattr(v, "isoformat") else v) for k, v in data.items()}


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PublicPostThrottle])
def create_lead(request):
    s = LeadPublicSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    if s.validated_data.get("website"):
        return Response({"ok": True}, status=status.HTTP_201_CREATED)  # honeypot: pretend success
    lead = s.save()
    push(ADMINS, {"type": "lead_new", "lead": _payload(lead)})
    from accounts.push import notify_staff

    notify_staff(f"New {'urgent ' if lead.urgent else ''}request from {lead.name}", lead.job or lead.message, f"/admin/leads#{lead.id}", f"lead-{lead.id}")
    return Response({"ok": True, "id": lead.id}, status=status.HTTP_201_CREATED)


class LeadAdminViewSet(viewsets.ModelViewSet):
    serializer_class = LeadAdminSerializer
    http_method_names = ["get", "patch", "delete"]

    def get_queryset(self):
        qs = Lead.objects.all()
        st = self.request.query_params.get("status")
        if st:
            qs = qs.filter(status=st)
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(phone__icontains=q) | Q(email__icontains=q) | Q(message__icontains=q) | Q(postcode__icontains=q))
        return qs

    def list(self, request, *args, **kwargs):
        return Response(self.get_serializer(self.get_queryset()[:500], many=True).data)

    def perform_update(self, serializer):
        lead = serializer.save()
        push(ADMINS, {"type": "lead_updated", "lead": _payload(lead)})
