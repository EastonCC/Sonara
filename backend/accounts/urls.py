from django.urls import path
from .views import RegisterView, LoginView, ProtectedView, ProfileView, ForgotPasswordView, ResetPasswordView, TrackListCreateView, TrackDeleteView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('protected-endpoint/', ProtectedView.as_view(), name='protected-endpoint'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('tracks/', TrackListCreateView.as_view(), name='track-list-create'),
    path('tracks/<int:pk>/', TrackDeleteView.as_view(), name='track-delete'),
]
