import { AuditLogger } from "./audit-log";
import { ProductService } from "./product-service";
import { BoMEngine, BillOfMaterial } from "./bom-engine";
import { ProcurementEngine } from "./procurement-engine";
import { SyncQueue } from "../sync/sync-queue";

export type MOStatus = "DRAFT" | "CONFIRMED" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export interface WorkOrder {
  id: string;
  operation: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
}

export interface ManufacturingOrder {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  status: MOStatus;
  bomId: string;
  workOrders: WorkOrder[];
  createdAt: string;
}

export type MOInput = Pick<ManufacturingOrder, 'productId' | 'productName' | 'quantity' | 'bomId'>;

const INITIAL_MO_DATA: ManufacturingOrder[] = [
  {
    id: 'MO-001',
    productId: 'PRD-003',
    productName: 'Hydraulic Pump Assembly',
    quantity: 5,
    status: 'IN_PROGRESS',
    bomId: 'BOM-001',
    workOrders: [
      { id: 'WO-001-1', operation: 'Assembly', status: 'DONE' },
      { id: 'WO-001-2', operation: 'Quality Testing', status: 'IN_PROGRESS' },
      { id: 'WO-001-3', operation: 'Packaging', status: 'PENDING' }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export class ManufacturingEngine {
  private static STORAGE_KEY = 'erp_manufacturing_orders';

  static getOrders(): ManufacturingOrder[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      this.saveOrders(INITIAL_MO_DATA);
      return INITIAL_MO_DATA;
    }
    return JSON.parse(data);
  }

  private static saveOrders(orders: ManufacturingOrder[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    }
  }

  static createDraftMO(input: MOInput): ManufacturingOrder {
    const orders = this.getOrders();
    const newMO: ManufacturingOrder = {
      ...input,
      id: `MO-${String(orders.length + 1).padStart(3, '0')}`,
      status: 'DRAFT',
      workOrders: [],
      createdAt: new Date().toISOString()
    };

    orders.unshift(newMO);
    this.saveOrders(orders);
    SyncQueue.enqueue('manufacturing_order', 'CREATE', newMO.id, newMO);
    AuditLogger.log('CREATE', 'Manufacturing', newMO.id, `Created DRAFT MO for ${newMO.quantity}x ${newMO.productName}`);
    return newMO;
  }

  static confirmMO(id: string): ManufacturingOrder | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    const mo = orders[index];
    if (mo.status !== 'DRAFT') throw new Error("Only DRAFT MOs can be confirmed.");

    const bom = BoMEngine.getBomForProduct(mo.productId);
    if (!bom) throw new Error("No BoM found for this product.");

    // Reserve Raw Materials
    let shortages = false;
    for (const comp of bom.components) {
      const requiredQty = comp.quantityRequired * mo.quantity;
      const reserved = ProductService.reserveStock(comp.productId, requiredQty);
      if (!reserved) {
        shortages = true;
        // Trigger Procurement for the shortage component
        ProcurementEngine.triggerProcurement(comp.productId, requiredQty, mo.id);
        AuditLogger.log('UPDATE', 'Manufacturing', mo.id, `Shortage of ${comp.productName}. Procurement triggered.`);
      }
    }

    mo.status = 'CONFIRMED';
    
    // Generate Work Orders based on BoM operations
    mo.workOrders = bom.operations.map((op, i) => ({
      id: `${mo.id}-WO-${i+1}`,
      operation: op,
      status: 'PENDING'
    }));

    orders[index] = mo;
    this.saveOrders(orders);
    SyncQueue.enqueue('manufacturing_order', 'UPDATE', mo.id, mo);
    AuditLogger.log('UPDATE', 'Manufacturing', mo.id, `Confirmed MO. Raw materials reserved.`);
    return mo;
  }

  static startProduction(id: string): ManufacturingOrder | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    const mo = orders[index];
    if (mo.status !== 'CONFIRMED') throw new Error("Only CONFIRMED MOs can be started.");

    mo.status = 'IN_PROGRESS';
    if (mo.workOrders.length > 0) {
      mo.workOrders[0].status = 'IN_PROGRESS';
    }

    orders[index] = mo;
    this.saveOrders(orders);
    SyncQueue.enqueue('manufacturing_order', 'UPDATE', mo.id, mo);
    AuditLogger.log('UPDATE', 'Manufacturing', mo.id, `Started production. Work orders active.`);
    return mo;
  }

  static completeMO(id: string): ManufacturingOrder | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    const mo = orders[index];
    if (mo.status !== 'IN_PROGRESS') throw new Error("Only IN PROGRESS MOs can be completed.");

    const bom = BoMEngine.getBomForProduct(mo.productId);
    if (!bom) throw new Error("No BoM found.");

    // 1. Dispatch (permanently deduct) raw materials that were reserved
    for (const comp of bom.components) {
      const requiredQty = comp.quantityRequired * mo.quantity;
      ProductService.dispatchStock(comp.productId, requiredQty);
    }

    // 2. Add finished goods to inventory
    const finishedGood = ProductService.getProducts().find(p => p.id === mo.productId);
    if (finishedGood) {
      // Just increase onHand directly via updateProduct, StockEngine handles the rest
      ProductService.updateProduct(mo.productId, { onHand: finishedGood.onHand + mo.quantity });
    }

    mo.status = 'DONE';
    mo.workOrders = mo.workOrders.map(wo => ({ ...wo, status: 'DONE' }));

    orders[index] = mo;
    this.saveOrders(orders);
    SyncQueue.enqueue('manufacturing_order', 'UPDATE', mo.id, mo);
    AuditLogger.log('UPDATE', 'Manufacturing', mo.id, `Completed MO. Stock ledgers updated natively.`);
    return mo;
  }

  static advanceWorkOrder(moId: string, woId: string): ManufacturingOrder | null {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === moId);
    if (index === -1) return null;

    const mo = orders[index];
    const woIndex = mo.workOrders.findIndex(w => w.id === woId);
    if (woIndex === -1) return null;

    mo.workOrders[woIndex].status = 'DONE';
    
    // Auto-start next work order if exists
    if (woIndex + 1 < mo.workOrders.length) {
      mo.workOrders[woIndex + 1].status = 'IN_PROGRESS';
    }

    orders[index] = mo;
    this.saveOrders(orders);
    SyncQueue.enqueue('manufacturing_order', 'UPDATE', mo.id, mo);
    AuditLogger.log('UPDATE', 'Manufacturing', mo.id, `Work Order ${mo.workOrders[woIndex].operation} completed.`);
    return mo;
  }
}
