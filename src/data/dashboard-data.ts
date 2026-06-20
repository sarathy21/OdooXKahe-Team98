import { Package, ShoppingCart, CheckCircle2, Factory, Box } from "lucide-react";

export const salesTrendData = [
  { name: 'Jan', sales: 2400, target: 2000 }, { name: 'Feb', sales: 3398, target: 2500 },
  { name: 'Mar', sales: 5800, target: 4000 }, { name: 'Apr', sales: 3908, target: 4500 },
  { name: 'May', sales: 4800, target: 4000 }, { name: 'Jun', sales: 3800, target: 4500 },
  { name: 'Jul', sales: 6300, target: 5000 }, { name: 'Aug', sales: 5200, target: 6000 },
  { name: 'Sep', sales: 7100, target: 6500 }, { name: 'Oct', sales: 8420, target: 7000 },
];

export const revenueExpenseData = [
  { name: 'Jan', revenue: 45000, expense: 28000 }, { name: 'Feb', revenue: 52000, expense: 32000 },
  { name: 'Mar', revenue: 61000, expense: 35000 }, { name: 'Apr', revenue: 75000, expense: 41000 },
  { name: 'May', revenue: 68000, expense: 39000 }, { name: 'Jun', revenue: 82000, expense: 45000 },
];

export const inventoryDistribution = [
  { name: 'Raw Materials', value: 45 }, { name: 'Finished Goods', value: 30 },
  { name: 'Components', value: 15 }, { name: 'Packaging', value: 10 },
];

export const orderStatusData = [
  { name: 'Delivered', value: 45 }, { name: 'In Transit', value: 25 },
  { name: 'Processing', value: 20 }, { name: 'Draft', value: 10 },
];

export const customerGrowthData = [
  { name: 'W1', users: 120 }, { name: 'W2', users: 150 }, { name: 'W3', users: 180 },
  { name: 'W4', users: 240 }, { name: 'W5', users: 290 }, { name: 'W6', users: 380 },
];

export const mfgEfficiencyData = [
  { name: 'Mon', efficiency: 85 }, { name: 'Tue', efficiency: 88 }, { name: 'Wed', efficiency: 92 },
  { name: 'Thu', efficiency: 90 }, { name: 'Fri', efficiency: 95 }, { name: 'Sat', efficiency: 80 },
];

export const PIE_COLORS = ['#774F6C', '#22C55E', '#F59E0B', '#3B82F6'];

export const sparkData = (base: number) => Array.from({length: 10}, () => ({ v: base + Math.random() * 20 }));

export const salesOrdersData = [
  { id: 'SO-2024-001', customer: 'Acme Corp', amount: '$1,250', status: 'Delivered', time: '2h ago' },
  { id: 'SO-2024-002', customer: 'Global Tech', amount: '$850', status: 'Pending', time: '4h ago' },
  { id: 'SO-2024-003', customer: 'Stark Ind.', amount: '$3,440', status: 'Delivered', time: '5h ago' },
  { id: 'SO-2024-004', customer: 'Wayne Ent.', amount: '$900', status: 'Cancelled', time: '1d ago' },
];

export const purchaseOrdersData = [
  { id: 'PO-9012', supplier: 'SteelWorks Inc', amount: '$4,200', status: 'Approved', time: '1h ago' },
  { id: 'PO-9013', supplier: 'Lumber Co', amount: '$1,150', status: 'Waiting', time: '3h ago' },
  { id: 'PO-9014', supplier: 'Pack&Ship', amount: '$800', status: 'Approved', time: '6h ago' },
  { id: 'PO-9015', supplier: 'TechParts', amount: '$5,600', status: 'Rejected', time: '2d ago' },
];

export const mfgOrdersData = [
  { id: 'MO-1001', product: 'Acoustic Screen', qty: 20, progress: 85 },
  { id: 'MO-1002', product: 'Corner Desk', qty: 5, progress: 40 },
  { id: 'MO-1003', product: 'Conference Table', qty: 2, progress: 100 },
  { id: 'MO-1004', product: 'Ergo Chair', qty: 50, progress: 10 },
];

export const topProductsData = [
  { name: 'Ergo Chair Pro', sold: 450, total: 500 },
  { name: 'Acoustic Screen', sold: 320, total: 400 },
  { name: 'LED Desk Lamp', sold: 280, total: 300 },
  { name: 'Monitor Arm', sold: 210, total: 250 },
];

export const activitiesData = [
  { title: 'Product Added', desc: 'Ergo Chair added to catalog', time: '10 min ago', icon: Package, color: 'text-[#774F6C]', bg: 'bg-[#774F6C]/10' },
  { title: 'Order Created', desc: 'SO-2024-005 generated', time: '1 hr ago', icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { title: 'Purchase Approved', desc: 'PO-9012 approved by Admin', time: '2 hrs ago', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  { title: 'Manufacturing Started', desc: 'MO-1005 assembly started', time: '3 hrs ago', icon: Factory, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { title: 'Stock Updated', desc: 'Raw materials received', time: '5 hrs ago', icon: Box, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
];

export const lowStockData = [
  { name: 'Aluminum Frame', current: 5, min: 20, status: 'Low Stock' },
  { name: 'Screws (M4)', current: 0, min: 1000, status: 'Out of Stock' },
  { name: 'Fabric Roll (Blue)', current: 2, min: 10, status: 'Low Stock' },
  { name: 'Gas Lift Cylinder', current: 45, min: 50, status: 'Healthy' },
];
