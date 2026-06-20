"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageHeader } from "@/components/ui/page-header";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <ProtectedRoute module="REPORTS">
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 relative min-h-screen pb-12">
        <PageHeader 
          title="Reports & Analytics" 
          breadcrumbs={["Dashboard", "Analytics", "Reports"]}
        />
        <div className="bg-white border border-gray-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] p-12 flex flex-col items-center justify-center text-center">
          <BarChart3 className="w-12 h-12 text-slate-300 mb-4" />
          <h1 className="text-xl font-black text-slate-900 mb-2">Module Loaded</h1>
          <p className="text-sm font-semibold text-slate-500 max-w-md">
            This module is under UI integration. The core ERP engines are actively aggregating data. Comprehensive analytics and exports will load here soon.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
