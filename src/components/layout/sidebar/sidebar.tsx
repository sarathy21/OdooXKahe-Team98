"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Factory, Box,
  FileText, Truck, Users, Layers, BarChart3, Settings
} from "lucide-react";
import { useRole } from "@/lib/auth/use-role";
import { ERPModule } from "@/lib/auth/permissions";

const navItems: { id: ERPModule; href: string; label: string; icon: any }[] = [
  { id: 'DASHBOARD', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'PRODUCTS', href: '/products', label: 'Products', icon: Package },
  { id: 'SALES', href: '/sales-orders', label: 'Sales Orders', icon: ShoppingCart },
  { id: 'PURCHASE', href: '/purchase-orders', label: 'Purchase Orders', icon: FileText },
  { id: 'MANUFACTURING', href: '/manufacturing-orders', label: 'Manufacturing Orders', icon: Factory },
  { id: 'BOM', href: '/bom', label: 'Bills of Materials', icon: Layers },
  { id: 'AUDIT', href: '/audit-logs', label: 'Audit Logs', icon: Box },
  { id: 'USERS', href: '/users', label: 'User Management', icon: Users },
  { id: 'REPORTS', href: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const { canAccess, role, setRole } = useRole();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const visibleNavItems = mounted ? navItems.filter(item => canAccess(item.id)) : navItems;

  return (
    <aside className={`hidden md:flex bg-[#F9FAFB] border-r border-gray-100 flex-col shrink-0 z-20 relative transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}>
      <div className={`h-16 flex items-center border-b border-gray-100 bg-white transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
        <div 
          className="w-8 h-8 bg-[#774F6C] flex items-center justify-center font-black text-slate-900 text-sm shadow-md cursor-pointer hover:scale-105 transition-transform"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title="Toggle Navigation"
        >
          M
        </div>
        {!isCollapsed && (
          <div className="ml-3 flex flex-col overflow-hidden animate-in fade-in duration-300">
            <span className="font-black text-[15px] text-slate-900 tracking-widest uppercase leading-none mt-1">Enterprise</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Control Center</span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto custom-scrollbar px-2">
        <div className="flex flex-col mb-4">
          {!isCollapsed && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3 opacity-60">System Role</span>}
          {mounted && (
            <div className={`px-2 mb-4`}>
              {isCollapsed ? (
                <div className="w-10 h-10 bg-[#774F6C]/10 rounded flex items-center justify-center mx-auto text-xs font-black text-[#774F6C] uppercase" title={`Role: ${role}`}>
                  {role.slice(0, 1)}
                </div>
              ) : (
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#774F6C]/10 border border-[#774F6C]/20 text-xs text-[#774F6C] font-black tracking-widest uppercase rounded-sm outline-none cursor-pointer"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="OWNER">Owner</option>
                  <option value="SALES">Sales User</option>
                  <option value="PURCHASE">Purchase User</option>
                  <option value="MANUFACTURING">Manufacturing</option>
                  <option value="INVENTORY">Inventory Mgr</option>
                </select>
              )}
            </div>
          )}
        </div>

        {visibleNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href) || (pathname === '/' && item.href === '/dashboard');
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-sm transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-white text-[#774F6C] shadow-sm border border-gray-100 font-black' 
                  : 'text-slate-500 hover:bg-slate-100 font-bold hover:text-slate-900'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-[#774F6C]' : 'text-slate-400 group-hover:text-[#774F6C]'}`} />
              
              {!isCollapsed && (
                <span className="ml-3 text-sm truncate tracking-wide">
                  {item.label}
                </span>
              )}
              
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#774F6C] rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className={`p-4 border-t border-gray-100 bg-white transition-all duration-300 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button className={`flex items-center text-slate-500 hover:text-[#774F6C] transition-colors group ${isCollapsed ? 'justify-center' : 'w-full'}`}>
          <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
          {!isCollapsed && <span className="ml-3 text-sm font-bold">Settings</span>}
        </button>
      </div>
    </aside>
  );
}
