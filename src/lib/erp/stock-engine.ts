export type ProcurementType = 'MTS' | 'MTO';

export interface StockCalculation {
  onHand: number;
  reserved: number;
  freeQty: number;
  status: 'in stock' | 'low stock' | 'out of stock';
  procurementStatus: string;
}

export class StockEngine {
  /**
   * Calculates Free Qty and determines Stock Status based on thresholds
   */
  static evaluateStock(
    onHand: number, 
    reserved: number, 
    lowStockThreshold: number,
    procurementType: ProcurementType
  ): StockCalculation {
    const freeQty = Math.max(0, onHand - reserved);
    
    let status: 'in stock' | 'low stock' | 'out of stock' = 'in stock';
    
    if (freeQty === 0) {
      status = 'out of stock';
    } else if (freeQty <= lowStockThreshold) {
      status = 'low stock';
    }

    let procurementStatus = 'Optimal';
    if (procurementType === 'MTS' && status !== 'in stock') {
      procurementStatus = 'Auto-PO Triggered';
    } else if (procurementType === 'MTO' && status === 'out of stock') {
      procurementStatus = 'Awaiting Mfg Order';
    }

    return {
      onHand,
      reserved,
      freeQty,
      status,
      procurementStatus
    };
  }
}
