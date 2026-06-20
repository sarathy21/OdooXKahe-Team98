import { ProductService } from './product-service';

export function migrateLegacyLocalStorage() {
  if (typeof window === 'undefined') return;

  const MIGRATION_KEY = 'erp_legacy_migration_v1';
  
  // Only execute once
  if (localStorage.getItem(MIGRATION_KEY) === 'completed') {
    return;
  }

  const keysToInspect = [
    'erp_products_ledger',
    'erp_sales_orders',
    'erp_purchase_orders',
    'erp_manufacturing_orders',
    'erp_bom',
    'erp_sync_queue'
  ];

  let hasLegacyData = false;

  // 1. Detect any legacy PRD-*, SO-*, PO-*, MO-* string keys in local storage values
  keysToInspect.forEach((key) => {
    const data = localStorage.getItem(key);
    if (data && (
      data.includes('PRD-') || 
      data.includes('SO-') || 
      data.includes('PO-') || 
      data.includes('MO-') || 
      data.includes('BOM-')
    )) {
      hasLegacyData = true;
    }
  });

  // 2. Clear legacy storage keys if legacy keys are found
  if (hasLegacyData) {
    console.log('--- ERP MIGRATION UTILITY ---');
    console.log('Legacy mock ID formats detected. Clearing local state to synchronize with Supabase...');
    
    keysToInspect.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log('Legacy local data cleared. Rehydration queued.');
  }

  // 3. Mark migration as completed so it never runs again
  localStorage.setItem(MIGRATION_KEY, 'completed');

  // 4. Trigger initial clean hydration from Supabase
  if (hasLegacyData) {
    ProductService.hydrateFromSupabase().then(() => {
      console.log('Clean hydration completed. UI synchronized with database.');
    }).catch((err) => {
      console.error('Initial hydration failed:', err);
    });
  }
}