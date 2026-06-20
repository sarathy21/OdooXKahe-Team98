"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Search, Plus, Factory, Clock, CheckCircle, AlertTriangle, Play, ChevronRight, Ban, LayoutList } from "lucide-react";
import { ManufacturingEngine, ManufacturingOrder, MOStatus } from "@/lib/erp/manufacturing-engine";
import { BoMEngine, BillOfMaterial } from "@/lib/erp/bom-engine";
import { ProductService, Product } from "@/lib/erp/product-service";

export default function ManufacturingOrdersPage() {
  const [loading, setLoading] = React.useState(true);
  const [orders, setOrders] = React.useState<ManufacturingOrder[]>([]);
  const [boms, setBoms] = React.useState<BillOfMaterial[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Drawers & Modals
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = React.useState(false);
  const [viewOrderDetails, setViewOrderDetails] = React.useState<ManufacturingOrder | null>(null);
  const [actionCandidate, setActionCandidate] = React.useState<{ order: ManufacturingOrder, action: 'CONFIRM'|'START'|'COMPLETE' } | null>(null);

  // Form State
  const [newProductId, setNewProductId] = React.useState('');
  const [newQuantity, setNewQuantity] = React.useState(1);

  React.useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setOrders(ManufacturingEngine.getOrders());
      setBoms(BoMEngine.getBoms());
      setLoading(false);
    }, 400); // simulate latency
  };

  const handleOpenCreate = () => {
    if (boms.length > 0) {
      setNewProductId(boms[0].finishedGoodId);
    }
    setIsCreateDrawerOpen(true);
  };

  const handleSaveDraft = () => {
    const bom = boms.find(b => b.finishedGoodId === newProductId);
    if (!bom) return alert("Selected product has no associated Bill of Materials.");
    
    ManufacturingEngine.createDraftMO({
      productId: bom.finishedGoodId,
      productName: bom.finishedGoodName,
      bomId: bom.id,
      quantity: newQuantity
    });
    
    refreshData();
    setIsCreateDrawerOpen(false);
  };

  const executeAction = () => {
    if (!actionCandidate) return;
    try {
      if (actionCandidate.action === 'CONFIRM') ManufacturingEngine.confirmMO(actionCandidate.order.id);
      if (actionCandidate.action === 'START') ManufacturingEngine.startProduction(actionCandidate.order.id);
      if (actionCandidate.action === 'COMPLETE') ManufacturingEngine.completeMO(actionCandidate.order.id);
      refreshData();
      setActionCandidate(null);
    } catch (e: any) {
      alert(e.message);
      setActionCandidate(null);
    }
  };

  const executeWOAction = (moId: string, woId: string) => {
    try {
      ManufacturingEngine.advanceWorkOrder(moId, woId);
      refreshData();
      const updatedMO = ManufacturingEngine.getOrders().find(o => o.id === moId);
      if (updatedMO) setViewOrderDetails(updatedMO);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // KPIs
  const totalMOs = orders.length;
  const inProgress = orders.filter(o => o.status === 'IN_PROGRESS').length;
  const completed = orders.filter(o => o.status === 'DONE').length;
  const delayed = orders.filter(o => o.status === 'CONFIRMED' && new Date(o.createdAt) < new Date(Date.now() - 86400000)).length;

  const filteredOrders = React.useMemo(() => {
    if (!searchTerm) return orders;
    return orders.filter(o => 
      o.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, orders]);

  // Check BoM requirements and target stock updates for the active candidate order
  const activeBomDetails = React.useMemo(() => {
    if (!actionCandidate) return null;
    const mo = actionCandidate.order;
    const bom = BoMEngine.getBomForProduct(mo.productId);
    if (!bom) return null;

    const currentProducts = ProductService.getProducts();
    const finishedProduct = currentProducts.find(p => p.id === mo.productId);
    const finishedProductCurrentStock = finishedProduct ? finishedProduct.onHand : 0;
    const finishedProductNewStock = finishedProductCurrentStock + mo.quantity;

    const componentsNeeded = bom.components.map(comp => {
      const p = currentProducts.find(prod => prod.id === comp.productId);
      const currentStock = p ? p.freeQty : 0;
      const needed = comp.quantityRequired * mo.quantity;
      const shortage = Math.max(0, needed - currentStock);
      return {
        productName: comp.productName,
        quantityRequired: needed,
        stock: currentStock,
        shortage,
        procurementType: p ? p.procurementType : 'MTO'
      };
    });

    return {
      components: componentsNeeded,
      finishedProductCurrentStock,
      finishedProductNewStock,
      hasShortages: componentsNeeded.some(c => c.shortage > 0)
    };
  }, [actionCandidate, orders]);

  const columns = [
    { header: "MO ID", accessorKey: "id", width: "w-24" },
    { header: "Product", accessorKey: "productName" },
    { 
      header: "Quantity", 
      accessorKey: "quantity", 
      align: "center" as const,
      cell: (r: any) => <span className="font-black text-slate-900">{r.quantity}</span>
    },
    { 
      header: "Status", 
      accessorKey: "status", 
      align: "center" as const, 
      cell: (r: any) => {
        let variant = 'default';
        if (r.status === 'DONE') variant = 'success';
        if (r.status === 'CONFIRMED') variant = 'info';
        if (r.status === 'IN_PROGRESS') variant = 'warning';
        if (r.status === 'CANCELLED') variant = 'critical';
        return <StatusBadge status={variant as any} label={r.status.replace('_', ' ')} />;
      }
    },
    { header: "Created At", accessorKey: "createdAt", cell: (r: any) => new Date(r.createdAt).toLocaleDateString() },
    {
      header: "Progress",
      accessorKey: "progress",
      align: "center" as const,
      cell: (r: ManufacturingOrder) => {
        if (r.workOrders.length === 0) return <span className="text-slate-400 text-xs">-</span>;
        const doneCount = r.workOrders.filter(w => w.status === 'DONE').length;
        const totalCount = r.workOrders.length;
        const pct = (doneCount / totalCount) * 100;
        return (
          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
          </div>
        );
      }
    },
    {
      header: "Action",
      accessorKey: "action",
      align: "center" as const,
      cell: (r: ManufacturingOrder) => (
        <div className="flex items-center justify-center gap-2">
          {r.status === 'DRAFT' && (
            <button onClick={(e) => { e.stopPropagation(); setActionCandidate({order: r, action: 'CONFIRM'})}} className="p-1.5 hover:bg-[#774F6C]/10 rounded-sm text-slate-400 hover:text-[#774F6C] transition-colors" title="Confirm MO">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {r.status === 'CONFIRMED' && (
            <button onClick={(e) => { e.stopPropagation(); setActionCandidate({order: r, action: 'START'})}} className="p-1.5 hover:bg-amber-50 rounded-sm text-slate-400 hover:text-amber-600 transition-colors" title="Start Production">
              <Play className="w-4 h-4" />
            </button>
          )}
          {r.status === 'IN_PROGRESS' && r.workOrders.every(w => w.status === 'DONE') && (
            <button onClick={(e) => { e.stopPropagation(); setActionCandidate({order: r, action: 'COMPLETE'})}} className="p-1.5 hover:bg-emerald-50 rounded-sm text-slate-400 hover:text-emerald-600 transition-colors" title="Complete MO">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <ProtectedRoute module="MANUFACTURING">
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 relative min-h-screen pb-12">
      <PageHeader 
        title="Manufacturing Orders" 
        breadcrumbs={["Dashboard", "Manufacturing"]}
        actions={
          <button onClick={handleOpenCreate} className="bg-[#774F6C] text-white px-4 py-2 font-bold text-sm tracking-widest uppercase hover:bg-[#774F6C]/90 transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create MO
          </button>
        }
      />

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 p-4 flex flex-col shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] border-l-[4px] border-l-[#774F6C]">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total MOs</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{totalMOs}</span>
            <Factory className="w-5 h-5 text-[#774F6C]/40" />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 flex flex-col shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] border-l-[4px] border-l-amber-500">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">In Progress</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{inProgress}</span>
            <Play className="w-5 h-5 text-amber-500/40" />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 flex flex-col shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] border-l-[4px] border-l-emerald-500">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Completed</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{completed}</span>
            <CheckCircle className="w-5 h-5 text-emerald-500/40" />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 flex flex-col shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] border-l-[4px] border-l-rose-500">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Delayed Production</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{delayed}</span>
            <Clock className="w-5 h-5 text-rose-500/40" />
          </div>
        </div>
      </div>

      {/* SEARCH + SUMMARY BAR */}
      <div className="bg-white p-4 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
        <div className="relative group w-full md:w-[400px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 group-focus-within:text-[#774F6C] transition-colors" />
          <input 
            type="text" 
            placeholder="Search orders by ID or Product..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 bg-[#F9FAFB] border border-gray-100 focus:border-[#774F6C]/40 focus:bg-white focus:ring-2 focus:ring-[#774F6C]/5 rounded-none text-sm w-full transition-all outline-none font-semibold text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className="bg-white border border-gray-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] animate-in fade-in duration-300">
        {loading ? <TableSkeleton columns={7} rows={6} /> : <DataTable data={filteredOrders} columns={columns} onRowClick={setViewOrderDetails} />}
      </div>

      {/* CREATE MO DRAWER */}
      <div className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-150 ${isCreateDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCreateDrawerOpen(false)} />
      <div className={`fixed top-0 right-0 bottom-0 w-full max-w-[500px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-150 ease-in-out border-l border-[#875A7B]/20 ${isCreateDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-[#F9FAFB]">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900">Create MO</h2>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Draft Production Order</span>
          </div>
          <button onClick={() => setIsCreateDrawerOpen(false)} className="p-2 rounded-sm hover:bg-white border border-transparent hover:border-gray-200 text-slate-500 transition-all shadow-sm">
            <span className="text-xl font-bold leading-none px-1">×</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white space-y-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Target Finished Good</label>
            <select value={newProductId} onChange={e => setNewProductId(e.target.value)} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-semibold text-slate-900 transition-all">
              {boms.map(b => <option key={b.id} value={b.finishedGoodId}>{b.finishedGoodName} (BoM: {b.id})</option>)}
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Production Quantity</label>
            <input type="number" min="1" value={newQuantity} onChange={e => setNewQuantity(Number(e.target.value))} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 outline-none text-sm font-semibold text-slate-900 transition-all" />
          </div>

          {newProductId && (
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-3">Required Raw Materials</h4>
              <div className="bg-[#F9FAFB] border border-gray-100 p-4 space-y-2">
                {boms.find(b => b.finishedGoodId === newProductId)?.components.map((c, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">{c.productName}</span>
                    <span className="font-black text-slate-900">{c.quantityRequired * newQuantity} units</span>
                  </div>
                ))}
              </div>
              <div className="bg-[#774F6C]/5 p-3 border border-[#774F6C]/20 mt-4 text-xs font-semibold text-[#774F6C] flex gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Confirming this MO will automatically attempt to reserve the required raw materials from inventory.</p>
              </div>
            </div>
          )}
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
              {actionCandidate.action === 'CONFIRM' ? 'Confirm Manufacturing Order?' : 
               actionCandidate.action === 'START' ? 'Start Production?' : 'Complete Manufacturing?'}
            </h2>
            
            {actionCandidate.action === 'CONFIRM' && activeBomDetails && (
              <div className="flex flex-col gap-4 mb-6">
                {activeBomDetails.hasShortages ? (
                  <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-rose-900 leading-tight">Raw Material Shortages</h4>
                      <p className="text-[10px] text-rose-700 font-semibold mt-1 leading-relaxed">
                        Deficits will automatically trigger Purchase or Manufacturing Orders upon confirmation.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-900 leading-tight">Materials Available</h4>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-1 leading-relaxed">
                        Sufficient stock is available. Materials will be reserved.
                      </p>
                    </div>
                  </div>
                )}

                <div className="border border-gray-100 rounded-sm overflow-hidden bg-slate-50">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead className="bg-slate-100 text-slate-500 uppercase tracking-widest text-[9px] border-b border-gray-100">
                      <tr>
                        <th className="px-3 py-2 font-bold">Material</th>
                        <th className="px-3 py-2 font-bold text-center">Stock</th>
                        <th className="px-3 py-2 font-bold text-center">Needed</th>
                        <th className="px-3 py-2 font-bold text-center text-rose-600">Shortage</th>
                        <th className="px-3 py-2 font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeBomDetails.components.map((item, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="px-3 py-2 font-bold text-slate-800">{item.productName}</td>
                          <td className="px-3 py-2 text-center text-slate-500 font-bold">{item.stock}</td>
                          <td className="px-3 py-2 text-center text-slate-800 font-bold">{item.quantityRequired}</td>
                          <td className="px-3 py-2 text-center text-rose-600 font-black">{item.shortage}</td>
                          <td className="px-3 py-2 font-black text-[#774F6C] text-[10px] whitespace-nowrap">
                            {item.shortage > 0 ? (
                              item.procurementType === 'MTS' ? 'Auto PO' : 'Auto MO'
                            ) : (
                              <span className="text-emerald-600">Reserve</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {actionCandidate.action === 'START' && (
              <p className="text-sm font-semibold text-slate-600 mb-6 leading-relaxed">
                Starting production will generate the live Work Orders (e.g., Assembly, Quality Testing, Packaging) tracking actual shop-floor progression.
              </p>
            )}

            {actionCandidate.action === 'COMPLETE' && activeBomDetails && (
              <div className="flex flex-col gap-4 mb-6">
                {/* Stock update transition card */}
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-sm flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Finished Good</span>
                    <span className="text-sm font-black text-slate-800">{actionCandidate.order.productName}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Stock Update</span>
                    <div className="flex items-center gap-1.5 font-black text-sm text-emerald-700">
                      <span>{activeBomDetails.finishedProductCurrentStock}</span>
                      <span>→</span>
                      <span className="text-lg">{activeBomDetails.finishedProductNewStock}</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-1 rounded-sm">+{actionCandidate.order.quantity}</span>
                    </div>
                  </div>
                </div>

                {/* Materials consumption card */}
                <div className="border border-gray-100 rounded-sm p-4 bg-slate-50">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">BoM Material Consumption</h4>
                  <div className="space-y-2">
                    {activeBomDetails.components.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{item.productName}</span>
                        <span className="font-bold text-slate-900">{item.quantityRequired} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setActionCandidate(null)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-[#F9FAFB] border border-gray-200 hover:bg-gray-100 transition-colors">Abort</button>
              <button onClick={executeAction} className="px-4 py-2 text-sm font-bold text-white bg-[#774F6C] hover:bg-[#774F6C]/90 transition-colors">
                Execute Workflow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ORDER DETAILS & WORK ORDER TRACKER */}
      <div className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-150 ${viewOrderDetails ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setViewOrderDetails(null)} />
      <div className={`fixed top-0 right-0 bottom-0 w-full max-w-[500px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-150 ease-in-out border-l border-[#875A7B]/20 ${viewOrderDetails ? 'translate-x-0' : 'translate-x-full'}`}>
        {viewOrderDetails && (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-[#F9FAFB]">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Production Workflow</span>
                <h2 className="text-2xl font-black text-slate-900">{viewOrderDetails.id}</h2>
              </div>
              <button onClick={() => setViewOrderDetails(null)} className="p-2 rounded-sm hover:bg-white border border-transparent hover:border-gray-200 text-slate-500 transition-all shadow-sm">
                <span className="text-xl font-bold leading-none px-1">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white space-y-6">
              <div className="flex justify-between items-center bg-[#F9FAFB] p-4 border border-gray-100">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Finished Good</span>
                  <span className="font-black text-slate-900">{viewOrderDetails.productName} (x{viewOrderDetails.quantity})</span>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</span>
                  <StatusBadge status={viewOrderDetails.status === 'DONE' ? 'success' : viewOrderDetails.status === 'CANCELLED' ? 'critical' : viewOrderDetails.status === 'IN_PROGRESS' ? 'warning' : viewOrderDetails.status === 'CONFIRMED' ? 'info' : 'default'} label={viewOrderDetails.status} />
                </div>
              </div>

              {viewOrderDetails.workOrders.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                    <LayoutList className="w-4 h-4 text-[#774F6C]" /> Work Orders
                  </h4>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {viewOrderDetails.workOrders.map((wo, i) => (
                      <div key={wo.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${wo.status === 'DONE' ? 'bg-emerald-500 text-white' : wo.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
                          {wo.status === 'DONE' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border ${wo.status === 'IN_PROGRESS' ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-white'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-slate-900 text-sm">{wo.operation}</h4>
                            {wo.status === 'IN_PROGRESS' && (
                              <button onClick={() => executeWOAction(viewOrderDetails.id, wo.id)} className="text-[10px] uppercase tracking-widest font-bold text-amber-600 hover:text-amber-700 bg-amber-100 px-2 py-1 rounded-sm">Finish Step</button>
                            )}
                          </div>
                          <span className={`text-xs font-semibold ${wo.status === 'DONE' ? 'text-emerald-600' : wo.status === 'IN_PROGRESS' ? 'text-amber-600' : 'text-slate-400'}`}>
                            {wo.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </div>
    </ProtectedRoute>
  );
}
