import { supabase } from "../lib/supabase";
import type { Product, SalesOrder, ManufacturingOrder } from "../types/index";

export interface DashboardKpis {
  totalProducts: number;
  lowStockCount: number;
  pendingSalesOrders: number;
  activeManufacturingOrders: number;
  totalStockValue: number;
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const [products, salesOrders, manufacturingOrders] = await Promise.all([
    supabase.from("products").select("stock_qty, cost_price, sales_price"),
    supabase
      .from("sales_orders")
      .select("id, status")
      .eq("status", "confirmed"),
    supabase
      .from("manufacturing_orders")
      .select("id, status")
      .in("status", ["draft", "in_progress"]),
  ]);

  if (products.error) throw products.error;
  if (salesOrders.error) throw salesOrders.error;
  if (manufacturingOrders.error) throw manufacturingOrders.error;

  const totalProducts = products.data.length;
  const lowStockCount = products.data.filter((p) => p.stock_qty < 10).length;
  const pendingSalesOrders = salesOrders.data.length;
  const activeManufacturingOrders = manufacturingOrders.data.length;

  const totalStockValue = products.data.reduce(
    (sum, p) => sum + p.stock_qty * p.cost_price,
    0
  );

  return {
    totalProducts,
    lowStockCount,
    pendingSalesOrders,
    activeManufacturingOrders,
    totalStockValue,
  };
}

export async function getLowStockProducts(
  threshold = 10
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .lt("stock_qty", threshold)
    .order("stock_qty", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getRecentSalesOrders(
  limit = 5
): Promise<SalesOrder[]> {
  const { data, error } = await supabase
    .from("sales_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getActiveManufacturingOrders(): Promise<
  ManufacturingOrder[]
> {
  const { data, error } = await supabase
    .from("manufacturing_orders")
    .select("*")
    .in("status", ["draft", "in_progress"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}