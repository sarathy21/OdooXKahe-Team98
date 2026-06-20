import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBomByProduct,
  createBom,
  type BomItem,
} from "@/services/bom.service";

export function useBom(productId: string) {
  return useQuery({
    queryKey: ["bom", productId],
    queryFn: () => getBomByProduct(productId),
    enabled: !!productId,
  });
}

export function useCreateBom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { product_id: string; raw_material: string; quantity: number }) =>
      createBom(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bom", variables.product_id] });
    },
  });
}

export function useAllBom() {
  return useQuery({
    queryKey: ["bom"],
    queryFn: async (): Promise<BomItem[]> => {
      const { supabase } = await import("@/lib/supabase");
      const { data, error } = await supabase.from("bom").select("*");
      if (error) throw error;
      return data;
    },
  });
}