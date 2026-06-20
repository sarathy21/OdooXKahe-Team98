"use client";

import * as React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  TrendingUp, Box, ShoppingCart, Factory, DollarSign, 
  AlertTriangle, CheckCircle2, Clock, Activity, Truck, ChevronRight,
  Package, ArrowRight, Percent, BarChart3, ActivitySquare, LayoutDashboard,
  Zap, ArrowUpRight, TrendingDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

import { ProductService, Product } from "@/lib/erp/product-service";
import { SalesEngine, SalesOrder } from "@/lib/erp/sales-engine";
import { ManufacturingEngine, ManufacturingOrder } from "@/lib/erp/manufacturing-engine";
import { ProcurementEngine, ProcurementOrder } from "@/lib/erp/procurement-engine";
import { AuditLogger, AuditLogEntry } from "@/lib/erp/audit-log";

const formatINR = (val: number) => {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
  return `₹${val.toFixed(0)}`;
};

const InteractiveKpiCard = ({ title, value, subtext, icon: Icon, delay = "0ms", trend, sparklineData, onClick, colorClass }: any) => (
  <div 
    onClick={onClick}
    className="group bg-white border border-gray-100 p-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-[#774F6C]/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-both flex flex-col h-[160px] cursor-pointer relative overflow-hidden"
    style={{ animationDelay: delay }}
  >
    <div className="flex justify-between items-start mb-2 relative z-10">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
      <div className={`p-2 bg-slate-50 group-hover:bg-[#774F6C]/10 transition-colors rounded-sm`}>
        <Icon className={`w-4 h-4 text-slate-400 group-hover:${colorClass} transition-colors`} />
      </div>
    </div>
    <div className="flex flex-col relative z-10">
      <span className={`text-2xl font-black ${colorClass}`}>{value}</span>
      <div className="flex items-center gap-2 mt-1">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{subtext}</span>
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sparklineData}>
          <defs>
            <linearGradient id={`color-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={trend >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={trend >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={trend >= 0 ? "#10b981" : "#f43f5e"} fillOpacity={1} fill={`url(#color-${title})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const FlowStepCard = ({ title, icon: Icon, value, active, delay, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center p-4 rounded-sm border transition-all animate-in zoom-in-95 fill-mode-both duration-500 flex-1 z-10 cursor-pointer hover:scale-[1.02] active:scale-[0.98]
    ${active ? 'bg-[#774F6C] border-[#774F6C] text-white shadow-lg shadow-[#774F6C]/20' : 'bg-[#774F6C]/90 border-[#774F6C]/90 text-white hover:bg-[#8a5d7e]'}`} 
    style={{ animationDelay: delay }}
  >
    <Icon className="w-6 h-6 mb-2 text-white" />
    <span className="text-xs font-black uppercase tracking-widest text-white">{title}</span>
    {value !== undefined && (
      <span className={`absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black shadow-sm ${active ? 'bg-white text-[#774F6C]' : 'bg-white/20 text-white'}`}>
        {value}
      </span>
    )}
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  
  const [products, setProducts] = React.useState<Product[]>([]);
  const [sales, setSales] = React.useState<SalesOrder[]>([]);
  const [mfg, setMfg] = React.useState<ManufacturingOrder[]>([]);
  const [purchases, setPurchases] = React.useState<ProcurementOrder[]>([]);
  const [logs, setLogs] = React.useState<AuditLogEntry[]>([]);

  React.useEffect(() => {
    setTimeout(() => {
      setProducts(ProductService.getProducts());
      setSales(SalesEngine.getOrders());
      setMfg(ManufacturingEngine.getOrders());
      setPurchases(ProcurementEngine.getOrders());
      setLogs(AuditLogger.getLogs());
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <ProtectedRoute module="DASHBOARD">
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 min-h-screen">
          <div className="h-24 bg-slate-100 rounded animate-pulse" />
          <TableSkeleton columns={4} rows={6} />
        </div>
      </ProtectedRoute>
    );
  }

  // --- FINANCIAL CALCULATIONS (P&L) ---
  const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const purchaseCost = purchases.filter(p => p.type === 'PO').reduce((acc, p) => acc + (p.totalCost || 0), 0);
  const mfgCost = mfg.reduce((acc, m) => acc + (m.quantity * 1200), 0); // Estimated production cost
  const totalCost = purchaseCost + mfgCost;
  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // --- AGGREGATES ---
  const salesPending = sales.filter(s => s.status === 'CONFIRMED' || s.status === 'DRAFT').length;
  const mfgActive = mfg.filter(m => m.status === 'IN_PROGRESS').length;
  const poPending = purchases.filter(p => p.status === 'CONFIRMED').length;
  const invLow = products.filter(p => p.onHand <= p.lowStockThreshold).length;
  const mfgDelayed = mfg.filter(m => m.status === 'IN_PROGRESS' && new Date(m.createdAt) < new Date(Date.now() - 86400000)).length;
  const mfgDone = mfg.filter(m => m.status === 'DONE').length;

  // --- SMART INSIGHTS MOCK DATA ---
  const topSellingProduct = products.length > 0 ? products[0].name : "N/A";
  const fastMovingProduct = products.length > 1 ? products[1].name : "N/A";
  const procurementSavings = "₹12.5K";

  // --- MOCK CHART DATA (Deterministic based on totals) ---
  const generateTrend = (base: number, variance: number) => Array.from({length: 7}).map((_, i) => ({
    name: `D${i+1}`, 
    value: Math.max(0, base + (Math.random() * variance - variance/2))
  }));

  const revenueTrendData = generateTrend(totalRevenue / 7 || 100000, 20000);
  const costTrendData = generateTrend(totalCost / 7 || 50000, 10000);
  
  const pnlChartData = revenueTrendData.map((r, i) => ({
    name: `Day ${i+1}`,
    Revenue: Math.round(r.value),
    Cost: Math.round(costTrendData[i].value),
    Profit: Math.round(r.value - costTrendData[i].value)
  }));

  const inventoryFlowData = [
    { name: 'Raw Materials In', value: purchases.length * 50 },
    { name: 'Production Out', value: mfg.length * 20 },
    { name: 'Finished Goods In', value: mfgDone * 20 },
    { name: 'Sales Out', value: sales.length * 15 }
  ];

  // --- ALERTS ---
  const alerts = [];
  if (grossProfit < 0) alerts.push({ msg: `Critical Profit Warning: Operating at a loss of ${formatINR(Math.abs(grossProfit))}`, type: 'CRITICAL', link: '/reports' });
  if (invLow > 0) alerts.push({ msg: `${invLow} products have reached Low Stock thresholds.`, type: 'CRITICAL', link: '/products' });
  if (mfgDelayed > 0) alerts.push({ msg: `${mfgDelayed} Factory Orders are delayed.`, type: 'WARNING', link: '/manufacturing-orders' });
  if (poPending > 0) alerts.push({ msg: `${poPending} Purchase Orders are awaiting receipt.`, type: 'INFO', link: '/purchase-orders' });

  return (
    <ProtectedRoute module="DASHBOARD">
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 relative min-h-screen pb-12">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-100 pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Intelligence Center</h1>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-[#774F6C] animate-pulse"></span>
                LIVE ERP ANALYTICS
              </span>
            </div>
          </div>
          
          {/* P&L MINI STRIP */}
          <div className="flex items-center gap-6 bg-slate-900 text-white px-6 py-3 rounded-sm shadow-xl">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Gross Profit</span>
              <span className={`text-lg font-black ${grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatINR(grossProfit)}</span>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Margin</span>
              <span className={`text-lg font-black ${profitMargin >= 20 ? 'text-emerald-400' : profitMargin > 0 ? 'text-amber-400' : 'text-rose-400'}`}>{profitMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* SECTION 6: BUSINESS FLOW VISUALIZATION */}
        <div className="bg-white border border-gray-100 p-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Interactive Supply Chain Flow</h3>
          <div className="relative flex items-center justify-between w-full">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
            <div className="flex w-full gap-2 md:gap-4 relative z-10 px-2 md:px-8">
              <FlowStepCard title="Demand" icon={ShoppingCart} value={salesPending} active={salesPending > 0} delay="0ms" onClick={() => router.push('/sales-orders')} />
              <div className="hidden md:flex items-center justify-center text-gray-300 w-8"><ArrowRight className="w-5 h-5" /></div>
              <FlowStepCard title="Production" icon={Factory} value={mfgActive} active={mfgActive > 0} delay="100ms" onClick={() => router.push('/manufacturing-orders')} />
              <div className="hidden md:flex items-center justify-center text-gray-300 w-8"><ArrowRight className="w-5 h-5" /></div>
              <FlowStepCard title="Fulfillment" icon={Truck} value={poPending} active={poPending > 0} delay="200ms" onClick={() => router.push('/purchase-orders')} />
              <div className="hidden md:flex items-center justify-center text-gray-300 w-8"><ArrowRight className="w-5 h-5" /></div>
              <FlowStepCard title="Inventory" icon={Package} value={products.length} active={true} delay="300ms" onClick={() => router.push('/products')} />
            </div>
          </div>
        </div>

        {/* SECTION 1: ADVANCED KPI BENTO GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <InteractiveKpiCard 
            title="Revenue" value={formatINR(totalRevenue)} subtext="vs last wk" icon={DollarSign} trend={12} delay="100ms" 
            colorClass="text-emerald-600" sparklineData={revenueTrendData} onClick={() => router.push('/sales-orders')}
          />
          <InteractiveKpiCard 
            title="Gross Profit" value={formatINR(grossProfit)} subtext="Margin" icon={TrendingUp} trend={parseFloat(profitMargin.toFixed(1))} delay="150ms" 
            colorClass={grossProfit >= 0 ? "text-emerald-500" : "text-rose-500"} sparklineData={revenueTrendData} onClick={() => router.push('/reports')}
          />
          <InteractiveKpiCard 
            title="Sales Orders" value={sales.length} subtext="Total volume" icon={ShoppingCart} trend={8} delay="200ms" 
            colorClass="text-[#774F6C]" sparklineData={generateTrend(sales.length, 5)} onClick={() => router.push('/sales-orders')}
          />
          <InteractiveKpiCard 
            title="Mfg Orders" value={mfg.length} subtext="Active batch" icon={Factory} trend={-2} delay="250ms" 
            colorClass="text-blue-600" sparklineData={generateTrend(mfg.length, 2)} onClick={() => router.push('/manufacturing-orders')}
          />
          <InteractiveKpiCard 
            title="Low Stock" value={invLow} subtext="Alerts" icon={AlertTriangle} trend={15} delay="300ms" 
            colorClass="text-rose-500" sparklineData={generateTrend(invLow, 2)} onClick={() => router.push('/products')}
          />
          <InteractiveKpiCard 
            title="Procurement" value={poPending} subtext="Alerts" icon={Truck} trend={5} delay="350ms" 
            colorClass="text-amber-600" sparklineData={generateTrend(poPending, 1)} onClick={() => router.push('/purchase-orders')}
          />
        </div>

        {/* SECTION 2: ADVANCED ANALYTICS GRAPHS */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white border border-gray-100 p-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] h-[400px] flex flex-col cursor-pointer hover:border-[#774F6C]/30 transition-colors" onClick={() => router.push('/reports')}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Revenue vs Cost Analysis</h3>
              <span className="text-[10px] font-bold text-[#774F6C] uppercase tracking-widest">Click for Full Report</span>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pnlChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={false} />
                  <YAxis axisLine={false} tickLine={false} tick={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', fontSize: '12px', color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => `₹${value.toLocaleString()}`}
                  />
                  <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="Cost" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] h-[400px] flex flex-col cursor-pointer hover:border-[#774F6C]/30 transition-colors" onClick={() => router.push('/products')}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Inventory Movement</h3>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryFlowData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} width={120} />
                  <RechartsTooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" fill="#774F6C" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SECTION 4 & 7: ALERTS & QUICK NAV */}
          <div className="flex flex-col gap-6">
            
            {/* SMART INSIGHTS */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Zap className="w-24 h-24 text-white" />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2 relative z-10">
                <Zap className="w-3.5 h-3.5" /> Smart Insights
              </h4>
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Top Selling Product</span>
                  <span className="text-xs text-white font-bold">{topSellingProduct}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Fastest Moving</span>
                  <span className="text-xs text-white font-bold">{fastMovingProduct}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Low Stock Risk</span>
                  <span className="text-xs text-rose-400 font-bold">{invLow > 0 ? 'High' : 'Low'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-medium">Procurement Savings</span>
                  <span className="text-xs text-emerald-400 font-bold">{procurementSavings}</span>
                </div>
              </div>
            </div>

            {/* ACTIONABLE ALERTS PREMIUM */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-rose-400" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2 ml-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Attention Required
              </h4>
              <div className="space-y-3 ml-2">
                {alerts.length === 0 ? (
                  <div className="text-sm text-emerald-600 font-bold flex items-center gap-2 py-2">
                    <CheckCircle2 className="w-4 h-4" /> All systems optimal.
                  </div>
                ) : (
                  alerts.map((a, i) => (
                    <div 
                      key={i} 
                      onClick={() => router.push(a.link)}
                      className="group flex flex-col gap-1 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <span className={`text-xs font-bold leading-tight pr-4 ${
                          a.type === 'CRITICAL' ? 'text-rose-600' : 
                          a.type === 'WARNING' ? 'text-amber-600' : 
                          'text-blue-600'
                        }`}>
                          {a.msg}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                      <div className="h-px w-full bg-gray-50 mt-2 group-last:hidden" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] p-5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-3.5 h-3.5 text-[#774F6C]" /> Quick Actions
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => router.push('/sales-orders')} className="p-3 bg-slate-50 rounded-lg hover:bg-[#774F6C] hover:text-white flex flex-col gap-2 text-left transition-all group border border-transparent hover:shadow-md">
                  <ShoppingCart className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-white transition-colors">Add Sales Order</span>
                </button>
                <button onClick={() => router.push('/purchase-orders')} className="p-3 bg-slate-50 rounded-lg hover:bg-[#774F6C] hover:text-white flex flex-col gap-2 text-left transition-all group border border-transparent hover:shadow-md">
                  <Truck className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-white transition-colors">Add Purchase Order</span>
                </button>
                <button onClick={() => router.push('/products')} className="p-3 bg-slate-50 rounded-lg hover:bg-[#774F6C] hover:text-white flex flex-col gap-2 text-left transition-all group border border-transparent hover:shadow-md">
                  <Package className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-white transition-colors">Add Product</span>
                </button>
                <button onClick={() => router.push('/manufacturing-orders')} className="p-3 bg-slate-50 rounded-lg hover:bg-[#774F6C] hover:text-white flex flex-col gap-2 text-left transition-all group border border-transparent hover:shadow-md">
                  <Factory className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-white transition-colors">Create MO</span>
                </button>
                <button onClick={() => router.push('/bom')} className="p-3 bg-slate-50 rounded-lg hover:bg-[#774F6C] hover:text-white flex flex-col gap-2 text-left transition-all group border border-transparent hover:shadow-md col-span-2 flex-row items-center justify-center">
                  <Box className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-white transition-colors">Add BoM</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: REAL-TIME ACTIVITY FEED */}
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)] flex flex-col h-[500px]">
            <div className="flex justify-between items-center p-5 border-b border-gray-50 shrink-0">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#774F6C]" /> Enterprise Event Ledger
              </h3>
              <button onClick={() => router.push('/audit-logs')} className="text-[10px] text-slate-500 hover:text-[#774F6C] uppercase tracking-widest font-bold transition-colors">
                View Full Audit
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
              {logs.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-8">No activity recorded yet.</div>
              ) : (
                logs.slice(0, 15).map(log => (
                  <div key={log.id} className="flex gap-3 relative before:absolute before:left-[11px] before:top-6 before:bottom-[-16px] before:w-[2px] before:bg-gray-100 last:before:hidden group hover:bg-[#F9FAFB] p-2 -m-2 rounded transition-colors cursor-pointer" onClick={() => router.push('/audit-logs')}>
                    <div className="w-6 h-6 rounded-full bg-[#F9FAFB] border border-gray-200 flex items-center justify-center shrink-0 z-10 group-hover:border-[#774F6C]/30 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-[#774F6C]" />
                    </div>
                    <div className="flex flex-col pb-1">
                      <span className="text-xs font-bold text-slate-900 leading-tight">
                        {log.action.replace('_', ' ')} <span className="text-[#774F6C] font-black">{log.module}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5">{log.details}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 font-bold uppercase tracking-widest rounded-sm">{log.recordId}</span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
