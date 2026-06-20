export interface Product {
  id: string;
  name: string;
  stock_qty: number;
  sales_price: number;
  cost_price: number;
  procurement_strategy: string;
  procurement_type: string;
  created_at: string;
}

export interface SalesOrder {
  id: string;
  customer_name: string;
  product_id: string;
  quantity: number;
  shortage: number;
  status: string;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  product_id: string;
  required_qty: number;
  supplier: string;
  status: string;
  created_at: string;
}

export interface ManufacturingOrder {
  id: string;
  product_id: string;
  required_qty: number;
  status: string;
  created_at: string;
}

export interface BillOfMaterial {
  id: string;
  product_id: string;
  raw_material: string;
  quantity: number;
}

export interface DashboardKpis {
  totalProducts: number;
  lowStockCount: number;
  pendingSalesOrders: number;
  activeManufacturingOrders: number;
  totalStockValue: number;
}

export type ProcurementType = "purchase" | "manufacture";
export type SalesOrderStatus = "draft" | "confirmed" | "fulfilled" | "cancelled";
export type PurchaseOrderStatus = "draft" | "placed" | "received" | "completed";
export type ManufacturingOrderStatus = "draft" | "in_progress" | "completed" | "cancelled";
