import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSalesOrders,
  createSalesOrder,
} from "@/services/sales.service";
import type { SalesOrder } from "@/types";

export function useSalesOrders() {
  return useQuery({
    queryKey: ["salesOrders"],
    queryFn: getSalesOrders,
  });
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      customer_name: string;
      product_id: string;
      quantity: number;
      status: string;
    }) => createSalesOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}