"use client";

import React from "react";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="w-full bg-white border border-gray-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-[10px] text-slate-500 uppercase bg-[#F9FAFB] border-b border-gray-100">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3 font-black tracking-widest">
                  <div className="h-3 bg-slate-200 rounded animate-pulse w-16"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx} className="bg-white border-b border-gray-50 last:border-b-0 hover:bg-[#F9FAFB]/50 transition-colors">
                {Array.from({ length: columns }).map((_, cIdx) => (
                  <td key={cIdx} className="px-4 py-3">
                    <div className={`h-4 bg-slate-100 rounded animate-pulse ${cIdx === 0 ? 'w-24' : cIdx === columns - 1 ? 'w-12 ml-auto' : 'w-full max-w-[150px]'}`}></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
