"use client";

import { useRoleContext } from "./role-context";
import { ERPModule, hasPermission } from "./permissions";

export function useRole() {
  const { role, setRole } = useRoleContext();

  return {
    role,
    setRole,
    canAccess: (module: ERPModule) => hasPermission(role, module),
  };
}
