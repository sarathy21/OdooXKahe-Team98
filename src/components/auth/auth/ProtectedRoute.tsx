"use client";

import React, { useEffect, useState } from "react";
import { useRole } from "@/lib/auth/use-role";
import { ERPModule } from "@/lib/auth/permissions";
import { AccessDenied } from "./AccessDenied";

interface ProtectedRouteProps {
  module: ERPModule;
  children: React.ReactNode;
}

export function ProtectedRoute({ module, children }: ProtectedRouteProps) {
  const { canAccess } = useRole();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#F9FAFB]"></div>; // Prevent hydration mismatch flash
  }

  if (!canAccess(module)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
