"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Search, Plus, MoreHorizontal, Package, AlertTriangle, Edit2, Trash2 } from "lucide-react";
import { ProductService, Product, ProductInput } from "@/lib/erp/product-service";
import { ProcurementType } from "@/lib/erp/stock-engine";

export default function ProductsPage() {
  const [loading, setLoading] = React.useState(true);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Drawer & Modal State
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [deleteProductCandidate, setDeleteProductCandidate] = React.useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = React.useState<ProductInput>({
    name: '', sku: '', category: '', salesPrice: 0, costPrice: 0, onHand: 0, lowStockThreshold: 10, procurementType: 'MTS', procurementMethod: 'PURCHASE', vendor: ''
  });

  // Load data on mount
  React.useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setProducts(ProductService.getProducts().filter(p => p.isActive));
      setLoading(false);
    }, 400); // simulate latency
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({ name: '', sku: '', category: '', salesPrice: 0, costPrice: 0, onHand: 0, lowStockThreshold: 10, procurementType: 'MTS', procurementMethod: 'PURCHASE', vendor: '' });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      category: prod.category,
      salesPrice: prod.salesPrice,
      costPrice: prod.costPrice,
      onHand: prod.onHand,
      lowStockThreshold: prod.lowStockThreshold,
      procurementType: prod.procurementType,
      procurementMethod: prod.procurementMethod,
      vendor: prod.vendor,
      sku: prod.sku
    });
    setIsDrawerOpen(true);
  };

  const handleSave = () => {
    if (editingProduct) {
      ProductService.updateProduct(editingProduct.id, formData);
    } else {
      ProductService.createProduct(formData);
    }
    refreshData();
    setIsDrawerOpen(false);
  };

  const handleDelete = () => {
    if (deleteProductCandidate) {
      try {
        ProductService.deleteProduct(deleteProductCandidate.id);
        refreshData();
        setDeleteProductCandidate(null);
      } catch (e: any) {
        alert(e.message);
        setDeleteProductCandidate(null);
      }
    }
  };

  // LIVE FILTERING LOGIC
  const filteredProducts = React.useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, products]);

  const columns = [
    { header: "ID / SKU", accessorKey: "id", cell: (r: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{r.id}</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase">{r.sku}</span>
        </div>
      ) 
    },
    { header: "Product Name", accessorKey: "name", cell: (r: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{r.name}</span>
          <span className="text-[10px] text-slate-500">{r.vendor}</span>
        </div>
      ) 
    },
    { header: "Category", accessorKey: "category" },
    { 
      header: "Stock (Free / On Hand)", 
      accessorKey: "stockInfo", 
      align: "right" as const,
      cell: (r: any) => (
        <div className="flex flex-col items-end">
          <span className="font-bold text-slate-900">{r.freeQty} Free</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{r.onHand} Total ({r.reserved} Rsv)</span>
        </div>
      )
    },
    { 
      header: "Procurement", 
      accessorKey: "procurementType", 
      align: "center" as const,
      cell: (r: any) => (
        <div className="flex flex-col items-center gap-1">
          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border ${r.procurementType === 'MTS' ? 'border-[#774F6C] text-[#774F6C] bg-[#774F6C]/5' : 'border-slate-300 text-slate-500 bg-slate-50'}`}>
            {r.procurementType}
          </span>
          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 border ${r.procurementMethod === 'PURCHASE' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-amber-500 text-amber-600 bg-amber-50'}`}>
            {r.procurementMethod === 'PURCHASE' ? 'PO' : 'MO'}
          </span>
        </div>
      )
    },
    { 
      header: "Price (₹)", 
      accessorKey: "salesPrice", 
      align: "right" as const,
      cell: (r: any) => `₹${r.salesPrice.toLocaleString('en-IN')}`
    },
    { 
      header: "Status", 
      accessorKey: "status", 
      align: "center" as const, 
      cell: (r: any) => {
        let variant = 'default';
        if (r.status === 'in stock') variant = 'success';
        if (r.status === 'low stock') variant = 'warning';
        if (r.status === 'out of stock') variant = 'critical';
        return <StatusBadge status={variant as any} label={r.status.toUpperCase()} />;
      }
    },
    {
      header: "Action",
      accessorKey: "action",
      align: "center" as const,
      cell: (r: any) => (
        <div className="flex items-center justify-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(r); }} className="p-1.5 hover:bg-[#774F6C]/10 rounded-sm text-slate-400 hover:text-[#774F6C] transition-colors" title="Edit">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteProductCandidate(r); }} className="p-1.5 hover:bg-rose-50 rounded-sm text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <ProtectedRoute module="PRODUCTS">
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 relative min-h-screen pb-12">
      <PageHeader 
        title="Products" 
        breadcrumbs={["Dashboard", "Products"]}
        actions={
          <button onClick={handleOpenCreate} className="bg-[#774F6C] text-white px-4 py-2 font-bold text-sm tracking-widest uppercase hover:bg-[#774F6C]/90 transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        }
      />

      {/* SEARCH + SUMMARY BAR */}
      <div className="bg-white p-4 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative group w-full md:w-[400px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 group-focus-within:text-[#774F6C] transition-colors" />
            <input 
              type="text" 
              placeholder="Filter by product name, ID or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 bg-[#F9FAFB] border border-gray-100 focus:border-[#774F6C]/40 focus:bg-white focus:ring-2 focus:ring-[#774F6C]/5 rounded-none text-sm w-full transition-all outline-none font-semibold text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-[#F9FAFB] border border-gray-100">
            <Package className="w-4 h-4 text-[#774F6C]" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Active Products</span>
              <span className="text-sm font-black text-slate-900 mt-1 leading-none">{products.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-white border border-gray-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] animate-in fade-in duration-300">
        {loading ? (
          <TableSkeleton columns={8} rows={8} />
        ) : filteredProducts.length > 0 ? (
          <DataTable data={filteredProducts} columns={columns} onRowClick={handleOpenEdit} />
        ) : (
          <div className="w-full flex flex-col items-center justify-center py-24 text-center">
            <Package className="w-12 h-12 text-slate-200 mb-4" />
            <h3 className="text-lg font-black text-slate-900">No products found</h3>
            <p className="text-sm font-semibold text-slate-500 mt-1 max-w-sm">
              We couldn't find any active products matching "{searchTerm}".
            </p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-6 px-4 py-2 text-sm font-bold text-[#774F6C] bg-[#774F6C]/10 hover:bg-[#774F6C]/20 transition-colors rounded-none"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      {/* CREATE / EDIT DRAWER */}
      <div className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-150 ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsDrawerOpen(false)} />
      <div className={`fixed top-0 right-0 bottom-0 w-full max-w-[500px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-150 ease-in-out border-l border-[#875A7B]/20 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-[#F9FAFB]">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900">{editingProduct ? `Edit ${editingProduct.id}` : 'New Product'}</h2>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              {editingProduct ? 'Modify existing inventory item' : 'Add new item to stock ledger'}
            </span>
          </div>
          <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-sm hover:bg-white border border-transparent hover:border-gray-200 text-slate-500 transition-all shadow-sm">
            <span className="text-xl font-bold leading-none px-1">×</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Product Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 focus:ring-2 focus:ring-[#774F6C]/5 outline-none text-sm font-semibold text-slate-900 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">SKU</label>
                <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-semibold text-slate-900 transition-all" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Category</label>
                <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-semibold text-slate-900 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Vendor</label>
                <input type="text" value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-semibold text-slate-900 transition-all" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Procurement Strategy</label>
                <select value={formData.procurementType} onChange={e => setFormData({...formData, procurementType: e.target.value as ProcurementType})} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-semibold text-slate-900 transition-all">
                  <option value="MTS">Make To Stock (MTS)</option>
                  <option value="MTO">Make To Order (MTO)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Procurement Type</label>
                <select value={formData.procurementMethod} onChange={e => setFormData({...formData, procurementMethod: e.target.value as any})} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-semibold text-slate-900 transition-all">
                  <option value="PURCHASE">Purchase</option>
                  <option value="MANUFACTURING">Manufacturing</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sales Price (₹)</label>
                <input type="number" value={formData.salesPrice} onChange={e => setFormData({...formData, salesPrice: Number(e.target.value)})} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-semibold text-slate-900 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Cost Price (₹)</label>
                <input type="number" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-semibold text-slate-900 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 mt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Initial / On Hand Qty</label>
                <input type="number" value={formData.onHand} onChange={e => setFormData({...formData, onHand: Number(e.target.value)})} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-semibold text-slate-900 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Low Stock Threshold</label>
                <input type="number" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: Number(e.target.value)})} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-semibold text-slate-900 transition-all" />
              </div>
            </div>

            <div className="bg-[#774F6C]/5 p-4 border border-[#774F6C]/20 mt-4 text-xs font-semibold text-[#774F6C] flex gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Saving this product will automatically generate an Audit Log entry and recalculate stock ledger values including Free Qty.</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-100 bg-[#F9FAFB] flex justify-end gap-3">
          <button onClick={() => setIsDrawerOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2.5 text-sm font-bold text-white bg-[#774F6C] hover:bg-[#774F6C]/90 transition-all">
            {editingProduct ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </div>

      {/* CONFIRM DELETE DIALOG */}
      {deleteProductCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200 p-4">
          <div className="bg-white max-w-md w-full shadow-2xl border-t-[6px] border-rose-600 p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-900 mb-2">Delete Product?</h2>
            <p className="text-sm font-semibold text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-black text-slate-900">{deleteProductCandidate.name}</span>? This is a soft delete and will remove it from active ledgers, but preserve historical audit logs.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteProductCandidate(null)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-[#F9FAFB] border border-gray-200 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors">
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </ProtectedRoute>
  );
}
