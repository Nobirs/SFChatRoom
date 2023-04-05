from django.urls import path
from . import views


urlpatterns = [
    path('sign_up/', views.SignUpView.as_view(), name='signUp'),
    path('login/', views.login, name='myLogin'),
    path('profile/<int:pk>/', views.ProfileView.as_view(), name='profile'),
]