export type Role = "ADMIN" | "SALES" | "PURCHASE" | "MANUFACTURING" | "INVENTORY" | "OWNER";

export type ERPModule = 
  | "DASHBOARD"
  | "PRODUCTS"
  | "SALES"
  | "PURCHASE"
  | "MANUFACTURING"
  | "BOM"
  | "AUDIT"
  | "USERS"
  | "REPORTS";

export const PERMISSION_MATRIX: Record<Role, ERPModule[]> = {
  "ADMIN": ["DASHBOARD", "PRODUCTS", "SALES", "PURCHASE", "MANUFACTURING", "BOM", "AUDIT", "USERS", "REPORTS"],
  "OWNER": ["DASHBOARD", "PRODUCTS", "SALES", "PURCHASE", "MANUFACTURING", "BOM", "AUDIT", "REPORTS"],
  "SALES": ["DASHBOARD", "PRODUCTS", "SALES"],
  "PURCHASE": ["DASHBOARD", "PRODUCTS", "PURCHASE"],
  "MANUFACTURING": ["DASHBOARD", "PRODUCTS", "MANUFACTURING", "BOM"],
  "INVENTORY": ["DASHBOARD", "PRODUCTS", "BOM"]
};

export const hasPermission = (role: Role, module: ERPModule): boolean => {
  return PERMISSION_MATRIX[role]?.includes(module) ?? false;
};
