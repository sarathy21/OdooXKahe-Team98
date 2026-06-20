import * as React from "react";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  breadcrumbs: string[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6 bg-[#F9FAFB]">
      <div className="flex flex-col gap-1">
        <div className="flex items-center text-xs font-semibold text-slate-500 gap-2">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb}>
              <span className={index === breadcrumbs.length - 1 ? "text-[#774F6C]" : ""}>
                {crumb}
              </span>
              {index < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3" />}
            </React.Fragment>
          ))}
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
