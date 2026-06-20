import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  completePurchaseOrder,
} from "@/services/purchase.service";
import type { PurchaseOrder } from "@/types";

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: getPurchaseOrders,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<PurchaseOrder, "id" | "created_at">) =>
      createPurchaseOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
  });
}

export function useCompletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => completePurchaseOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}