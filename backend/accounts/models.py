from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    """Custom user with listener/creator roles. A user can be listener, creator, or both."""
    is_listener = models.BooleanField(default=False)
    is_creator = models.BooleanField(default=False)
    header_image = models.ImageField(upload_to='profiles/headers/', blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/avatars/', blank=True, null=True)
    bio = models.TextField(blank=True, default='')

    @property
    def role(self):
        """Human-readable role: 'listener', 'creator', or 'both'."""
        if self.is_listener and self.is_creator:
            return "both"
        if self.is_creator:
            return "creator"
        if self.is_listener:
            return "listener"
        return "none"


class Track(models.Model):
    """A music track uploaded by a user."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tracks',
    )
    title = models.CharField(max_length=255)
    audio_file = models.FileField(upload_to='tracks/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.title} — {self.user.username}"

