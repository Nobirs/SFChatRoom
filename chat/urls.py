from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from rest_framework import routers

from chatRoom import views


# router = routers.DefaultRouter()
#
# router.register(r'users', views.UserViewSet)
# router.register(r'rooms', views.RoomViewSet)
# router.register(r'messages', views.MessageViewSet)

urlpatterns = [
    path('', views.home_if_authorized, name='check_authorization'),
    path('admin/', admin.site.urls),
    path('api/users/', views.UserViewSet.as_view({'get':'list'})),
    path('api/rooms/new/', views.RoomViewSet.as_view({'post':'create'})),
    path('api/rooms/add_user/', views.RoomViewSet.as_view({'post':'update'})),
    path('api/rooms/', views.RoomViewSet.as_view({'get':'list'})),
    path('api/messages/', views.MessageViewSet.as_view({'get':'list'})),
    path('home/', include('chatRoom.urls')),
    path('auth/', include('myAuth.urls')),
    path('accounts/', include('django.contrib.auth.urls')),
    path('api-auth/', include('rest_framework.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

