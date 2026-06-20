import { supabase } from "../lib/supabase";
import type { ManufacturingOrder } from "../types/index";

export async function getManufacturingOrders(): Promise<ManufacturingOrder[]> {
  const { data, error } = await supabase
    .from("manufacturing_orders")
    .select("*");

  if (error) throw error;
  return data;
}

export async function createManufacturingOrder(
  data: Omit<ManufacturingOrder, "id" | "created_at">
): Promise<ManufacturingOrder> {
  const { data: order, error } = await supabase
    .from("manufacturing_orders")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return order;
}
export async function completeManufacturingOrder(orderId: string) {
  // STEP 1: Get manufacturing order
  const { data: order, error: orderError } = await supabase
    .from("manufacturing_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError) throw orderError;

  console.log("ORDER:", order);
  console.log("PRODUCT ID:", order.product_id);

  // STEP 2: Get product details
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", order.product_id)
    .single();

  if (productError) throw productError;

  // STEP 3: Fetch BoM (using hardcoded UUID for debugging)
  const { data: bomItems, error: bomError } = await supabase
    .from("bom")
    .select("*")
    .eq("product_id", "b3e3a80a-a312-47c5-bc8d-dfb32288c75c");

  console.log("BOM ITEMS:", bomItems);
  console.log("BOM ERROR:", bomError);

  if (bomError) throw bomError;

  // STEP 4: Calculate material consumption
  const materialsConsumed = bomItems.map((item) => ({
    name: item.raw_material,
    qty: item.quantity * order.required_qty,
  }));

  // STEP 5: Update product stock
  const newStock = product.stock_qty + order.required_qty;

  const { error: stockUpdateError } = await supabase
    .from("products")
    .update({
      stock_qty: newStock,
    })
    .eq("id", order.product_id);

  if (stockUpdateError) throw stockUpdateError;

  // STEP 6: Mark MO completed
  const { error: updateOrderError } = await supabase
    .from("manufacturing_orders")
    .update({
      status: "completed",
    })
    .eq("id", orderId);

  if (updateOrderError) throw updateOrderError;

  // STEP 7: Return summary
  return {
    product_name: product.name,
    produced_qty: order.required_qty,
    materials_consumed: materialsConsumed,
    updated_stock: newStock,
  };
}