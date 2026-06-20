import { ProductService } from "./product-service";
import { SyncQueue } from "../sync/sync-queue";

export interface BoMComponent {
  productId: string;
  productName: string;
  quantityRequired: number; // Qty required to build 1 unit of the finished good
}

export interface BillOfMaterial {
  id: string;
  finishedGoodId: string;
  finishedGoodName: string;
  components: BoMComponent[];
  operations: string[];
}

// Dummy BoM Database
const INITIAL_BOMS: BillOfMaterial[] = [
  {
    id: 'BOM-001',
    finishedGoodId: 'PRD-003', // Hydraulic Pump Assembly
    finishedGoodName: 'Hydraulic Pump Assembly',
    components: [
      { productId: 'PRD-001', productName: 'Industrial Motor 5HP', quantityRequired: 1 },
      { productId: 'PRD-002', productName: 'Steel Bearings (10mm)', quantityRequired: 4 }
    ],
    operations: ['Assembly', 'Quality Testing', 'Packaging']
  }
];

export class BoMEngine {
  private static STORAGE_KEY = 'erp_boms';

  static getBoms(): BillOfMaterial[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      this.saveBoms(INITIAL_BOMS);
      return INITIAL_BOMS;
    }
    return JSON.parse(data);
  }

  private static saveBoms(boms: BillOfMaterial[]) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(boms));
    }
  }

  static getBomForProduct(productId: string): BillOfMaterial | undefined {
    const boms = this.getBoms();
    return boms.find(b => b.finishedGoodId === productId);
  }

  static createBom(bom: Omit<BillOfMaterial, 'id'>): BillOfMaterial {
    const boms = this.getBoms();
    const newBom = {
      ...bom,
      id: `BOM-${String(boms.length + 1).padStart(3, '0')}`
    };
    boms.push(newBom);
    this.saveBoms(boms);
    SyncQueue.enqueue('bom', 'CREATE', newBom.id, newBom);
    return newBom;
  }
}
