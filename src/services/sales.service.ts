import { supabase } from "../lib/supabase";
import type { SalesOrder } from "../types/index";
import { checkStock, triggerProcurement } from "./procurement.service";

export async function getSalesOrders(): Promise<SalesOrder[]> {
  const { data, error } = await supabase.from("sales_orders").select("*");

  if (error) throw error;
  return data;
}

export async function createSalesOrder(
  data: {
    customer_name: string;
    product_id: string;
    quantity: number;
    status: string;
  }
): Promise<SalesOrder> {
  // STEP 1: Check stock
  const { sufficient, shortage } = await checkStock(
    data.product_id,
    data.quantity
  );

  // STEP 2: Get procurement type
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("procurement_type")
    .eq("id", data.product_id)
    .single();

  if (productError) throw productError;

  // STEP 3: Create sales order
  const { data: order, error } = await supabase
    .from("sales_orders")
    .insert({
      customer_name: data.customer_name,
      product_id: data.product_id,
      quantity: data.quantity,
      shortage,
      status: data.status,
    })
    .select()
    .single();

  if (error) throw error;

  // STEP 4: Trigger procurement if shortage exists
  if (!sufficient && shortage > 0) {
    await triggerProcurement(
      data.product_id,
      shortage,
      product.procurement_type
    );
  }

  return order;
}