import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  
  let badgeColor = "bg-slate-100 text-slate-700  ";
  
  if (["completed", "confirmed", "available"].includes(normalizedStatus)) {
    badgeColor = "bg-emerald-100 text-emerald-700  ";
  } else if (["pending", "in progress", "low stock"].includes(normalizedStatus)) {
    badgeColor = "bg-amber-100 text-amber-700  ";
  } else if (["critical", "out of stock", "shortage"].includes(normalizedStatus)) {
    badgeColor = "bg-rose-100 text-rose-700  ";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        badgeColor
      )}
    >
      {status}
    </span>
  );
}
