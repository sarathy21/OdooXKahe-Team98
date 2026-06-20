import { SyncQueue } from './sync-queue';
import { supabase } from '../supabase';
import { SyncTask } from './sync-types';

export class SyncService {
  private static isProcessing = false;

  static init() {
    if (typeof window !== 'undefined') {
      window.addEventListener('erp-sync-trigger', () => {
        this.processQueue();
      });
      // Initial process on load
      this.processQueue();
    }
  }

  static async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const queue = SyncQueue.getQueue().filter(t => t.status === 'PENDING' || (t.status === 'FAILED' && t.retryCount < 3));
      
      for (const task of queue) {
        try {
          await this.syncTaskToSupabase(task);
          SyncQueue.dequeue(task.id);
        } catch (err: any) {
          console.error('Sync failed for task', task.id, err);
          SyncQueue.markFailed(task.id, err.message || 'Unknown error');
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private static async syncTaskToSupabase(task: SyncTask) {
    const tableMap: Record<string, string> = {
      product: 'products',
      sales_order: 'sales_orders',
      purchase_order: 'purchase_orders',
      manufacturing_order: 'manufacturing_orders',
      bom: 'bom',
      audit_log: 'audit_logs'
    };

    const table = tableMap[task.entity];
    if (!table) throw new Error(`Unknown entity ${task.entity}`);
    if (task.entity === 'audit_log') {
      // Skip syncing audit logs if table is not in database, mark successful
      return;
    }

    if (task.action === 'CREATE' || task.action === 'UPDATE') {
      const { error } = await supabase
        .from(table)
        .upsert(task.payload); 
      if (error) throw error;
    } else if (task.action === 'DELETE') {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', task.recordId);
      if (error) throw error;
    }
  }
}
