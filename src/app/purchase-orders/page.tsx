"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Search, Plus, Truck, AlertTriangle, CheckCircle, Ban, Play, FileText, ShoppingBag } from "lucide-react";
import { ProcurementEngine, ProcurementOrder } from "@/lib/erp/procurement-engine";
import { ProductService, Product } from "@/lib/erp/product-service";

export default function PurchaseOrdersPage() {
  const [loading, setLoading] = React.useState(true);
  const [orders, setOrders] = React.useState<ProcurementOrder[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Modals / Drawers
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = React.useState(false);
  const [actionCandidate, setActionCandidate] = React.useState<{ order: ProcurementOrder, action: 'CONFIRM'|'RECEIVE'|'CANCEL' } | null>(null);
  const [receiveQtyInput, setReceiveQtyInput] = React.useState<number>(0);

  // Form State
  const [newVendor, setNewVendor] = React.useState('');
  const [newProductId, setNewProductId] = React.useState('');
  const [newQuantity, setNewQuantity] = React.useState(1);
  const [newUnitCost, setNewUnitCost] = React.useState(0);

  React.useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      // We only care about Purchase Orders in this view, not Manufacturing Orders
      setOrders(ProcurementEngine.getOrders().filter(o => o.type === 'PO'));
      setProducts(ProductService.getProducts().filter(p => p.isActive && p.procurementType === 'MTS'));
      setLoading(false);
    }, 400); // Simulate API latency
  };

  const handleOpenCreate = () => {
    if (products.length > 0) {
      setNewProductId(products[0].id);
      setNewUnitCost(products[0].costPrice);
    }
    setIsCreateDrawerOpen(true);
  };

  const handleProductSelect = (id: string) => {
    setNewProductId(id);
    const p = products.find(prod => prod.id === id);
    if (p) setNewUnitCost(p.costPrice);
  };

  const handleSaveDraft = () => {
    if (!newVendor || !newProductId || newQuantity <= 0) return alert("All fields required.");
    
    ProcurementEngine.createDraftPO(newProductId, newQuantity, newVendor, newUnitCost);
    refreshData();
    setIsCreateDrawerOpen(false);
    setNewVendor('');
    setNewQuantity(1);
  };

  const executeAction = () => {
    if (!actionCandidate) return;
    try {
      if (actionCandidate.action === 'CONFIRM') ProcurementEngine.confirmOrder(actionCandidate.order.id);
      if (actionCandidate.action === 'RECEIVE') {
        if (receiveQtyInput <= 0) return alert("Quantity must be greater than 0");
        ProcurementEngine.receiveOrder(actionCandidate.order.id, receiveQtyInput);
      }
      if (actionCandidate.action === 'CANCEL') ProcurementEngine.cancelOrder(actionCandidate.order.id);
      refreshData();
      setActionCandidate(null);
      setReceiveQtyInput(0);
    } catch (e: any) {
      alert(e.message);
      setActionCandidate(null);
      setReceiveQtyInput(0);
    }
  };

  // KPIs
  const totalPOs = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PARTIAL_RECEIVED').length;
  const completedOrders = orders.filter(o => o.status === 'FULLY_RECEIVED').length;
  const totalSpend = orders.filter(o => o.status === 'FULLY_RECEIVED' || o.status === 'PARTIAL_RECEIVED')
    .reduce((sum, o) => sum + ((o.receivedQuantity || 0) * (o.unitCost || 0)), 0);

  const filteredOrders = React.useMemo(() => {
    if (!searchTerm) return orders;
    return orders.filter(o => 
      o.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.vendorName && o.vendorName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, orders]);

  const columns = [
    { header: "PO ID", accessorKey: "id", width: "w-24" },
    { 
      header: "Vendor", 
      accessorKey: "vendorName",
      cell: (r: any) => r.vendorName ? (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
          <Truck className="w-3 h-3 text-slate-500" /> {r.vendorName}
        </span>
      ) : <span className="text-slate-400 italic">Auto-Generated</span>
    },
    { header: "Product", accessorKey: "productName" },
    { 
      header: "Quantity", 
      accessorKey: "quantity", 
      align: "center" as const,
      cell: (r: any) => {
        const received = r.receivedQuantity || 0;
        const total = r.quantity;
        const progress = Math.round((received / total) * 100);
        return (
          <div className="flex flex-col gap-1 w-full max-w-[120px] mx-auto">
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span>{received} / {total}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : progress > 0 ? 'bg-amber-500' : 'bg-slate-300'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      }
    },
    { 
      header: "Total Cost", 
      accessorKey: "totalCost", 
      align: "right" as const,
      cell: (r: any) => r.totalCost ? `₹${r.totalCost.toLocaleString('en-IN')}` : '-'
    },
    { 
      header: "Status", 
      accessorKey: "status", 
      align: "center" as const, 
      cell: (r: any) => {
        let variant = 'default';
        let label = r.status;
        if (r.status === 'FULLY_RECEIVED') { variant = 'success'; label = 'RECEIVED'; }
        if (r.status === 'PARTIAL_RECEIVED') { variant = 'warning'; label = 'PARTIAL'; }
        if (r.status === 'CONFIRMED') variant = 'info';
        if (r.status === 'CANCELLED') variant = 'critical';
        return <StatusBadge status={variant as any} label={label} />;
      }
    },
    { header: "Created At", accessorKey: "createdAt", cell: (r: any) => new Date(r.createdAt).toLocaleDateString() },
    {
      header: "Action",
      accessorKey: "action",
      align: "center" as const,
      cell: (r: ProcurementOrder) => (
        <div className="flex items-center justify-center gap-2">
          {r.status === 'DRAFT' && (
            <button onClick={(e) => { e.stopPropagation(); setActionCandidate({order: r, action: 'CONFIRM'})}} className="p-1.5 hover:bg-[#774F6C]/10 rounded-sm text-slate-400 hover:text-[#774F6C] transition-colors" title="Confirm PO">
              <Play className="w-4 h-4" />
            </button>
          )}
          {(r.status === 'CONFIRMED' || r.status === 'PARTIAL_RECEIVED') && (
            <button onClick={(e) => { 
              e.stopPropagation(); 
              const remaining = r.quantity - (r.receivedQuantity || 0);
              setReceiveQtyInput(remaining);
              setActionCandidate({order: r, action: 'RECEIVE'});
            }} className="p-1.5 hover:bg-emerald-50 rounded-sm text-slate-400 hover:text-emerald-600 transition-colors" title="Receive Stock">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {(r.status === 'DRAFT' || r.status === 'CONFIRMED') && (
            <button onClick={(e) => { e.stopPropagation(); setActionCandidate({order: r, action: 'CANCEL'})}} className="p-1.5 hover:bg-rose-50 rounded-sm text-slate-400 hover:text-rose-600 transition-colors" title="Cancel PO">
              <Ban className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <ProtectedRoute module="PURCHASE">
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 relative min-h-screen pb-12">
      <PageHeader 
        title="Purchase Orders" 
        breadcrumbs={["Dashboard", "Procurement", "Purchase Orders"]}
        actions={
          <button onClick={handleOpenCreate} className="bg-[#774F6C] text-white px-4 py-2 font-bold text-sm tracking-widest uppercase hover:bg-[#774F6C]/90 transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create PO
          </button>
        }
      />

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 p-4 flex flex-col shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] border-l-[4px] border-l-[#774F6C]">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total POs</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{totalPOs}</span>
            <FileText className="w-5 h-5 text-[#774F6C]/40" />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 flex flex-col shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] border-l-[4px] border-l-amber-500">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Pending Receipts</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{pendingOrders}</span>
            <Truck className="w-5 h-5 text-amber-500/40" />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 flex flex-col shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] border-l-[4px] border-l-emerald-500">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Spend</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">₹{totalSpend.toLocaleString('en-IN')}</span>
            <ShoppingBag className="w-5 h-5 text-emerald-500/40" />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 flex flex-col shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] border-l-[4px] border-l-emerald-500">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Completed</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{completedOrders}</span>
            <CheckCircle className="w-5 h-5 text-emerald-500/40" />
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
        <div className="relative group w-full md:w-[400px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 group-focus-within:text-[#774F6C] transition-colors" />
          <input 
            type="text" 
            placeholder="Search orders by ID, Vendor or Product..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 bg-[#F9FAFB] border border-gray-100 focus:border-[#774F6C]/40 focus:bg-white focus:ring-2 focus:ring-[#774F6C]/5 rounded-none text-sm w-full transition-all outline-none font-semibold text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className="bg-white border border-gray-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] animate-in fade-in duration-300">
        {loading ? <TableSkeleton columns={8} rows={6} /> : <DataTable data={filteredOrders} columns={columns} />}
      </div>

      {/* CREATE PO DRAWER */}
      <div className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-150 ${isCreateDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCreateDrawerOpen(false)} />
      <div className={`fixed top-0 right-0 bottom-0 w-full max-w-[500px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-150 ease-in-out border-l border-[#875A7B]/20 ${isCreateDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-[#F9FAFB]">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900">Create Purchase Order</h2>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Draft PO for Procurement</span>
          </div>
          <button onClick={() => setIsCreateDrawerOpen(false)} className="p-2 rounded-sm hover:bg-white border border-transparent hover:border-gray-200 text-slate-500 transition-all shadow-sm">
            <span className="text-xl font-bold leading-none px-1">×</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white space-y-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Vendor Name</label>
            <input type="text" value={newVendor} onChange={e => setNewVendor(e.target.value)} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-semibold text-slate-900 transition-all" placeholder="Enter supplier/vendor name" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Material Selection</label>
            <select value={newProductId} onChange={e => handleProductSelect(e.target.value)} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-semibold text-slate-900 transition-all">
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Current: {p.onHand})</option>)}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Quantity</label>
              <input type="number" min="1" value={newQuantity} onChange={e => setNewQuantity(Number(e.target.value))} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-semibold text-slate-900 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Cost Per Unit (₹)</label>
              <input type="number" min="0" value={newUnitCost} onChange={e => setNewUnitCost(Number(e.target.value))} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-semibold text-slate-900 transition-all" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-slate-600">Total Draft Cost</span>
            <span className="text-2xl font-black text-[#774F6C]">₹{(newQuantity * newUnitCost).toLocaleString('en-IN')}</span>
          </div>
          
          <div className="bg-[#774F6C]/5 p-3 border border-[#774F6C]/20 mt-4 text-xs font-semibold text-[#774F6C] flex gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Draft POs do not affect inventory. They must be Confirmed, and subsequently Marked Received, to physically replenish the stock ledger.</p>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-100 bg-[#F9FAFB] flex justify-end gap-3">
          <button onClick={() => setIsCreateDrawerOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSaveDraft} className="px-4 py-2 text-sm font-bold text-white bg-[#774F6C] hover:bg-[#774F6C]/90 transition-all">Save as Draft</button>
        </div>
      </div>

      {/* CONFIRM ACTION DIALOG */}
      {actionCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200 p-4">
          <div className="bg-white max-w-md w-full shadow-2xl border-t-[6px] border-[#774F6C] p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-900 mb-2">
              {actionCandidate.action === 'CONFIRM' ? 'Confirm Purchase Order?' : 
               actionCandidate.action === 'RECEIVE' ? 'Mark as Received?' : 'Cancel Purchase Order?'}
            </h2>
            <p className="text-sm font-semibold text-slate-600 mb-6 leading-relaxed">
              {actionCandidate.action === 'CONFIRM' && "Confirming this PO will formally send it to the vendor. It remains pending until the items physically arrive."}
              {actionCandidate.action === 'RECEIVE' && "Receiving this PO will actively replenish the inventory stock ledger."}
              {actionCandidate.action === 'CANCEL' && "Cancelling this PO will terminate it without replenishing any stock."}
            </p>

            {actionCandidate.action === 'RECEIVE' && (
              <div className="flex flex-col gap-1.5 mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Quantity to Receive</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="1" 
                    max={actionCandidate.order.quantity - (actionCandidate.order.receivedQuantity || 0)}
                    value={receiveQtyInput} 
                    onChange={e => setReceiveQtyInput(Number(e.target.value))} 
                    className="flex-1 px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-bold text-slate-900 transition-all" 
                  />
                  <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-2 border border-slate-200">
                    / {actionCandidate.order.quantity - (actionCandidate.order.receivedQuantity || 0)} Remaining
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setActionCandidate(null)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-[#F9FAFB] border border-gray-200 hover:bg-gray-100 transition-colors">Abort</button>
              <button onClick={executeAction} className={`px-4 py-2 text-sm font-bold text-white transition-colors ${actionCandidate.action === 'CANCEL' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#774F6C] hover:bg-[#774F6C]/90'}`}>
                Execute Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
