from rest_framework import permissions


class IsDoctor(permissions.BasePermission):
    """Allows access only to users in the 'doctor' group."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name="doctor").exists()
        )


class IsAssistant(permissions.BasePermission):
    """Allows access only to users in the 'assistant' group."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.groups.filter(name="assistant").exists()
        )
