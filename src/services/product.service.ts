import { supabase } from "../lib/supabase";
import type { Product } from "../types/index";

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*");

  if (error) throw error;
  return data;
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createProduct(
  data: Omit<Product, "id" | "created_at">
): Promise<Product> {
  const { data: product, error } = await supabase
    .from("products")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return product;
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, "id" | "created_at">>
): Promise<Product> {
  const { data: product, error } = await supabase
    .from("products")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return product;
}
