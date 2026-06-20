import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ManufacturingOrder } from "@/types";

interface ManufacturingStatusProps {
  orders: ManufacturingOrder[];
}

export function ManufacturingStatus({ orders }: ManufacturingStatusProps) {
  const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
    draft: "secondary",
    in_progress: "default",
    completed: "success",
    cancelled: "destructive",
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Product ID</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                No manufacturing orders
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">
                  {order.id.slice(0, 8)}...
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {order.product_id.slice(0, 8)}...
                </TableCell>
                <TableCell className="text-right">{order.required_qty}</TableCell>
                <TableCell>
                  <Badge
                    variant={statusColors[order.status] || "default"}
                  >
                    {order.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}