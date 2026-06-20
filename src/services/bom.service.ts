import { supabase } from "../lib/supabase";

export type BomItem = {
    id: string;
    product_id: string;
    raw_material: string;
    quantity: number;
};

export async function getBomByProduct(
    productId: string
): Promise<BomItem[]> {
    const { data, error } = await supabase
        .from("bom")
        .select("*")
        .eq("product_id", productId);

    if (error) throw error;
    return data;
}

export async function createBom(data: {
    product_id: string;
    raw_material: string;
    quantity: number;
}): Promise<BomItem> {
    const { data: bom, error } = await supabase
        .from("bom")
        .insert(data)
        .select()
        .single();

    if (error) throw error;
    return bom;
}