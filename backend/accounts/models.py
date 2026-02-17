from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models.signals import pre_delete, pre_save
from django.dispatch import receiver
from cloudinary_storage.storage import RawMediaCloudinaryStorage


def validate_image_size(file):
    """Limit profile pictures to 5 MB"""
    max_size = 5 * 1024 * 1024  # 5 MB
    if file.size > max_size:
        raise ValidationError(f'Image size cannot exceed 5 MB. Your file is {file.size / (1024 * 1024):.1f} MB.')


def validate_header_size(file):
    """Limit header images to 10 MB"""
    max_size = 10 * 1024 * 1024  # 10 MB
    if file.size > max_size:
        raise ValidationError(f'Header image cannot exceed 10 MB. Your file is {file.size / (1024 * 1024):.1f} MB.')


def validate_audio_size(file):
    """Limit audio files to 50 MB"""
    max_size = 50 * 1024 * 1024  # 50 MB
    if file.size > max_size:
        raise ValidationError(f'Audio file cannot exceed 50 MB. Your file is {file.size / (1024 * 1024):.1f} MB.')


class User(AbstractUser):
    """Custom user with listener/creator roles. A user can be listener, creator, or both."""
    is_listener = models.BooleanField(default=False)
    is_creator = models.BooleanField(default=False)
    header_image = models.ImageField(
        upload_to='profiles/headers/',
        blank=True,
        null=True,
        validators=[validate_header_size]
    )
    profile_picture = models.ImageField(
        upload_to='profiles/avatars/',
        blank=True,
        null=True,
        validators=[validate_image_size]
    )
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
    audio_file = models.FileField(
        upload_to='tracks/',
        validators=[validate_audio_size],
        storage=RawMediaCloudinaryStorage()
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.title} — {self.user.username}"


# ============ Cleanup signals - delete files from Cloudinary ============

@receiver(pre_delete, sender=User)
def delete_user_files(sender, instance, **kwargs):
    """Delete profile picture and header from Cloudinary when user is deleted"""
    if instance.profile_picture:
        instance.profile_picture.delete(save=False)
    if instance.header_image:
        instance.header_image.delete(save=False)


@receiver(pre_delete, sender=Track)
def delete_track_file(sender, instance, **kwargs):
    """Delete audio file from Cloudinary when track is deleted"""
    if instance.audio_file:
        instance.audio_file.delete(save=False)


@receiver(pre_save, sender=User)
def delete_old_user_files(sender, instance, **kwargs):
    """Delete old files when user uploads new profile picture or header"""
    if not instance.pk:
        return  # New user, nothing to delete
    
    try:
        old_instance = User.objects.get(pk=instance.pk)
    except User.DoesNotExist:
        return
    
    # Delete old profile picture if changed
    if old_instance.profile_picture and old_instance.profile_picture != instance.profile_picture:
        old_instance.profile_picture.delete(save=False)
    
    # Delete old header if changed
    if old_instance.header_image and old_instance.header_image != instance.header_image:
        old_instance.header_image.delete(save=False)


@receiver(pre_save, sender=Track)
def delete_old_track_file(sender, instance, **kwargs):
    """Delete old audio file when track is updated with new file"""
    if not instance.pk:
        return
    
    try:
        old_instance = Track.objects.get(pk=instance.pk)
    except Track.DoesNotExist:
        return
    
    if old_instance.audio_file and old_instance.audio_file != instance.audio_file:
        old_instance.audio_file.delete(save=False)