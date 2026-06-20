import * as React from "react";

interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ data, columns, onRowClick }: DataTableProps<T>) {
  return (
    <div className="w-full overflow-auto border border-gray-100 bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] rounded-xl">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="bg-[#F9FAFB] border-b border-gray-100 text-slate-500 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10">
          <tr>
            {columns.map((col, i) => (
              <th 
                key={i} 
                className={`py-3 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.width || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              onClick={() => onRowClick?.(row)}
              className={`hover:bg-[#774F6C]/[0.03] transition-all duration-200 ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col, colIndex) => (
                <td 
                  key={colIndex} 
                  className={`py-2.5 px-4 font-semibold text-slate-700 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                >
                  {col.cell ? col.cell(row) : String(row[col.accessorKey as keyof T])}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                No active records
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
