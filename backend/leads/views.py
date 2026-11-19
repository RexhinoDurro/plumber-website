import csv
import datetime as dt
from decimal import Decimal

from django.conf import settings
from django.db.models import Avg, Count, Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.realtime import ADMINS, push
from core.throttles import PublicPostThrottle

from .models import Lead, Payment
from .serializers import LeadAdminSerializer, LeadPublicSerializer, PaymentSerializer


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
        qs = Lead.objects.prefetch_related("payments", "conversations")
        st = self.request.query_params.get("status")
        if st:
            qs = qs.filter(status=st)
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(name__icontains=q) | Q(phone__icontains=q) | Q(email__icontains=q) | Q(message__icontains=q) | Q(postcode__icontains=q) | Q(job__icontains=q)
            )
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        limit = min(_int(request.query_params.get("limit"), 500), 2000)
        resp = Response(self.get_serializer(qs[:limit], many=True).data)
        resp["X-Total-Count"] = qs.count()
        return resp

    @action(detail=False)
    def counts(self, request):
        """Leads per stage, for the tabs. Honors ?q= so the numbers match the search."""
        q = request.query_params.get("q")
        qs = Lead.objects.all()
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(phone__icontains=q) | Q(email__icontains=q) | Q(message__icontains=q) | Q(postcode__icontains=q))
        rows = dict(qs.values_list("status").annotate(n=Count("id")))
        return Response({"all": sum(rows.values()), **{k: rows.get(k, 0) for k in Lead.Status.values}})

    def perform_update(self, serializer):
        lead = serializer.save()
        push(ADMINS, {"type": "lead_updated", "lead": _payload(lead)})


def _int(v, default):
    try:
        return int(v)
    except (TypeError, ValueError):
        return default


def _money(v):
    return str(Decimal(v or 0).quantize(Decimal("0.01")))


def _month_start(d, back=0):
    y, m = d.year, d.month - back
    while m <= 0:
        y, m = y - 1, m + 12
    return dt.date(y, m, 1)


class PaymentViewSet(viewsets.ModelViewSet):
    """Paid customers. Filters: ?q= (name, phone, email, invoice, service), ?service=, ?method=, ?month=YYYY-MM, ?lead=."""

    serializer_class = PaymentSerializer

    def get_queryset(self):
        qs = Payment.objects.select_related("lead")
        p = self.request.query_params
        if q := p.get("q", "").strip():
            qs = qs.filter(
                Q(customer_name__icontains=q) | Q(phone__icontains=q) | Q(email__icontains=q) | Q(invoice_number__icontains=q)
                | Q(service__icontains=q) | Q(address__icontains=q)
            )
        if s := p.get("service"):
            qs = qs.filter(service=s)
        if m := p.get("method"):
            qs = qs.filter(method=m)
        if lead := p.get("lead"):
            qs = qs.filter(lead_id=lead)
        if month := p.get("month"):
            try:
                y, mo = (int(x) for x in month.split("-"))
                qs = qs.filter(paid_at__year=y, paid_at__month=mo)
            except ValueError:
                pass
        return qs

    def list(self, request, *args, **kwargs):
        """Paged: {count, total, results, next_offset}. `total` is the sum of the filtered payments."""
        qs = self.get_queryset()
        limit = min(_int(request.query_params.get("limit"), 100), 500)
        offset = max(_int(request.query_params.get("offset"), 0), 0)
        count = qs.count()
        page = qs[offset : offset + limit]
        return Response(
            {
                "count": count,
                "total": _money(qs.aggregate(t=Sum("amount"))["t"]),
                "results": self.get_serializer(page, many=True).data,
                "next_offset": offset + limit if offset + limit < count else None,
            }
        )

    def perform_create(self, serializer):
        pay = serializer.save()
        # Fill contact details from the request it came from, and mark that request as booked.
        lead = pay.lead
        if lead:
            changed = False
            for f_pay, f_lead in (("phone", "phone"), ("email", "email"), ("address", "postcode")):
                if not getattr(pay, f_pay) and getattr(lead, f_lead):
                    setattr(pay, f_pay, getattr(lead, f_lead))
                    changed = True
            if changed:
                pay.save()
            if lead.status != Lead.Status.BOOKED:
                lead.status = Lead.Status.BOOKED
                lead.save()
            push(ADMINS, {"type": "lead_updated", "lead": _payload(Lead.objects.get(pk=lead.pk))})

    @action(detail=False)
    def summary(self, request):
        today = timezone.localdate()
        this_m, last_m = _month_start(today), _month_start(today, 1)
        base = Payment.objects.all()

        def agg(qs):
            a = qs.aggregate(total=Sum("amount"), count=Count("id"), avg=Avg("amount"))
            return {"total": _money(a["total"]), "count": a["count"], "average": _money(a["avg"])}

        by_service = (
            base.filter(paid_at__gte=_month_start(today, 11)).values("service").annotate(total=Sum("amount"), count=Count("id")).order_by("-total")
        )
        months = []
        for back in range(11, -1, -1):
            start = _month_start(today, back)
            end = _month_start(today, back - 1) if back else _month_start(today, -1)
            months.append({"month": start.strftime("%Y-%m"), "total": _money(base.filter(paid_at__gte=start, paid_at__lt=end).aggregate(t=Sum("amount"))["t"])})
        return Response(
            {
                "currency": settings.CURRENCY,
                "this_month": agg(base.filter(paid_at__gte=this_m)),
                "last_month": agg(base.filter(paid_at__gte=last_m, paid_at__lt=this_m)),
                "all_time": agg(base),
                "customers": base.values("phone", "email", "customer_name").distinct().count(),
                "by_service": [{"service": r["service"], "total": _money(r["total"]), "count": r["count"]} for r in by_service],
                "months": months,
                "services": sorted(set(base.values_list("service", flat=True))),
                "demo_payments": base.filter(demo=True).count(),
            }
        )

    @action(detail=False)
    def export(self, request):
        resp = HttpResponse(content_type="text/csv")
        resp["Content-Disposition"] = f'attachment; filename="payments-{timezone.localdate()}.csv"'
        w = csv.writer(resp)
        w.writerow(["Date", "Customer", "Phone", "Email", "Address", "Service", "Description", "Amount", "Method", "Invoice", "Notes"])
        for p in self.get_queryset():
            w.writerow([p.paid_at, p.customer_name, p.phone, p.email, p.address, p.service, p.description, p.amount, p.get_method_display(), p.invoice_number, p.notes])
        return resp
