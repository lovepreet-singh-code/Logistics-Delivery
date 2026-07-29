import { deliveryConsumer } from "../config/kafka";
import Order from "../models/Order";
import { IDeliveryCompletedEvent, OrderStatus } from "../@types";

// ──────────────────────────────────────────────
//  Delivery Completed Worker
//  Listens to `delivery.completed` and updates the
//  Order document to DELIVERED status
// ──────────────────────────────────────────────

export const startDeliveryCompletedWorker = async (): Promise<void> => {
  try {
    await deliveryConsumer.connect();
    console.log("✅ Kafka consumer connected (order-service - delivery-completed)");

    await deliveryConsumer.subscribe({
      topic: "delivery.completed",
      fromBeginning: false,
    });

    await deliveryConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;

          const event: IDeliveryCompletedEvent = JSON.parse(
            message.value.toString()
          );

          console.log(
            `📩 [order] Received delivery.completed: ${event.orderId} | Status: ${event.status}`
          );

          // Update the order status
          const updatedOrder = await Order.findByIdAndUpdate(
            event.orderId,
            {
              $set: {
                status: OrderStatus.DELIVERED,
              },
            },
            { new: true }
          );

          if (updatedOrder) {
            console.log(
              `✅ [order] Order ${event.orderId} updated to DELIVERED`
            );
          } else {
            console.error(
              `❌ [order] Order ${event.orderId} not found in database`
            );
          }
        } catch (err) {
          console.error("❌ [order] Error processing delivery.completed:", err);
        }
      },
    });

    console.log("🔄 Delivery Completed Worker is listening on 'delivery.completed'");
  } catch (error) {
    console.error("❌ Failed to start Delivery Completed Worker:", error);
  }
};
