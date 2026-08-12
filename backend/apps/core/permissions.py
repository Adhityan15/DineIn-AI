from rest_framework.permissions import BasePermission
from .constants import ROLE_ADMIN, ROLE_OWNER, ROLE_MANAGER, ROLE_STORE_KEEPER, ROLE_PERMISSIONS_MAPPING

def get_user_role_code(user):
    """
    Utility helper to extract the role code string from the user's role relation.
    """
    if not user or not user.is_authenticated:
        return None
    role = getattr(user, 'role', None)
    if not role:
        return None
    # Check if role is the Role model (has code property) or a string choice fallback
    return getattr(role, 'code', str(role))


class HasRequiredPermission(BasePermission):
    """
    Generic permission check that maps user roles to permission strings.
    """
    required_permission = None

    def has_permission(self, request, view):
        role_code = get_user_role_code(request.user)
        if not role_code:
            return False

        # Admin and Owner have superuser rights mapping to everything
        if role_code in [ROLE_ADMIN, ROLE_OWNER]:
            return True

        # Extract permission requirement from view metadata if not hardcoded on class
        perm = self.required_permission or getattr(view, 'required_permission', None)
        if not perm:
            # If no permission is specified, view is allowed for authenticated users
            return True

        allowed_perms = ROLE_PERMISSIONS_MAPPING.get(role_code, [])
        return perm in allowed_perms


class IsAdminOrOwner(BasePermission):
    """
    Allows access only to Admin and Owner roles.
    """
    def has_permission(self, request, view):
        role_code = get_user_role_code(request.user)
        return role_code in [ROLE_ADMIN, ROLE_OWNER]


class IsManagerOrAbove(BasePermission):
    """
    Allows access only to Manager, Owner, and Admin roles.
    """
    def has_permission(self, request, view):
        role_code = get_user_role_code(request.user)
        return role_code in [ROLE_ADMIN, ROLE_OWNER, ROLE_MANAGER]


class IsStoreKeeperOrAbove(BasePermission):
    """
    Allows access only to Store Keeper, Manager, Owner, and Admin roles.
    """
    def has_permission(self, request, view):
        role_code = get_user_role_code(request.user)
        return role_code in [ROLE_ADMIN, ROLE_OWNER, ROLE_MANAGER, ROLE_STORE_KEEPER]
