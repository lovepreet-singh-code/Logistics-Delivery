import { consumer, producer } from "../config/kafka";
import PincodeArea from "../models/PincodeArea";
import redis from "../config/redis";
import { IOrderCreatedEvent, IOrderRoutedEvent, IServiceabilityResult } from "../@types";

// ──── Redis key prefix & TTL ────
const CACHE_PREFIX = "pin:";
const CACHE_TTL_SECONDS = 86400; // 24 hours

// ──── Resolve franchise for a pinCode (cache-aside) ────
const resolveFranchise = async (
  pinCode: string
): Promise<string | null> => {
  const cacheKey = `${CACHE_PREFIX}${pinCode}`;

  // Step A: Check Redis
  const cached = await redis.get(cacheKey);
  if (cached) {
    const parsed: IServiceabilityResult = JSON.parse(cached);
    return parsed.franchise.id;
  }

  // Step B: Cache miss — query MongoDB
  const pincodeArea = await PincodeArea.findOne({ pinCode }).populate(
    "franchiseId",
    "name region basePinCode"
  );

  if (!pincodeArea || !pincodeArea.franchiseId) {
    return null;
  }

  const franchise = pincodeArea.franchiseId as any;

  const result: IServiceabilityResult = {
    pinCode: pincodeArea.pinCode,
    city: pincodeArea.city,
    isActive: pincodeArea.isActive,
    franchise: {
      id: franchise._id.toString(),
      name: franchise.name,
      region: franchise.region,
      basePinCode: franchise.basePinCode,
    },
  };

  // Step C: Cache with 24h TTL
  await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(result));

  return franchise._id.toString();
};

// ──── Start the Order Routing Worker ────
export const startOrderRoutingWorker = async (): Promise<void> => {
  try {
    await consumer.connect();
    console.log("✅ Kafka consumer connected (topology-group)");

    await consumer.subscribe({
      topic: "orders.created",
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;

          const event: IOrderCreatedEvent = JSON.parse(
            message.value.toString()
          );

          console.log(
            `📩 [topology] Received order.created: ${event.orderId} | Pickup: ${event.pickupPinCode} → Delivery: ${event.deliveryPinCode}`
          );

          // Resolve franchise IDs for both pincodes
          const originFranchiseId = await resolveFranchise(event.pickupPinCode);
          const destinationFranchiseId = await resolveFranchise(
            event.deliveryPinCode
          );

          if (!originFranchiseId || !destinationFranchiseId) {
            console.error(
              `❌ [topology] Routing failed for order ${event.orderId}: franchise not found for pickup(${event.pickupPinCode}) or delivery(${event.deliveryPinCode})`
            );
            return;
          }

          const isInterFranchise = originFranchiseId !== destinationFranchiseId;

          const routedEvent: IOrderRoutedEvent = {
            orderId: event.orderId,
            originFranchiseId,
            destinationFranchiseId,
            isInterFranchise,
            timestamp: new Date().toISOString(),
          };

          // Publish routed event
          await producer.send({
            topic: "orders.routed",
            messages: [
              {
                key: event.orderId,
                value: JSON.stringify(routedEvent),
              },
            ],
          });

          console.log(
            `📤 [topology] Published orders.routed: ${event.orderId} | Inter-franchise: ${isInterFranchise}`
          );
        } catch (err) {
          console.error("❌ [topology] Error processing order.created:", err);
        }
      },
    });

    console.log("🔄 Order Routing Worker is listening on 'orders.created'");
  } catch (error) {
    console.error("❌ Failed to start Order Routing Worker:", error);
  }
};
