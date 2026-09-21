export const MANAGEMENT_ROLES = {
    OWNER: "owner",
    MANAGER: "manager",
    STAFF: "staff",
  };
  
  export const ROLE_ACCESS = {
    [MANAGEMENT_ROLES.OWNER]: [
      "dashboard",
      "orders",
      "customers",
      "products",
      "categories",
      "homepage",
      "analytics",
      "settings",
      "management",
    ],
  
    [MANAGEMENT_ROLES.MANAGER]: [
      "dashboard",
      "orders",
      "customers",
      "products",
      "categories",
      "homepage",
      "analytics",
    ],
  
    [MANAGEMENT_ROLES.STAFF]: [
      "dashboard",
      "orders",
      "customers",
    ],
  };
  
  export const ROLE_PRIORITY = [
    MANAGEMENT_ROLES.OWNER,
    MANAGEMENT_ROLES.MANAGER,
    MANAGEMENT_ROLES.STAFF,
  ];
  
  export function getPrimaryManagementRole(roles) {
    if (!Array.isArray(roles)) {
      return null;
    }
  
    return (
      ROLE_PRIORITY.find((role) =>
        roles.includes(role)
      ) || null
    );
  }
  
  export function hasManagementRole(
    roles,
    requiredRole
  ) {
    return Array.isArray(roles)
      ? roles.includes(requiredRole)
      : false;
  }
  
  export function hasAnyManagementRole(
    roles,
    allowedRoles
  ) {
    if (
      !Array.isArray(roles) ||
      !Array.isArray(allowedRoles)
    ) {
      return false;
    }
  
    return allowedRoles.some((role) =>
      roles.includes(role)
    );
  }
  
  export function hasAccess(roles, area) {
    if (!Array.isArray(roles)) {
      return false;
    }
  
    return roles.some((role) =>
      ROLE_ACCESS[role]?.includes(area)
    );
  }