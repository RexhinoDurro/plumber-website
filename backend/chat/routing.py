from django.urls import path

from .consumers import AdminConsumer, VisitorConsumer

websocket_urlpatterns = [
    path("ws/chat/<uuid:conversation_id>/", VisitorConsumer.as_asgi()),
    path("ws/admin/", AdminConsumer.as_asgi()),
]
