from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.utils.decorators import method_decorator
from django.conf import settings
from django_ratelimit.decorators import ratelimit
from datetime import datetime, timedelta
import resend
import os

from .serializers import UserSerializer, ProfileUpdateSerializer, TrackSerializer
from .models import Track

resend.api_key = os.environ.get('RESEND_API_KEY')
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

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    @method_decorator(ratelimit(key='ip', rate='3/h', method='POST', block=False))
    @method_decorator(ratelimit(key='post:email', rate='2/h', method='POST', block=False))
    def post(self, request):
        # Check if rate limited
        if getattr(request, 'limited', False):
            return Response({'error': 'Too many reset attempts. Please try again later.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'If an account with this email exists, a reset link has been sent.'})

        # Generate token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Build reset link
        frontend_url = settings.FRONTEND_URL  # Add this to settings.py
        reset_link = f"{frontend_url}/reset-password?uid={uid}&token={token}"

        # Send email with Resend
        # In your ForgotPasswordView, before sending the email:
        expires_at = datetime.now() + timedelta(hours=1)
        expires_formatted = expires_at.strftime("%B %d, %Y at %I:%M %p")
        resend.Emails.send({
            "from": "Sonara <noreply@support.sonara.us>",
            "to": email,
            "subject": "Reset your Sonara password",
            "html": f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #1a1a2e; color: #ffffff; padding: 0; margin: 0;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1a2e;">
                    <tr>
                        <td align="center" style="padding: 40px 20px;">
                            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #1a1a2e; border-radius: 12px; padding: 40px;">
                                <tr>
                                    <td align="center">
                                        <!-- Logo -->
                                        <img src="/sonara_logo.png" alt="Sonara" style="width: 200px; margin-bottom: 30px;" />
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 20px;">Reset Your Password</h1>
                                        <p style="color: rgba(255,255,255,0.7); font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                                            We received a request to reset your password. Click the button below to create a new one.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="{reset_link}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #0096c7 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 20px;">
                                            This link expires on {expires_formatted}
                                        </p>
                                        <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin-top: 30px;">
                                            If you didn't request this, you can safely ignore this email.
                                        </p>
                                        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;" />
                                        <p style="color: rgba(255,255,255,0.4); font-size: 12px;">
                                            © 2026 Sonara. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """
        })

        return Response({'message': 'If an account with this email exists, a reset link has been sent.'})


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('password')

        if not uid or not token or not new_password:
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({'error': 'Invalid reset link'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired reset link'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate password
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response({'error': e.messages[0]}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({'message': 'Password has been reset successfully'})

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
