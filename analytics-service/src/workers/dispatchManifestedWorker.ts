import { dispatchConsumer } from "../config/kafka";
import Order from "../models/Order";
import { IDispatchManifestedEvent, OrderStatus } from "../@types";

// ──────────────────────────────────────────────
//  Dispatch Manifested Consumer Worker
//  Listens to `dispatch.manifested` and updates
//  order statuses from ROUTED → MANIFESTED
// ──────────────────────────────────────────────

export const startDispatchManifestedWorker = async (): Promise<void> => {
  try {
    await dispatchConsumer.connect();
    console.log("✅ Kafka dispatch consumer connected (order-group-dispatch)");

    await dispatchConsumer.subscribe({
      topic: "dispatch.manifested",
      fromBeginning: false,
    });

    await dispatchConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;

          const event: IDispatchManifestedEvent = JSON.parse(
            message.value.toString()
          );

          console.log(
            `📩 [order] Received dispatch.manifested: Manifest ${event.manifestId} | ${event.orderIds.length} orders`
          );

          // Bulk update all orders in the manifest to MANIFESTED
          const result = await Order.updateMany(
            {
              _id: { $in: event.orderIds },
              status: OrderStatus.ROUTED,
            },
            {
              $set: { status: OrderStatus.MANIFESTED },
            }
          );

          console.log(
            `✅ [order] ${result.modifiedCount}/${event.orderIds.length} orders updated to MANIFESTED for manifest ${event.manifestId}`
          );
        } catch (err) {
          console.error(
            "❌ [order] Error processing dispatch.manifested:",
            err
          );
        }
      },
    });

    console.log(
      "🔄 Dispatch Manifested Worker is listening on 'dispatch.manifested'"
    );
  } catch (error) {
    console.error("❌ Failed to start Dispatch Manifested Worker:", error);
  }
};
