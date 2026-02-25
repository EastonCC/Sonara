from django.urls import path
from .views import (
    RegisterView, LoginView, ProtectedView, ProfileView,
    ForgotPasswordView, ResetPasswordView,
    TrackListCreateView, TrackDeleteView,
    ProjectListCreateView, ProjectDetailView,
    PublicationListCreateView, PublicationDeleteView,
    PublicFeedView, UserPublicationsView, PublicationPlayView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('protected-endpoint/', ProtectedView.as_view(), name='protected-endpoint'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('tracks/', TrackListCreateView.as_view(), name='track-list-create'),
    path('tracks/<int:pk>/', TrackDeleteView.as_view(), name='track-delete'),

    # DAW projects
    path('projects/', ProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),

    # Publications (user's own)
    path('publications/', PublicationListCreateView.as_view(), name='publication-list-create'),
    path('publications/<int:pk>/', PublicationDeleteView.as_view(), name='publication-delete'),
    path('publications/<int:pk>/play/', PublicationPlayView.as_view(), name='publication-play'),

    # Public endpoints (no auth required)
    path('feed/', PublicFeedView.as_view(), name='public-feed'),
    path('users/<str:username>/publications/', UserPublicationsView.as_view(), name='user-publications'),
]