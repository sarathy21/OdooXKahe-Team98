import { AuditLogger } from "./audit-log";
import { ProductService } from "./product-service";
import { ProcurementEngine } from "./procurement-engine";
import { SyncQueue } from "../sync/sync-queue";

export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'PARTIALLY DELIVERED' | 'DELIVERED' | 'CANCELLED';

export interface OrderLineItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  customerName: string;
  lines: OrderLineItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

export type SalesOrderInput = Omit<SalesOrder, 'id' | 'totalAmount' | 'status' | 'createdAt'>;

const INITIAL_SO_DATA: SalesOrder[] = [
  { 
    id: 'SO-001', customerName: 'Acme Corp', status: 'DELIVERED', createdAt: '2026-06-18', totalAmount: 125000,
    lines: [{ productId: 'PRD-001', productName: 'Industrial Motor 5HP', quantity: 2, unitPrice: 45000, total: 90000 }]
  },
  { 
    id: 'SO-002', customerName: 'Stark Ind.', status: 'CONFIRMED', createdAt: '2026-06-20', totalAmount: 344000,
    lines: [{ productId: 'PRD-003', productName: 'Hydraulic Pump Assembly', quantity: 2, unitPrice: 125000, total: 250000 }]
  }
];

export class SalesEngine {
  private static STORAGE_KEY = 'erp_sales_orders';

  static getOrders(): SalesOrder[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      this.saveOrders(INITIAL_SO_DATA);
      return INITIAL_SO_DATA;
    }
    return JSON.parse(data);
  }

  private static saveOrders(orders: SalesOrder[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    }
  }

  static createDraftOrder(input: SalesOrderInput): SalesOrder {
    const orders = this.getOrders();
    const totalAmount = input.lines.reduce((sum, line) => sum + line.total, 0);

    const newOrder: SalesOrder = {
      ...input,
      id: `SO-${String(orders.length + 1).padStart(3, '0')}`,
      totalAmount,
      status: 'DRAFT',
      createdAt: new Date().toISOString()
    };

    orders.unshift(newOrder);
    this.saveOrders(orders);
    
    SyncQueue.enqueue('sales_order', 'CREATE', newOrder.id, newOrder);

    AuditLogger.log('CREATE', 'Sales Orders', newOrder.id, `Created DRAFT order for ${input.customerName}`);
    return newOrder;
  }

  static updateDraftOrder(id: string, updates: Partial<SalesOrderInput>): SalesOrder | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    if (orders[index].status !== 'DRAFT') {
      throw new Error("Only DRAFT orders can be updated.");
    }

    const updatedOrder = { ...orders[index], ...updates };
    if (updates.lines) {
      updatedOrder.totalAmount = updates.lines.reduce((sum, line) => sum + line.total, 0);
    }

    orders[index] = updatedOrder;
    this.saveOrders(orders);
    
    SyncQueue.enqueue('sales_order', 'UPDATE', updatedOrder.id, updatedOrder);

    AuditLogger.log('UPDATE', 'Sales Orders', id, `Updated DRAFT order.`);
    return updatedOrder;
  }

  static confirmOrder(id: string): SalesOrder | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    const order = orders[index];
    if (order.status !== 'DRAFT') {
      throw new Error("Only DRAFT orders can be confirmed.");
    }

    // WORKFLOW ENGINE: Evaluate Stock & Reserve
    for (const line of order.lines) {
      const reserved = ProductService.reserveStock(line.productId, line.quantity);
      if (!reserved) {
        // Insufficient stock -> Trigger Procurement
        ProcurementEngine.triggerProcurement(line.productId, line.quantity, order.id);
        AuditLogger.log('UPDATE', 'Sales Orders', id, `Stock shortage for ${line.productName}. Procurement triggered.`);
        // Note: In a real ERP we might partially reserve, but for this mock, we just trigger procurement.
        // We will still mark the order as CONFIRMED, indicating demand is locked in.
      }
    }

    order.status = 'CONFIRMED';
    orders[index] = order;
    this.saveOrders(orders);
    
    SyncQueue.enqueue('sales_order', 'UPDATE', order.id, order);

    AuditLogger.log('UPDATE', 'Sales Orders', id, `Order CONFIRMED. Demand locked and stock logic executed.`);
    return order;
  }

  static deliverOrder(id: string): SalesOrder | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    const order = orders[index];
    if (order.status !== 'CONFIRMED' && order.status !== 'PARTIALLY DELIVERED') {
      throw new Error("Only CONFIRMED orders can be delivered.");
    }

    // Dispatch stock physically
    for (const line of order.lines) {
      ProductService.dispatchStock(line.productId, line.quantity);
    }

    order.status = 'DELIVERED';
    orders[index] = order;
    this.saveOrders(orders);
    
    SyncQueue.enqueue('sales_order', 'UPDATE', order.id, order);

    AuditLogger.log('UPDATE', 'Sales Orders', id, `Order DELIVERED. Stock physically dispatched.`);
    return order;
  }

  static cancelOrder(id: string): SalesOrder | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    const order = orders[index];
    if (order.status === 'DELIVERED') {
      throw new Error("Cannot cancel a DELIVERED order.");
    }

    // If it was confirmed, we must release the reserved stock
    if (order.status === 'CONFIRMED' || order.status === 'PARTIALLY DELIVERED') {
      for (const line of order.lines) {
        ProductService.releaseStock(line.productId, line.quantity);
      }
    }

    order.status = 'CANCELLED';
    orders[index] = order;
    this.saveOrders(orders);
    
    SyncQueue.enqueue('sales_order', 'UPDATE', order.id, order);

    AuditLogger.log('UPDATE', 'Sales Orders', id, `Order CANCELLED. Reserved stock released.`);
    return order;
  }
}
