import kafka from "../config/kafka";
import { OrderStatus } from "../@types";
import { sendMail } from "../utils/mailer";

const statusConsumer = kafka.consumer({
  groupId: "order-service-status",
});

export const startOrderStatusWorker = async (): Promise<void> => {
  try {
    await statusConsumer.connect();
    console.log("✅ Kafka consumer connected (order-service - order.status.updated)");

    await statusConsumer.subscribe({
      topic: "order.status.updated",
      fromBeginning: false,
    });

    await statusConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;

          const event = JSON.parse(message.value.toString());

          console.log(
            `📩 [order] Received order.status.updated: ${event.orderId} | Status: ${event.status}`
          );

          if (event.status === OrderStatus.OUT_FOR_DELIVERY) {
            // Send email to customer
            const customerEmail = "customer@example.com"; // In real scenario, fetch User email via event.customerId

            await sendMail({
              to: customerEmail,
              subject: "Out for Delivery! 🚚",
              html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                  <h2>Your LogiCore package is on the way!</h2>
                  <p>Your LogiCore package is out for delivery! Please share this secure Delivery PIN with the agent: <strong>${event.otp}</strong>.</p>
                  <p style="margin-top: 20px; font-size: 12px; color: #777;">Thank you for choosing LogiCore.</p>
                </div>
              `
            });
          }
        } catch (err) {
          console.error("❌ [order] Error processing order.status.updated:", err);
        }
      },
    });

    console.log("🔄 Order Status Worker is listening on 'order.status.updated'");
  } catch (error) {
    console.error("❌ Failed to start Order Status Worker:", error);
  }
};
