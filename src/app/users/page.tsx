"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageHeader } from "@/components/ui/page-header";
import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <ProtectedRoute module="USERS">
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 relative min-h-screen pb-12">
        <PageHeader 
          title="User Management" 
          breadcrumbs={["Dashboard", "System", "Users"]}
        />
        <div className="bg-white border border-gray-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] p-12 flex flex-col items-center justify-center text-center">
          <Users className="w-12 h-12 text-slate-300 mb-4" />
          <h1 className="text-xl font-black text-slate-900 mb-2">Module Loaded</h1>
          <p className="text-sm font-semibold text-slate-500 max-w-md">
            This module is under UI integration. Role-Based Access Control (RBAC) is active and running natively. Tenant data visualization will load here soon.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
