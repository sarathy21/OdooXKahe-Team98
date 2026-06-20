import { SyncQueue } from './sync-queue';
import { supabase } from '../supabase';
import { SyncTask } from './sync-types';

function getDeterministicUUID(id: string): string {
  if (!id) return '00000000-0000-4000-8000-000000000000';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  const hex = Math.abs(hash).toString(16).padEnd(8, '0');
  const part2 = '1000';
  const part3 = '4000';
  const part4 = '8000';
  const part5 = Array.from(id)
    .map(c => c.charCodeAt(0).toString(16))
    .join('')
    .padEnd(12, '0')
    .slice(0, 12);

  return `${hex}-${part2}-${part3}-${part4}-${part5}`;
}

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

    const recordId = getDeterministicUUID(task.recordId);

    if (task.action === 'CREATE' || task.action === 'UPDATE') {
      let payload = { ...task.payload };

      if (task.entity === 'product') {
        const strategy = payload.procurementType === 'MTO' ? 'MTO' : 'MTS';
        payload = {
          id: recordId,
          name: payload.name,
          stock_qty: payload.onHand ?? payload.stock_qty ?? 0,
          sales_price: payload.salesPrice ?? payload.sales_price ?? 0,
          cost_price: payload.costPrice ?? payload.cost_price ?? 0,
          procurement_strategy: strategy,
          procurement_type: payload.procurementMethod === 'MANUFACTURING' || payload.procurement_type === 'manufacturing' ? 'manufacturing' : 'purchase'
        };
      } else if (task.entity === 'sales_order') {
        const productId = payload.lines && payload.lines.length > 0 
          ? getDeterministicUUID(payload.lines[0].productId)
          : (payload.product_id ? getDeterministicUUID(payload.product_id) : null);
        
        const quantity = payload.lines && payload.lines.length > 0
          ? payload.lines[0].quantity
          : (payload.quantity || 1);

        payload = {
          id: recordId,
          customer_name: payload.customerName || payload.customer_name || 'Generic Customer',
          product_id: productId,
          quantity: quantity,
          shortage: payload.shortage || 0,
          status: (payload.status || 'draft').toLowerCase()
        };
      } else if (task.entity === 'purchase_order') {
        payload = {
          id: recordId,
          product_id: getDeterministicUUID(payload.productId || payload.product_id),
          required_qty: payload.requiredQty ?? payload.required_qty ?? 1,
          supplier: payload.supplier || 'Auto Supplier',
          status: (payload.status || 'draft').toLowerCase()
        };
      } else if (task.entity === 'manufacturing_order') {
        payload = {
          id: recordId,
          product_id: getDeterministicUUID(payload.productId || payload.product_id),
          required_qty: payload.requiredQty ?? payload.required_qty ?? 1,
          status: (payload.status || 'draft').toLowerCase()
        };
      } else if (task.entity === 'bom') {
        payload = {
          id: recordId,
          product_id: getDeterministicUUID(payload.productId || payload.product_id),
          raw_material: payload.rawMaterial || payload.raw_material,
          quantity: payload.quantity || 1
        };
      }

      if (payload.product_id && payload.product_id !== null) {
        payload.product_id = getDeterministicUUID(payload.product_id);
      }

      const { error } = await supabase
        .from(table)
        .upsert(payload); 
      if (error) throw error;
    } else if (task.action === 'DELETE') {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', recordId);
      if (error) throw error;
    }
  }
}
