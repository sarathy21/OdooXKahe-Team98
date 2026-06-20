"use client";

import React, { useEffect, useState } from "react";
import { useRole } from "@/lib/auth/use-role";
import { ERPModule } from "@/lib/auth/permissions";

interface CanAccessProps {
  module: ERPModule;
  children: React.ReactNode;
}

export function CanAccess({ module, children }: CanAccessProps) {
  const { canAccess } = useRole();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!canAccess(module)) {
    return null;
  }

  return <>{children}</>;
}
