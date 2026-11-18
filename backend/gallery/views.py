from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import MediaItem
from .serializers import MediaAdminSerializer, MediaPublicSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def public_gallery(request):
    qs = MediaItem.objects.filter(published=True)
    if request.query_params.get("featured") == "1":
        qs = qs.filter(featured=True)
    return Response(MediaPublicSerializer(qs, many=True).data)


class MediaAdminViewSet(viewsets.ModelViewSet):
    queryset = MediaItem.objects.all()
    serializer_class = MediaAdminSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        ids = request.data.get("ids", [])
        if not isinstance(ids, list):
            return Response({"detail": "ids must be a list"}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            for i, pk in enumerate(ids):
                MediaItem.objects.filter(pk=pk).update(order=i)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        for f in (instance.file, instance.poster):
            if f:
                f.delete(save=False)
        instance.delete()
