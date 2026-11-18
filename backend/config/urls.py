from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from accounts import views as accounts
from chat import views as chat
from gallery import views as gallery
from leads import views as leads
from reviews import views as reviews

router = DefaultRouter()
router.register("conversations", chat.ConversationAdminViewSet, basename="conversation")
router.register("quick-replies", chat.QuickReplyViewSet, basename="quickreply")
router.register("leads", leads.LeadAdminViewSet, basename="lead")
router.register("gallery", gallery.MediaAdminViewSet, basename="media")
router.register("reviews", reviews.ReviewAdminViewSet, basename="review")

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/health/", lambda r: JsonResponse({"ok": True})),
    # Public (website)
    path("api/gallery/", gallery.public_gallery),
    path("api/reviews/", reviews.public_reviews),
    path("api/leads/", leads.create_lead),
    path("api/chat/presence/", chat.chat_presence),
    path("api/chat/start/", chat.start_chat),
    path("api/chat/<uuid:pk>/messages/", chat.visitor_messages),
    # Staff (dashboard)
    path("api/auth/login/", accounts.login),
    path("api/auth/logout/", accounts.logout),
    path("api/auth/me/", accounts.me),
    path("api/admin/stats/", accounts.stats),
    path("api/admin/demo/clear/", accounts.clear_demo),
    path("api/admin/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
