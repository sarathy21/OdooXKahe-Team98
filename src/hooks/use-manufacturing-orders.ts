import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getManufacturingOrders,
  createManufacturingOrder,
  completeManufacturingOrder,
} from "@/services/manufacturing.service";
import type { ManufacturingOrder } from "@/types";

export function useManufacturingOrders() {
  return useQuery({
    queryKey: ["manufacturingOrders"],
    queryFn: getManufacturingOrders,
  });
}

export function useCreateManufacturingOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<ManufacturingOrder, "id" | "created_at">) =>
      createManufacturingOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manufacturingOrders"] });
    },
  });
}

export function useCompleteManufacturingOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => completeManufacturingOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manufacturingOrders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}