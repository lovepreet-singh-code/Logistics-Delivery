import { consumer } from "../config/kafka";
import Order from "../models/Order";
import { IOrderRoutedEvent, OrderStatus } from "../@types";
import mongoose from "mongoose";

// ──────────────────────────────────────────────
//  Order Routing Consumer Worker
//  Listens to `orders.routed` and updates the
//  Order document with routing data + ROUTED status
// ──────────────────────────────────────────────

export const startOrderRoutedWorker = async (): Promise<void> => {
  try {
    await consumer.connect();
    console.log("✅ Kafka consumer connected (order-group)");

    await consumer.subscribe({
      topic: "orders.routed",
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;

          const event: IOrderRoutedEvent = JSON.parse(
            message.value.toString()
          );

          console.log(
            `📩 [order] Received orders.routed: ${event.orderId} | Origin: ${event.originFranchiseId} → Dest: ${event.destinationFranchiseId} | Inter-franchise: ${event.isInterFranchise}`
          );

          // Update the order with routing information
          const updatedOrder = await Order.findByIdAndUpdate(
            event.orderId,
            {
              $set: {
                "routing.originFranchiseId": new mongoose.Types.ObjectId(
                  event.originFranchiseId
                ),
                "routing.destinationFranchiseId": new mongoose.Types.ObjectId(
                  event.destinationFranchiseId
                ),
                "routing.isInterFranchise": event.isInterFranchise,
                status: OrderStatus.ORDER_PLACED,
              },
            },
            { new: true }
          );

          if (updatedOrder) {
            console.log(
              `✅ [order] Order ${event.orderId} updated to ORDER_PLACED (Routed) | Inter-franchise: ${event.isInterFranchise}`
            );
          } else {
            console.error(
              `❌ [order] Order ${event.orderId} not found in database`
            );
          }
        } catch (err) {
          console.error("❌ [order] Error processing orders.routed:", err);
        }
      },
    });

    console.log("🔄 Order Routed Worker is listening on 'orders.routed'");
  } catch (error) {
    console.error("❌ Failed to start Order Routed Worker:", error);
  }
};
