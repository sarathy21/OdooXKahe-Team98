import { SyncTask, SyncEntity, SyncAction } from './sync-types';

export class SyncQueue {
  private static STORAGE_KEY = 'erp_sync_queue';

  static getQueue(): SyncTask[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static saveQueue(queue: SyncTask[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    }
  }

  static enqueue(entity: SyncEntity, action: SyncAction, recordId: string, payload: any) {
    const queue = this.getQueue();
    const newTask: SyncTask = {
      id: `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      entity,
      action,
      recordId,
      payload,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0
    };
    
    queue.push(newTask);
    this.saveQueue(queue);
    
    // Non-blocking trigger to process queue
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('erp-sync-trigger'));
    }
  }
  
  static dequeue(taskId: string) {
    const queue = this.getQueue();
    const filtered = queue.filter(t => t.id !== taskId);
    this.saveQueue(filtered);
  }

  static markFailed(taskId: string, error: string) {
    const queue = this.getQueue();
    const index = queue.findIndex(t => t.id === taskId);
    if (index !== -1) {
      queue[index].status = 'FAILED';
      queue[index].retryCount += 1;
      queue[index].lastError = error;
      this.saveQueue(queue);
    }
  }
}
