import { useQuery } from "@tanstack/react-query";
import {
  getDashboardKpis,
  getLowStockProducts,
  getRecentSalesOrders,
  getActiveManufacturingOrders,
  type DashboardKpis,
} from "@/services/dashboard.service";
import type { Product, SalesOrder, ManufacturingOrder } from "@/types";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardKpis,
  });
}

export function useLowStockProducts(threshold = 10) {
  return useQuery({
    queryKey: ["lowStockProducts", threshold],
    queryFn: () => getLowStockProducts(threshold),
  });
}

export function useRecentSalesOrders(limit = 5) {
  return useQuery({
    queryKey: ["recentSalesOrders", limit],
    queryFn: () => getRecentSalesOrders(limit),
  });
}

export function useActiveManufacturingOrders() {
  return useQuery({
    queryKey: ["activeManufacturingOrders"],
    queryFn: getActiveManufacturingOrders,
  });
}