from rest_framework import permissions


class IsInGroup(permissions.BasePermission):
    """
    Allows access only to users in a specific group.
    Subclasses must set the `group_name` attribute.
    """

    group_name: str | None = None

    def has_permission(self, request, view):
        if not (self.group_name and request.user and request.user.is_authenticated):
            return False
        return request.user.groups.filter(name=self.group_name).exists()


class IsDoctor(IsInGroup):
    """Allows access only to users in the 'doctor' group."""

    group_name = "doctor"


class IsAssistant(IsInGroup):
    """Allows access only to users in the 'assistant' group."""

    group_name = "assistant"


class IsDoctorOrUploader(IsDoctor):
    """
    Allows access to doctors. This can be extended later to include other
    roles that are allowed to upload prescriptions.
    """

    pass
