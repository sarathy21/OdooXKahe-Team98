import { AuditLogger } from "./audit-log";
import { Product, ProductService } from "./product-service";
import { SyncQueue } from "../sync/sync-queue";

export type ProcurementOrderType = 'PO' | 'MO';

export interface ProcurementOrder {
  id: string;
  type: ProcurementOrderType;
  productId: string;
  productName: string;
  quantity: number;
  receivedQuantity?: number;
  status: 'DRAFT' | 'CONFIRMED' | 'PARTIAL_RECEIVED' | 'FULLY_RECEIVED' | 'CANCELLED';
  createdAt: string;
  receivedAt?: string;
  vendorName?: string;
  unitCost?: number;
  totalCost?: number;
  linkedSalesOrderId?: string;
}

export class ProcurementEngine {
  private static STORAGE_KEY = 'erp_procurement_ledger';

  static getOrders(): ProcurementOrder[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private static saveOrders(orders: ProcurementOrder[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    }
  }

  static triggerProcurement(productId: string, requiredQty: number, linkedSalesOrderId?: string): ProcurementOrder | null {
    const products = ProductService.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return null;

    // Calculate how much we need to procure. 
    // If MTO, we procure exactly the required qty.
    // If MTS, we procure required qty + lowStockThreshold to restore buffers (basic logic).
    let procureQty = requiredQty;
    if (product.procurementType === 'MTS') {
      procureQty = requiredQty + product.lowStockThreshold;
    }

    const type: ProcurementOrderType = product.procurementMethod === 'PURCHASE' ? 'PO' : 'MO';
    const idPrefix = type === 'PO' ? 'PO' : 'MO';

    const orders = this.getOrders();
    const newOrder: ProcurementOrder = {
      id: `${idPrefix}-${String(orders.length + 1).padStart(4, '0')}`,
      type,
      productId: product.id,
      productName: product.name,
      quantity: procureQty,
      receivedQuantity: 0,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      linkedSalesOrderId
    };

    orders.unshift(newOrder);
    this.saveOrders(orders);
    
    const syncEntity = type === 'PO' ? 'purchase_order' : 'manufacturing_order';
    SyncQueue.enqueue(syncEntity, 'CREATE', newOrder.id, newOrder);

    AuditLogger.log(
      'CREATE', 
      type === 'PO' ? 'Purchase Orders' : 'Manufacturing Orders', 
      newOrder.id, 
      `Auto-generated ${type} for ${procureQty}x ${product.name} due to shortage.`
    );

    return newOrder;
  }

  static createDraftPO(productId: string, quantity: number, vendorName: string, unitCost: number): ProcurementOrder | null {
    const products = ProductService.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return null;

    const orders = this.getOrders();
    const newOrder: ProcurementOrder = {
      id: `PO-${String(orders.length + 1).padStart(4, '0')}`,
      type: 'PO',
      productId: product.id,
      productName: product.name,
      quantity,
      receivedQuantity: 0,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      vendorName,
      unitCost,
      totalCost: unitCost * quantity
    };

    orders.unshift(newOrder);
    this.saveOrders(orders);
    
    SyncQueue.enqueue('purchase_order', 'CREATE', newOrder.id, newOrder);

    AuditLogger.log('CREATE', 'Purchase Orders', newOrder.id, `Created manual DRAFT PO for ${quantity}x ${product.name}`);
    return newOrder;
  }

  static confirmOrder(id: string): ProcurementOrder | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    if (orders[index].status !== 'DRAFT') throw new Error("Only DRAFT orders can be confirmed.");
    
    orders[index].status = 'CONFIRMED';
    this.saveOrders(orders);
    
    const syncEntity = orders[index].type === 'PO' ? 'purchase_order' : 'manufacturing_order';
    SyncQueue.enqueue(syncEntity, 'UPDATE', orders[index].id, orders[index]);

    AuditLogger.log('UPDATE', 'Purchase Orders', id, `Order CONFIRMED. Awaiting receipt.`);
    return orders[index];
  }

  static receiveOrder(id: string, qtyToReceive?: number): ProcurementOrder | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    const order = orders[index];
    if (order.status !== 'CONFIRMED' && order.status !== 'PARTIAL_RECEIVED') {
      throw new Error("Only CONFIRMED or PARTIAL_RECEIVED orders can be received.");
    }

    const currentReceived = order.receivedQuantity || 0;
    const remainingToReceive = order.quantity - currentReceived;
    
    // Default to fully receiving the remainder if qtyToReceive is not provided
    const actualReceivedQty = qtyToReceive !== undefined ? Math.min(qtyToReceive, remainingToReceive) : remainingToReceive;
    
    if (actualReceivedQty <= 0) throw new Error("Invalid receive quantity.");

    // Update stock natively
    const products = ProductService.getProducts();
    const product = products.find(p => p.id === order.productId);
    if (product) {
      ProductService.updateProduct(order.productId, { onHand: product.onHand + actualReceivedQty });
    }

    order.receivedQuantity = currentReceived + actualReceivedQty;
    
    if (order.receivedQuantity >= order.quantity) {
      order.status = 'FULLY_RECEIVED';
      order.receivedAt = new Date().toISOString();
    } else {
      order.status = 'PARTIAL_RECEIVED';
    }

    orders[index] = order;
    this.saveOrders(orders);
    
    const syncEntity = order.type === 'PO' ? 'purchase_order' : 'manufacturing_order';
    SyncQueue.enqueue(syncEntity, 'UPDATE', order.id, order);

    AuditLogger.log('UPDATE', 'Purchase Orders', id, `Order ${order.status}. Received ${actualReceivedQty}. Stock replenished.`);
    return order;
  }

  static cancelOrder(id: string): ProcurementOrder | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    if (orders[index].status === 'FULLY_RECEIVED' || orders[index].status === 'PARTIAL_RECEIVED') {
      throw new Error("Cannot cancel an order that has already been partially or fully received.");
    }

    orders[index].status = 'CANCELLED';
    this.saveOrders(orders);
    
    const syncEntity = orders[index].type === 'PO' ? 'purchase_order' : 'manufacturing_order';
    SyncQueue.enqueue(syncEntity, 'UPDATE', orders[index].id, orders[index]);

    AuditLogger.log('UPDATE', 'Purchase Orders', id, `Order CANCELLED.`);
    return orders[index];
  }
}
