import * as React from "react";

type StatusType = "success" | "warning" | "critical" | "info" | "default";

interface StatusBadgeProps {
  status: StatusType;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = {
    success: "bg-transparent text-green-700 border-green-200",
    warning: "bg-transparent text-amber-700 border-amber-200",
    critical: "bg-transparent text-red-700 border-red-200",
    info: "bg-transparent text-blue-700 border-blue-200",
    default: "bg-transparent text-gray-700 border-gray-200",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${styles[status]}`}>
      {label}
    </span>
  );
}
