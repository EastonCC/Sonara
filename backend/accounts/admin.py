from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from .models import Project, Publication

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "is_listener", "is_creator", "role", "is_staff")
    list_filter = ("is_listener", "is_creator", "is_staff", "is_active")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Roles", {"fields": ("is_listener", "is_creator")}),
        ("Profile", {"fields": ("bio", "header_image", "profile_picture")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Roles", {"fields": ("is_listener", "is_creator")}),
    )


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "created_at", "updated_at")
    list_filter = ("user",)
    search_fields = ("name", "user__username")


@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "is_public", "play_count", "published_at")
    list_filter = ("is_public", "user")
    search_fields = ("title", "user__username")