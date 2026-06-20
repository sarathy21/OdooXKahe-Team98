import { SyncQueue } from "../sync/sync-queue";

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STOCK_ADJUSTMENT';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  module: string;
  action: AuditAction;
  recordId: string;
  details: string;
}

export class AuditLogger {
  private static STORAGE_KEY = 'erp_audit_logs';

  static getLogs(): AuditLogEntry[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static log(
    action: AuditAction, 
    module: string, 
    recordId: string, 
    details: string, 
    userId: string = 'System Admin'
  ) {
    const newEntry: AuditLogEntry = {
      id: `AL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      userId,
      module,
      action,
      recordId,
      details
    };

    const logs = this.getLogs();
    logs.unshift(newEntry); // Prepend
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    }
    
    SyncQueue.enqueue('audit_log', 'CREATE', newEntry.id, newEntry);
  }
}
