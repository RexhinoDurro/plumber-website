import os

from django.conf import settings
from rest_framework import serializers

from .models import IMAGE_EXT, VIDEO_EXT, MediaItem


class MediaPublicSerializer(serializers.ModelSerializer):
    src = serializers.CharField(source="poster_url")
    video = serializers.SerializerMethodField()
    creditUrl = serializers.CharField(source="credit_url")

    class Meta:
        model = MediaItem
        fields = ["id", "title", "alt", "category", "kind", "src", "video", "credit", "creditUrl", "featured"]

    def get_video(self, obj):
        return obj.media_url if obj.kind == MediaItem.Kind.VIDEO else None


class MediaAdminSerializer(serializers.ModelSerializer):
    media_url = serializers.CharField(read_only=True)
    poster_url = serializers.CharField(read_only=True)
    # Multipart forms omit unchecked boxes; default new uploads to published.
    published = serializers.BooleanField(default=True)
    featured = serializers.BooleanField(default=False)

    class Meta:
        model = MediaItem
        fields = [
            "id", "title", "alt", "category", "kind", "file", "poster", "external_url", "external_poster",
            "credit", "credit_url", "published", "featured", "order", "created_at", "media_url", "poster_url",
        ]
        read_only_fields = ["kind", "created_at"]
        extra_kwargs = {"file": {"write_only": True, "required": False}, "poster": {"write_only": True, "required": False}}

    def validate_file(self, f):
        if not f:
            return f
        ext = os.path.splitext(f.name)[1].lower()
        if ext in VIDEO_EXT:
            limit = settings.MAX_VIDEO_MB
        elif ext in IMAGE_EXT:
            limit = settings.MAX_IMAGE_MB
        else:
            raise serializers.ValidationError("Upload a photo (JPG, PNG, WebP, AVIF) or a video (MP4, WebM, MOV).")
        if f.size > limit * 1024 * 1024:
            raise serializers.ValidationError(f"That file is larger than {limit} MB.")
        return f

    def validate(self, data):
        if self.instance is None and not data.get("file") and not data.get("external_url"):
            raise serializers.ValidationError({"file": "Choose a photo or video to upload."})
        return data

    def _kind(self, data, instance=None):
        f = data.get("file")
        name = f.name if f else (data.get("external_url") or (instance.external_url if instance else ""))
        return MediaItem.Kind.VIDEO if os.path.splitext(name.split("?")[0])[1].lower() in VIDEO_EXT else MediaItem.Kind.IMAGE

    def create(self, data):
        data["kind"] = self._kind(data)
        if "order" not in data:
            first = MediaItem.objects.order_by("order").first()
            data["order"] = (first.order - 1) if first else 0  # new uploads go first
        return super().create(data)

    def update(self, instance, data):
        if "file" in data or "external_url" in data:
            data["kind"] = self._kind(data, instance)
        return super().update(instance, data)
