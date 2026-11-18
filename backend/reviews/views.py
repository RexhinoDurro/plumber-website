from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Review
from .serializers import ReviewAdminSerializer, ReviewPublicSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def public_reviews(request):
    return Response(ReviewPublicSerializer(Review.objects.filter(published=True, consent=True, demo=False)[:12], many=True).data)


class ReviewAdminViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewAdminSerializer
