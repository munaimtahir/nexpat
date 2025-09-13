from rest_framework import permissions


class IsInGroup(permissions.BasePermission):
    """Generic permission that checks membership in a specific group."""

    group_name = ""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name=self.group_name).exists()
        )


class IsDoctor(IsInGroup):
    """Allows access only to users in the 'doctor' group."""

    group_name = "doctor"


class IsAssistant(IsInGroup):
    """Allows access only to users in the 'assistant' group."""

    group_name = "assistant"


class IsAdmin(IsInGroup):
    """Allows access only to users in the 'admin' group."""

    group_name = "admin"


class IsDisplay(IsInGroup):
    """Allows access only to users in the 'display' group."""

    group_name = "display"
