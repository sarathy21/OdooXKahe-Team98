"use client";

import * as React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Search, Plus, ShoppingCart, TrendingUp, AlertTriangle, Play, Ban, CheckCircle, Package, Trash2 } from "lucide-react";
import { SalesEngine, SalesOrder, OrderStatus, SalesOrderInput } from "@/lib/erp/sales-engine";
import { ProductService, Product } from "@/lib/erp/product-service";

export default function SalesOrdersPage() {
  const [loading, setLoading] = React.useState(true);
  const [orders, setOrders] = React.useState<SalesOrder[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Modals / Drawers
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = React.useState(false);
  const [actionCandidate, setActionCandidate] = React.useState<{ order: SalesOrder, action: 'CONFIRM'|'DELIVER'|'CANCEL' } | null>(null);
  const [viewOrderDetails, setViewOrderDetails] = React.useState<SalesOrder | null>(null);

  // Create Form State
  const [newCustomer, setNewCustomer] = React.useState('');
  const [newLines, setNewLines] = React.useState<{ productId: string, quantity: number }[]>([]);

  React.useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setOrders(SalesEngine.getOrders());
      setProducts(ProductService.getProducts().filter(p => p.isActive));
      setLoading(false);
    }, 400); // simulate latency
  };

  // KPIs
  const totalOrders = orders.length;
  const pendingDeliveries = orders.filter(o => o.status === 'CONFIRMED' || o.status === 'PARTIALLY DELIVERED').length;
  const revenue = orders.filter(o => o.status === 'DELIVERED').reduce((sum, o) => sum + o.totalAmount, 0);
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;

  const filteredOrders = React.useMemo(() => {
    if (!searchTerm) return orders;
    return orders.filter(o => 
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, orders]);

  // Check shortages in the active candidate order
  const shortages = React.useMemo(() => {
    if (!actionCandidate || actionCandidate.action !== 'CONFIRM') return [];
    
    const currentProducts = ProductService.getProducts();
    
    return actionCandidate.order.lines.map(line => {
      const p = currentProducts.find(prod => prod.id === line.productId);
      const stock = p ? p.freeQty : 0;
      const shortage = Math.max(0, line.quantity - stock);
      return {
        productName: line.productName,
        stock,
        quantity: line.quantity,
        shortage,
        procurementType: p ? p.procurementType : 'MTO'
      };
    }).filter(item => item.shortage > 0);
  }, [actionCandidate, products]);

  // Form Handlers
  const handleAddLine = () => {
    if (products.length > 0) {
      setNewLines([...newLines, { productId: products[0].id, quantity: 1 }]);
    }
  };

  const handleUpdateLine = (index: number, field: 'productId' | 'quantity', value: any) => {
    const updated = [...newLines];
    updated[index] = { ...updated[index], [field]: value };
    setNewLines(updated);
  };

  const handleRemoveLine = (index: number) => {
    setNewLines(newLines.filter((_, i) => i !== index));
  };

  const handleSaveDraft = () => {
    if (!newCustomer || newLines.length === 0) return alert("Customer and at least 1 product required.");
    
    const lines = newLines.map(line => {
      const p = products.find(prod => prod.id === line.productId)!;
      return {
        productId: p.id,
        productName: p.name,
        quantity: line.quantity,
        unitPrice: p.salesPrice,
        total: p.salesPrice * line.quantity
      };
    });

    SalesEngine.createDraftOrder({ customerName: newCustomer, lines });
    refreshData();
    setIsCreateDrawerOpen(false);
    setNewCustomer('');
    setNewLines([]);
  };

  const executeAction = () => {
    if (!actionCandidate) return;
    try {
      if (actionCandidate.action === 'CONFIRM') SalesEngine.confirmOrder(actionCandidate.order.id);
      if (actionCandidate.action === 'DELIVER') SalesEngine.deliverOrder(actionCandidate.order.id);
      if (actionCandidate.action === 'CANCEL') SalesEngine.cancelOrder(actionCandidate.order.id);
      refreshData();
      setActionCandidate(null);
    } catch (e: any) {
      alert(e.message);
      setActionCandidate(null);
    }
  };

  const columns = [
    { header: "Order ID", accessorKey: "id", width: "w-24" },
    { header: "Customer Name", accessorKey: "customerName" },
    { 
      header: "Total Amount (₹)", 
      accessorKey: "totalAmount", 
      align: "right" as const,
      cell: (r: any) => `₹${r.totalAmount.toLocaleString('en-IN')}`
    },
    { 
      header: "Status", 
      accessorKey: "status", 
      align: "center" as const, 
      cell: (r: any) => {
        let variant = 'default';
        if (r.status === 'DELIVERED') variant = 'success';
        if (r.status === 'CONFIRMED') variant = 'info';
        if (r.status === 'PARTIALLY DELIVERED') variant = 'warning';
        if (r.status === 'CANCELLED') variant = 'critical';
        // DRAFT is default (gray)
        return <StatusBadge status={variant as any} label={r.status.toUpperCase()} />;
      }
    },
    { header: "Created At", accessorKey: "createdAt", cell: (r: any) => new Date(r.createdAt).toLocaleDateString() },
    {
      header: "Action",
      accessorKey: "action",
      align: "center" as const,
      cell: (r: SalesOrder) => (
        <div className="flex items-center justify-center gap-2">
          {r.status === 'DRAFT' && (
            <button onClick={(e) => { e.stopPropagation(); setActionCandidate({order: r, action: 'CONFIRM'})}} className="p-1.5 hover:bg-[#774F6C]/10 rounded-sm text-slate-400 hover:text-[#774F6C] transition-colors" title="Confirm Order">
              <Play className="w-4 h-4" />
            </button>
          )}
          {r.status === 'CONFIRMED' && (
            <button onClick={(e) => { e.stopPropagation(); setActionCandidate({order: r, action: 'DELIVER'})}} className="p-1.5 hover:bg-emerald-50 rounded-sm text-slate-400 hover:text-emerald-600 transition-colors" title="Mark Delivered">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {(r.status === 'DRAFT' || r.status === 'CONFIRMED') && (
            <button onClick={(e) => { e.stopPropagation(); setActionCandidate({order: r, action: 'CANCEL'})}} className="p-1.5 hover:bg-rose-50 rounded-sm text-slate-400 hover:text-rose-600 transition-colors" title="Cancel Order">
              <Ban className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const calculateDraftTotal = () => {
    return newLines.reduce((sum, line) => {
      const p = products.find(prod => prod.id === line.productId);
      return sum + (p ? p.salesPrice * line.quantity : 0);
    }, 0);
  };

  return (
    <ProtectedRoute module="SALES">
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 relative min-h-screen pb-12">
      <PageHeader 
        title="Sales Orders" 
        breadcrumbs={["Dashboard", "Sales Orders"]}
        actions={
          <button onClick={() => setIsCreateDrawerOpen(true)} className="bg-[#774F6C] text-white px-4 py-2 font-bold text-sm tracking-widest uppercase hover:bg-[#774F6C]/90 transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Order
          </button>
        }
      />

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 p-4 flex flex-col shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] border-l-[4px] border-l-[#774F6C]">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Orders</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{totalOrders}</span>
            <ShoppingCart className="w-5 h-5 text-[#774F6C]/40" />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 flex flex-col shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] border-l-[4px] border-l-[#774F6C]">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Pending Deliveries</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{pendingDeliveries}</span>
            <Package className="w-5 h-5 text-[#774F6C]/40" />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 flex flex-col shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] border-l-[4px] border-l-[#774F6C]">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Delivered Revenue</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">₹{revenue.toLocaleString('en-IN')}</span>
            <TrendingUp className="w-5 h-5 text-[#774F6C]/40" />
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4 flex flex-col shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] border-l-[4px] border-l-rose-500">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Cancelled</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{cancelledOrders}</span>
            <Ban className="w-5 h-5 text-rose-500/40" />
          </div>
        </div>
      </div>

      {/* SEARCH + SUMMARY BAR */}
      <div className="bg-white p-4 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
        <div className="relative group w-full md:w-[400px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 group-focus-within:text-[#774F6C] transition-colors" />
          <input 
            type="text" 
            placeholder="Search orders by ID or Customer..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 bg-[#F9FAFB] border border-gray-100 focus:border-[#774F6C]/40 focus:bg-white focus:ring-2 focus:ring-[#774F6C]/5 rounded-none text-sm w-full transition-all outline-none font-semibold text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className="bg-white border border-gray-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] animate-in fade-in duration-300">
        {loading ? <TableSkeleton columns={6} rows={6} /> : <DataTable data={filteredOrders} columns={columns} onRowClick={setViewOrderDetails} />}
      </div>

      {/* CREATE ORDER DRAWER */}
      <div className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-150 ${isCreateDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCreateDrawerOpen(false)} />
      <div className={`fixed top-0 right-0 bottom-0 w-full max-w-[600px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-150 ease-in-out border-l border-[#875A7B]/20 ${isCreateDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-[#F9FAFB]">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900">Create Sales Order</h2>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Draft order (No stock impact until confirmed)</span>
          </div>
          <button onClick={() => setIsCreateDrawerOpen(false)} className="p-2 rounded-sm hover:bg-white border border-transparent hover:border-gray-200 text-slate-500 transition-all shadow-sm">
            <span className="text-xl font-bold leading-none px-1">×</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white space-y-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Customer Name</label>
            <input type="text" value={newCustomer} onChange={e => setNewCustomer(e.target.value)} className="px-3 py-2 bg-[#F9FAFB] border border-gray-200 focus:border-[#774F6C]/40 focus:ring-2 focus:ring-[#774F6C]/5 outline-none text-sm font-semibold text-slate-900 transition-all" />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Line Items</label>
              <button onClick={handleAddLine} className="text-[10px] font-bold uppercase tracking-widest text-[#774F6C] hover:text-[#774F6C]/80">+ Add Product</button>
            </div>
            
            <div className="space-y-3">
              {newLines.map((line, idx) => (
                <div key={idx} className="flex gap-3 items-end bg-[#F9FAFB] p-3 border border-gray-100">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Product</span>
                    <select value={line.productId} onChange={e => handleUpdateLine(idx, 'productId', e.target.value)} className="px-2 py-1.5 bg-white border border-gray-200 outline-none text-xs font-semibold text-slate-900 w-full">
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (Free: {p.freeQty})</option>)}
                    </select>
                  </div>
                  <div className="w-20 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Qty</span>
                    <input type="number" min="1" value={line.quantity} onChange={e => handleUpdateLine(idx, 'quantity', Number(e.target.value))} className="px-2 py-1.5 bg-white border border-gray-200 outline-none text-xs font-semibold text-slate-900 w-full text-right" />
                  </div>
                  <button onClick={() => handleRemoveLine(idx)} className="p-2 text-rose-500 hover:bg-rose-50 border border-transparent transition-colors mb-0.5" title="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {newLines.length === 0 && <div className="text-xs text-slate-400 font-semibold p-4 text-center border border-dashed border-gray-200">No products added.</div>}
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-100 bg-[#F9FAFB] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Draft Total</span>
            <span className="text-xl font-black text-[#774F6C]">₹{calculateDraftTotal().toLocaleString('en-IN')}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setIsCreateDrawerOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSaveDraft} className="px-4 py-2 text-sm font-bold text-white bg-[#774F6C] hover:bg-[#774F6C]/90 transition-all">Save as Draft</button>
          </div>
        </div>
      </div>

      {/* CONFIRM ACTION DIALOG */}
      {actionCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-200 p-4">
          <div className="bg-white max-w-md w-full shadow-2xl border-t-[6px] border-[#774F6C] p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-900 mb-2">
              {actionCandidate.action === 'CONFIRM' ? 'Confirm Order?' : 
               actionCandidate.action === 'DELIVER' ? 'Deliver Order?' : 'Cancel Order?'}
            </h2>
            
            {actionCandidate.action === 'CONFIRM' ? (
              shortages.length > 0 ? (
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-rose-900 leading-tight">Stock Shortage Detected</h4>
                      <p className="text-[10px] text-rose-700 font-semibold mt-1 leading-relaxed">
                        Order confirmation will auto-trigger procurement actions to fulfill inventory deficits.
                      </p>
                    </div>
                  </div>

                  <div className="border border-gray-100 rounded-sm overflow-hidden bg-slate-50">
                    <table className="w-full text-left text-xs font-semibold">
                      <thead className="bg-slate-100 text-slate-500 uppercase tracking-widest text-[9px] border-b border-gray-100">
                        <tr>
                          <th className="px-3 py-2 font-bold">Product</th>
                          <th className="px-3 py-2 font-bold text-center">Stock</th>
                          <th className="px-3 py-2 font-bold text-center">Order</th>
                          <th className="px-3 py-2 font-bold text-center text-rose-600">Shortage</th>
                          <th className="px-3 py-2 font-bold">Auto Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {shortages.map((item, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="px-3 py-2 font-bold text-slate-800">{item.productName}</td>
                            <td className="px-3 py-2 text-center text-slate-500 font-bold">{item.stock}</td>
                            <td className="px-3 py-2 text-center text-slate-800 font-bold">{item.quantity}</td>
                            <td className="px-3 py-2 text-center text-rose-600 font-black">{item.shortage}</td>
                            <td className="px-3 py-2 font-black text-[#774F6C] text-[10px] whitespace-nowrap">
                              {item.procurementType === 'MTS' ? 'Purchase Order' : 'Mfg Order'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-600 mb-6 leading-relaxed">
                  Confirming this order will atomically reserve inventory stock. Stock levels are sufficient to fulfill this order immediately.
                </p>
              )
            ) : (
              <p className="text-sm font-semibold text-slate-600 mb-6 leading-relaxed">
                {actionCandidate.action === 'DELIVER' && "Delivering this order will physically dispatch stock from the warehouse ledger. This action cannot be reversed."}
                {actionCandidate.action === 'CANCEL' && "Cancelling this order will immediately release any reserved stock back into the Free Qty pool."}
              </p>
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

      {/* VIEW ORDER DETAILS DRAWER */}
      <div className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-150 ${viewOrderDetails ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setViewOrderDetails(null)} />
      <div className={`fixed top-0 right-0 bottom-0 w-full max-w-[500px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-150 ease-in-out border-l border-[#875A7B]/20 ${viewOrderDetails ? 'translate-x-0' : 'translate-x-full'}`}>
        {viewOrderDetails && (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-[#F9FAFB]">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Order Details</span>
                <h2 className="text-2xl font-black text-slate-900">{viewOrderDetails.id}</h2>
              </div>
              <button onClick={() => setViewOrderDetails(null)} className="p-2 rounded-sm hover:bg-white border border-transparent hover:border-gray-200 text-slate-500 transition-all shadow-sm">
                <span className="text-xl font-bold leading-none px-1">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white space-y-6">
              <div className="flex justify-between items-center bg-[#F9FAFB] p-4 border border-gray-100">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Customer</span>
                  <span className="font-black text-slate-900">{viewOrderDetails.customerName}</span>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</span>
                  <StatusBadge status={viewOrderDetails.status === 'DELIVERED' ? 'success' : viewOrderDetails.status === 'CANCELLED' ? 'critical' : viewOrderDetails.status === 'CONFIRMED' ? 'info' : 'default'} label={viewOrderDetails.status} />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-gray-100 pb-2 mb-3">Line Items</h4>
                <div className="space-y-3">
                  {viewOrderDetails.lines.map((l, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{l.productName}</span>
                        <span className="text-xs text-slate-400 font-semibold">{l.quantity} x ₹{l.unitPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <span className="font-black text-slate-900">₹{l.total.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-xs font-black uppercase tracking-widest text-slate-900">Total Amount</span>
                <span className="text-2xl font-black text-[#774F6C]">₹{viewOrderDetails.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
    </ProtectedRoute>
  );
}
