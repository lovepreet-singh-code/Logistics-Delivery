import { deliveryConsumer } from "../config/kafka";
import Order from "../models/Order";
import { IDeliveryCompletedEvent, OrderStatus } from "../@types";
import { sendMail } from "../utils/mailer";

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

            // Fetch the customer email (mocked if not found)
            const customerEmail = "customer@example.com"; // In real scenario, fetch User email via customerId

            // Send Email Notification
            await sendMail({
              to: customerEmail,
              subject: "Package Successfully Delivered! 🎉",
              html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                  <h2>Your LogiCore package has arrived!</h2>
                  <p>Your order (ID: ${event.orderId}) was successfully delivered.</p>
                  <p>You can view your Digital Signature Receipt here:</p>
                  <a href="${updatedOrder.podImageUrl}" style="display:inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">View Digital Receipt</a>
                  <p style="margin-top: 20px; font-size: 12px; color: #777;">Thank you for choosing LogiCore.</p>
                </div>
              `
            });

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
