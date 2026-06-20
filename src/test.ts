import { createSalesOrder } from "./services/sales.service";
import { getManufacturingOrders, completeManufacturingOrder } from "./services/manufacturing.service";

async function test() {
    try {
        const so = await createSalesOrder({
            customer_name: "BOM Test",
            product_id: "b3e3a80a-a312-47c5-bc8d-dfb32288c75c",
            quantity: 100,
            status: "pending",
        });
        console.log("Sales order created, shortage:", so.shortage);

        const orders = await getManufacturingOrders();
        const pending = orders.filter(o => o.status !== "completed");
        console.log("Pending MOs:", pending.length);

        if (pending.length > 0) {
            const result = await completeManufacturingOrder(pending[0].id);
            console.log(JSON.stringify(result, null, 2));
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
