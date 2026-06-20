"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Search, Filter, ShieldAlert, Activity, User, Clock, FileText } from "lucide-react";
import { AuditLogger, AuditLogEntry } from "@/lib/erp/audit-log";

// Helper to dynamically assign severity since it's not stored natively in Phase 2's logger
const deriveSeverity = (entry: AuditLogEntry): 'INFO' | 'WARNING' | 'CRITICAL' => {
  const text = entry.details.toLowerCase();
  if (entry.action === 'DELETE' || text.includes('cancel') || text.includes('abort')) return 'CRITICAL';
  if (entry.action === 'STOCK_ADJUSTMENT' || text.includes('shortage') || text.includes('threshold')) return 'WARNING';
  return 'INFO';
};

export default function AuditLogsPage() {
  const [loading, setLoading] = React.useState(true);
  const [logs, setLogs] = React.useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Filters
  const [moduleFilter, setModuleFilter] = React.useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = React.useState<string>('ALL');

  React.useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setLogs(AuditLogger.getLogs());
      setLoading(false);
    }, 400); // Simulate API latency
  };

  const filteredLogs = React.useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.recordId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;
      const matchesSeverity = severityFilter === 'ALL' || deriveSeverity(log) === severityFilter;

      return matchesSearch && matchesModule && matchesSeverity;
    });
  }, [searchTerm, moduleFilter, severityFilter, logs]);

  const uniqueModules = Array.from(new Set(logs.map(l => l.module)));

  const columns = [
    { 
      header: "Timestamp", 
      accessorKey: "timestamp", 
      width: "w-48",
      cell: (r: any) => (
        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
          <Clock className="w-3.5 h-3.5" />
          {new Date(r.timestamp).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          })}
        </div>
      )
    },
    { 
      header: "Module", 
      accessorKey: "module", 
      width: "w-32",
      cell: (r: any) => (
        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-sm border border-slate-200">
          {r.module}
        </span>
      )
    },
    { 
      header: "Action", 
      accessorKey: "action", 
      width: "w-32",
      cell: (r: any) => <span className="text-xs font-bold text-slate-900">{r.action.replace('_', ' ')}</span>
    },
    { 
      header: "Record ID", 
      accessorKey: "recordId", 
      width: "w-32",
      cell: (r: any) => <span className="text-xs font-black text-[#774F6C]">{r.recordId}</span>
    },
    { 
      header: "Description", 
      accessorKey: "details",
      cell: (r: any) => <span className="text-sm font-semibold text-slate-600 truncate max-w-md block" title={r.details}>{r.details}</span>
    },
    { 
      header: "User", 
      accessorKey: "userId",
      width: "w-32",
      cell: (r: any) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
          <User className="w-3.5 h-3.5" />
          {r.userId}
        </div>
      )
    },
    { 
      header: "Severity", 
      accessorKey: "severity", 
      align: "center" as const, 
      width: "w-24",
      cell: (r: any) => {
        const severity = deriveSeverity(r);
        let variant = 'default';
        if (severity === 'INFO') variant = 'info';
        if (severity === 'WARNING') variant = 'warning';
        if (severity === 'CRITICAL') variant = 'critical';
        return <StatusBadge status={variant as any} label={severity} />;
      }
    }
  ];

  return (
    <ProtectedRoute module="AUDIT">
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 relative min-h-screen pb-12">
      <PageHeader 
        title="Audit Logs" 
        breadcrumbs={["Dashboard", "System", "Audit Logs"]}
        actions={
          <div className="flex items-center gap-2 bg-[#774F6C]/10 px-4 py-2 border border-[#774F6C]/20 text-[#774F6C] text-sm font-bold tracking-widest shadow-sm">
            <ShieldAlert className="w-4 h-4" />
            IMMUTABLE LEDGER
          </div>
        }
      />

      <div className="bg-white p-4 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
        <div className="relative group w-full md:w-[400px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 group-focus-within:text-[#774F6C] transition-colors" />
          <input 
            type="text" 
            placeholder="Search details, Record ID, or User..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 bg-[#F9FAFB] border border-gray-100 focus:border-[#774F6C]/40 focus:bg-white focus:ring-2 focus:ring-[#774F6C]/5 rounded-none text-sm w-full transition-all outline-none font-semibold text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={moduleFilter} 
              onChange={e => setModuleFilter(e.target.value)}
              className="px-3 py-2 bg-[#F9FAFB] border border-gray-100 focus:border-[#774F6C]/40 outline-none text-xs font-bold text-slate-600 uppercase tracking-widest transition-all"
            >
              <option value="ALL">All Modules</option>
              {uniqueModules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <select 
            value={severityFilter} 
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-[#F9FAFB] border border-gray-100 focus:border-[#774F6C]/40 outline-none text-xs font-bold text-slate-600 uppercase tracking-widest transition-all"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] animate-in fade-in duration-300">
        {loading ? (
          <TableSkeleton columns={7} rows={12} />
        ) : filteredLogs.length > 0 ? (
          <DataTable data={filteredLogs} columns={columns} />
        ) : (
          <div className="w-full flex flex-col items-center justify-center py-24 text-center">
            <Activity className="w-12 h-12 text-slate-200 mb-4" />
            <h3 className="text-lg font-black text-slate-900 mb-1">No Logs Found</h3>
            <p className="text-sm text-slate-500 font-semibold max-w-sm">
              The system ledger is currently empty or no events match your selected filters.
            </p>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}
