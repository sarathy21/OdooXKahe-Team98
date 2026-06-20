import { AuditLogger } from "./audit-log";
import { StockEngine, ProcurementType } from "./stock-engine";
import { SyncQueue } from "../sync/sync-queue";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  salesPrice: number;
  costPrice: number;
  onHand: number;
  reserved: number;
  freeQty: number;
  lowStockThreshold: number;
  procurementType: ProcurementType;
  procurementMethod: 'PURCHASE' | 'MANUFACTURING';
  vendor: string;
  status: 'in stock' | 'low stock' | 'out of stock';
  isActive: boolean;
}

export type ProductInput = Omit<Product, 'id' | 'freeQty' | 'status' | 'isActive' | 'reserved'>;

const INITIAL_DUMMY_DATA: Product[] = [
  { id: 'PRD-001', sku: 'MOT-5HP', name: 'Industrial Motor 5HP', category: 'Machinery', salesPrice: 45000, costPrice: 38000, onHand: 45, reserved: 5, freeQty: 40, lowStockThreshold: 10, procurementType: 'MTS', procurementMethod: 'PURCHASE', vendor: 'Global Motors Inc', status: 'in stock', isActive: true },
  { id: 'PRD-002', sku: 'BRG-10MM', name: 'Steel Bearings (10mm)', category: 'Hardware', salesPrice: 250, costPrice: 150, onHand: 12, reserved: 10, freeQty: 2, lowStockThreshold: 50, procurementType: 'MTS', procurementMethod: 'PURCHASE', vendor: 'Steelworks Ltd', status: 'low stock', isActive: true },
  { id: 'PRD-003', sku: 'PMP-HYD', name: 'Hydraulic Pump Assembly', category: 'Hydraulics', salesPrice: 125000, costPrice: 95000, onHand: 0, reserved: 0, freeQty: 0, lowStockThreshold: 5, procurementType: 'MTO', procurementMethod: 'MANUFACTURING', vendor: 'Internal', status: 'out of stock', isActive: true },
];

export class ProductService {
  private static STORAGE_KEY = 'erp_products_ledger';

  static getProducts(): Product[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      // Initialize with dummy data on first load
      this.saveProducts(INITIAL_DUMMY_DATA);
      return INITIAL_DUMMY_DATA;
    }
    return JSON.parse(data);
  }

  private static saveProducts(products: Product[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(products));
    }
  }

  static createProduct(input: ProductInput): Product {
    const products = this.getProducts();
    
    const calculation = StockEngine.evaluateStock(
      input.onHand,
      0, // Reserved is initially 0
      input.lowStockThreshold,
      input.procurementType
    );

    const newProduct: Product = {
      ...input,
      sku: input.sku || `SKU-${Date.now().toString().slice(-4)}`,
      id: `PRD-${String(products.length + 1).padStart(3, '0')}`,
      reserved: 0,
      freeQty: calculation.freeQty,
      status: calculation.status,
      isActive: true
    };

    products.unshift(newProduct);
    this.saveProducts(products);
    
    SyncQueue.enqueue('product', 'CREATE', newProduct.id, newProduct);

    AuditLogger.log('CREATE', 'Products', newProduct.id, `Created product: ${newProduct.name} with Initial Stock: ${newProduct.onHand}`);
    
    return newProduct;
  }

  static updateProduct(id: string, updates: Partial<ProductInput>): Product | null {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    const existing = products[index];
    const newOnHand = updates.onHand ?? existing.onHand;
    const newThreshold = updates.lowStockThreshold ?? existing.lowStockThreshold;
    const newProcType = updates.procurementType ?? existing.procurementType;

    const calculation = StockEngine.evaluateStock(
      newOnHand,
      existing.reserved,
      newThreshold,
      newProcType
    );

    const updatedProduct: Product = {
      ...existing,
      ...updates,
      freeQty: calculation.freeQty,
      status: calculation.status
    };

    products[index] = updatedProduct;
    this.saveProducts(products);
    
    SyncQueue.enqueue('product', 'UPDATE', updatedProduct.id, updatedProduct);

    AuditLogger.log('UPDATE', 'Products', id, `Updated product: ${updatedProduct.name}`);
    return updatedProduct;
  }

  static deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;

    // Simulate "linked" check - if reserved > 0, it's used in an SO/MO
    if (products[index].reserved > 0) {
      throw new Error("Cannot delete product: Stock is currently reserved for an active order.");
    }

    // Soft delete
    products[index].isActive = false;
    this.saveProducts(products);
    
    SyncQueue.enqueue('product', 'UPDATE', products[index].id, products[index]);

    AuditLogger.log('DELETE', 'Products', id, `Soft deleted product: ${products[index].name}`);
    return true;
  }

  static reserveStock(id: string, qty: number): boolean {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;

    const product = products[index];
    if (product.freeQty < qty) {
      return false; // Insufficient stock
    }

    product.reserved += qty;
    
    // Recalculate
    const calc = StockEngine.evaluateStock(product.onHand, product.reserved, product.lowStockThreshold, product.procurementType);
    product.freeQty = calc.freeQty;
    product.status = calc.status;

    products[index] = product;
    this.saveProducts(products);
    
    SyncQueue.enqueue('product', 'UPDATE', product.id, product);

    AuditLogger.log('UPDATE', 'Products', id, `Reserved ${qty} units. New Free Qty: ${product.freeQty}`);
    return true;
  }

  static releaseStock(id: string, qty: number): boolean {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;

    const product = products[index];
    // Don't release more than what is reserved
    const actualRelease = Math.min(product.reserved, qty);
    product.reserved -= actualRelease;

    // Recalculate
    const calc = StockEngine.evaluateStock(product.onHand, product.reserved, product.lowStockThreshold, product.procurementType);
    product.freeQty = calc.freeQty;
    product.status = calc.status;

    products[index] = product;
    this.saveProducts(products);
    
    SyncQueue.enqueue('product', 'UPDATE', product.id, product);

    AuditLogger.log('UPDATE', 'Products', id, `Released ${actualRelease} reserved units. New Free Qty: ${product.freeQty}`);
    return true;
  }

  static dispatchStock(id: string, qty: number): boolean {
    // This reduces both On Hand and Reserved (used when order is delivered)
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;

    const product = products[index];
    const actualDispatch = Math.min(product.reserved, qty);
    product.reserved -= actualDispatch;
    product.onHand -= actualDispatch; // Actually leave the warehouse

    const calc = StockEngine.evaluateStock(product.onHand, product.reserved, product.lowStockThreshold, product.procurementType);
    product.freeQty = calc.freeQty;
    product.status = calc.status;

    products[index] = product;
    this.saveProducts(products);
    
    SyncQueue.enqueue('product', 'UPDATE', product.id, product);

    AuditLogger.log('STOCK_ADJUSTMENT', 'Products', id, `Dispatched ${actualDispatch} units. New OnHand: ${product.onHand}`);
    return true;
  }
}
