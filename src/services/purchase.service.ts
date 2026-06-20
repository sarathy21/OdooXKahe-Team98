import { supabase } from "../lib/supabase";
import type { PurchaseOrder } from "../types/index";

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("*");

  if (error) throw error;
  return data;
}

export async function createPurchaseOrder(
  data: Omit<PurchaseOrder, "id" | "created_at">
): Promise<PurchaseOrder> {
  const { data: order, error } = await supabase
    .from("purchase_orders")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return order;
}
export async function completePurchaseOrder(
  orderId: string
): Promise<void> {
  // STEP 1: Get purchase order
  const { data: order, error: orderError } = await supabase
    .from("purchase_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError) throw orderError;

  // STEP 2: Get current product stock
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("stock_qty")
    .eq("id", order.product_id)
    .single();

  if (productError) throw productError;

  // STEP 3: Calculate new stock
  const newStock = product.stock_qty + order.required_qty;

  // STEP 4: Update stock
  const { error: stockUpdateError } = await supabase
    .from("products")
    .update({
      stock_qty: newStock,
    })
    .eq("id", order.product_id);

  if (stockUpdateError) throw stockUpdateError;

  // STEP 5: Mark purchase order completed
  const { error: orderUpdateError } = await supabase
    .from("purchase_orders")
    .update({
      status: "completed",
    })
    .eq("id", orderId);

  if (orderUpdateError) throw orderUpdateError;
}