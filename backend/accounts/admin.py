from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model

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
