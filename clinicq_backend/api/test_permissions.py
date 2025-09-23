import pytest
from django.contrib.auth.models import Group, User
from rest_framework.test import APIRequestFactory

from .permissions import IsAdmin, IsAssistant, IsDisplay, IsDoctor


@pytest.mark.django_db
@pytest.mark.parametrize(
    "permission_class, group_name",
    [
        (IsDoctor, "Doctor"),
        (IsAssistant, "Assistant"),
        (IsAdmin, "Admin"),
        (IsDisplay, "Display"),
    ],
)
def test_seeded_group_members_have_permission(permission_class, group_name):
    """Users assigned to the seeded auth groups should pass permission checks."""

    factory = APIRequestFactory()
    request = factory.get("/some-endpoint/")

    user = User.objects.create_user(username=f"{group_name.lower()}_user")
    group, _ = Group.objects.get_or_create(name=group_name)
    user.groups.add(group)

    request.user = user

    permission = permission_class()

    assert permission.has_permission(request, view=None)
