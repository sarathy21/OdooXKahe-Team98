export type SyncEntity = 'product' | 'sales_order' | 'purchase_order' | 'manufacturing_order' | 'bom' | 'audit_log';
export type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface SyncTask {
  id: string;
  entity: SyncEntity;
  action: SyncAction;
  recordId: string;
  payload: any;
  createdAt: string;
  status: 'PENDING' | 'FAILED';
  retryCount: number;
  lastError?: string;
}
