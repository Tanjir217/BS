export const MANAGEMENT_ROLES = {
    OWNER: "owner",
    MANAGER: "manager",
    STAFF: "staff",
  };
  
  export const ROLE_ACCESS = {
    owner: [
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
  
    manager: [
      "dashboard",
      "orders",
      "customers",
      "products",
      "categories",
      "homepage",
      "analytics",
    ],
  
    staff: [
      "dashboard",
      "orders",
      "customers",
    ],
  };
  
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
    if (!Array.isArray(roles)) {
      return false;
    }
  
    return allowedRoles.some((role) =>
      roles.includes(role)
    );
  }
  
  export function hasAccess(
    roles,
    area
  ) {
    if (!Array.isArray(roles)) {
      return false;
    }
  
    return roles.some((role) =>
      ROLE_ACCESS[role]?.includes(area)
    );
  }