"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, Sun, Moon, User, ChevronRight, Settings, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";

export function Navbar() {
  const pathname = usePathname();
  const pageTitle = React.useMemo(() => {
    if (pathname === "/") return "dashboard";
    const path = pathname.split("/")[1];
    return path.replace("-", " ");
  }, [pathname]);

  return (
    <header className="h-[60px] bg-white border-b border-gray-100 flex items-center justify-between px-6 z-10 sticky top-0 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-6 flex-1">
        
        {/* Global ERP Search */}
        <div className="flex items-center relative group w-full max-w-[400px]">
          <Search className="w-4 h-4 absolute left-3 text-slate-400 group-focus-within:text-[#774F6C] transition-colors z-10" />
          <input 
            type="text" 
            placeholder="Search ERP globally (Ctrl+K)..." 
            className="pl-9 pr-12 py-2 bg-[#F9FAFB] border border-gray-100 focus:border-[#774F6C]/40 focus:bg-white focus:ring-4 focus:ring-[#774F6C]/5 rounded-sm text-[13px] w-full transition-all outline-none font-semibold text-slate-900 placeholder:text-slate-400"
          />
          <div className="absolute right-2 flex items-center text-[10px] font-bold text-slate-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
            ⌘K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* System Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-green-700">System Online</span>
        </div>

        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

        {/* Notifications */}
        <button className="p-2 rounded-sm text-slate-500 hover:bg-[#F9FAFB] hover:text-[#774F6C] transition-all relative border border-transparent hover:border-gray-100">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#774F6C] rounded-full border border-white"></span>
        </button>
        
        <button className="p-2 rounded-sm text-slate-500 hover:bg-[#F9FAFB] hover:text-[#774F6C] transition-all border border-transparent hover:border-gray-100">
          <Settings className="w-[18px] h-[18px]" />
        </button>
        
        {/* User Profile */}
        <button className="flex items-center gap-2.5 p-1.5 pr-3 rounded-sm border border-gray-100 hover:bg-[#F9FAFB] hover:border-gray-200 transition-all group ml-1">
          <div className="w-7 h-7 rounded-sm bg-[#774F6C] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <User className="w-[14px] h-[14px]" />
          </div>
          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-[13px] font-bold text-slate-900">Admin User</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Manager</span>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-[#774F6C] transition-colors ml-1"/>
        </button>
      </div>
    </header>
  );
}
