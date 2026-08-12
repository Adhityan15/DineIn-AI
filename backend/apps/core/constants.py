# Role Definitions
ROLE_ADMIN = 'admin'
ROLE_OWNER = 'owner'
ROLE_MANAGER = 'manager'
ROLE_STORE_KEEPER = 'store_keeper'
ROLE_KITCHEN_STAFF = 'kitchen_staff'
ROLE_SERVICE_STAFF = 'service_staff'

ROLE_CHOICES = (
    (ROLE_ADMIN, 'Administrator'),
    (ROLE_OWNER, 'Restaurant Owner'),
    (ROLE_MANAGER, 'Restaurant Manager'),
    (ROLE_STORE_KEEPER, 'Store Keeper'),
    (ROLE_KITCHEN_STAFF, 'Kitchen Staff'),
    (ROLE_SERVICE_STAFF, 'Service Staff'),
)

# Permission Definitions
PERM_RESERVATION_VIEW = 'view_reservation'
PERM_RESERVATION_CREATE = 'create_reservation'
PERM_RESERVATION_EDIT = 'edit_reservation'
PERM_RESERVATION_DELETE = 'delete_reservation'

PERM_INVENTORY_VIEW = 'view_inventory'
PERM_INVENTORY_CREATE = 'create_inventory'
PERM_INVENTORY_EDIT = 'edit_inventory'
PERM_INVENTORY_DELETE = 'delete_inventory'

PERM_STAFF_VIEW = 'view_staff'
PERM_STAFF_EDIT = 'edit_staff'

PERM_FEEDBACK_VIEW = 'view_feedback'
PERM_ANALYTICS_VIEW = 'view_analytics'
PERM_REPORTS_VIEW = 'view_reports'

ROLE_PERMISSIONS_MAPPING = {
    ROLE_ADMIN: '__all__',
    ROLE_OWNER: '__all__',
    ROLE_MANAGER: [
        PERM_RESERVATION_VIEW, PERM_RESERVATION_CREATE, PERM_RESERVATION_EDIT, PERM_RESERVATION_DELETE,
        PERM_INVENTORY_VIEW, PERM_INVENTORY_EDIT,
        PERM_STAFF_VIEW,
        PERM_FEEDBACK_VIEW, PERM_ANALYTICS_VIEW, PERM_REPORTS_VIEW
    ],
    ROLE_STORE_KEEPER: [
        PERM_INVENTORY_VIEW, PERM_INVENTORY_CREATE, PERM_INVENTORY_EDIT
    ],
    ROLE_KITCHEN_STAFF: [
        PERM_INVENTORY_VIEW, PERM_INVENTORY_EDIT  # To report wastage/deductions
    ],
    ROLE_SERVICE_STAFF: [
        PERM_RESERVATION_VIEW, PERM_RESERVATION_CREATE  # To view bookings and seat walk-ins
    ]
}
