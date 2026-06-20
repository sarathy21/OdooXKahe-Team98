import { supabase } from "../lib/supabase";

export async function checkStock(
  productId: string,
  quantity: number
): Promise<{ sufficient: boolean; shortage: number }> {
  const { data, error } = await supabase
    .from("products")
    .select("stock_qty")
    .eq("id", productId)
    .single();

  if (error) throw error;

  const shortage = Math.max(0, quantity - data.stock_qty);

  return {
    sufficient: shortage === 0,
    shortage,
  };
}

export async function triggerProcurement(
  productId: string,
  shortage: number,
  procurementType: "purchase" | "manufacturing"
): Promise<void> {
  if (shortage <= 0) return;

  // Purchase Order Creation
  if (procurementType === "purchase") {
    const { error } = await supabase.from("purchase_orders").insert({
      product_id: productId,
      required_qty: shortage,
      supplier: "Auto Supplier",
      status: "pending",
    });

    if (error) throw error;
  }

  // Manufacturing Order Creation
  if (procurementType === "manufacturing") {
    const { error } = await supabase.from("manufacturing_orders").insert({
      product_id: productId,
      required_qty: shortage,
      status: "pending",
    });

    if (error) throw error;
  }
}