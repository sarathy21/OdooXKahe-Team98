import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types";

interface LowStockTableProps {
  products: Product[];
}

export function LowStockTable({ products }: LowStockTableProps) {
  const lowStockProducts = products.filter((p) => p.stock_qty < 10);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Procurement Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lowStockProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                No low stock items
              </TableCell>
            </TableRow>
          ) : (
            lowStockProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-right font-mono">
                  {product.stock_qty}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      product.stock_qty === 0 ? "destructive" : "secondary"
                    }
                  >
                    {product.stock_qty === 0 ? "Out of Stock" : "Low Stock"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {product.procurement_type}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}