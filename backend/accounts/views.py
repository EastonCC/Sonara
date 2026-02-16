from rest_framework import generics, permissions, status
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from .serializers import UserSerializer, ProfileUpdateSerializer, TrackSerializer
from .models import Track
from rest_framework.views import APIView
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]

class ProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"message": "This is a protected endpoint! You are authenticated."})

class ProfileView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProfileUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(instance, context=self.get_serializer_context()).data)


class TrackListCreateView(generics.ListCreateAPIView):
    """List the authenticated user's tracks or upload a new one."""
    serializer_class = TrackSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Track.objects.filter(user=self.request.user)


class TrackDeleteView(generics.DestroyAPIView):
    """Delete a track (only if the requesting user owns it)."""
    serializer_class = TrackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Track.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        if instance.audio_file:
            default_storage.delete(instance.audio_file.name)
        instance.delete()
