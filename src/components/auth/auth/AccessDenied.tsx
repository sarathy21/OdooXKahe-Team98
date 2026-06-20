"use client";

import React from "react";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-transparent animate-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm">
        <Lock className="w-10 h-10 text-rose-500" />
      </div>
      <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Access Denied</h1>
      <p className="text-sm font-semibold text-slate-500 mb-8 max-w-sm text-center">
        You do not have permission to view this module. Please contact your system administrator if you believe this is an error.
      </p>
      <button 
        onClick={() => router.push('/dashboard')}
        className="px-6 py-3 bg-[#774F6C] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#774F6C]/90 transition-colors shadow-sm"
      >
        Return to Dashboard
      </button>
    </div>
  );
}
