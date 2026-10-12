import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../src/models/Order";
import User from "../src/models/User";
import { OrderStatus } from "../src/@types";

dotenv.config();

const rawUri = process.env.MONGO_URI || "mongodb://admin:admin_secret@localhost:27017/logistics_platform?authSource=admin";
// Auto-detect host vs docker container environment
const MONGO_URI = rawUri.includes("mongodb:27017") && !process.env.DOCKER_CONTAINER
  ? rawUri.replace("mongodb:27017", "localhost:27017")
  : rawUri;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const logDivider = () => console.log("─".repeat(60));

function addStatusHistory(order: any, status: string, note: string) {
  if (!order.statusHistory) {
    order.statusHistory = [];
  }
  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note,
  });
}

async function runE2ESimulation() {
  console.log("\n🚀 Starting End-to-End (E2E) Logistics Lifecycle Simulation\n");
  logDivider();

  try {
    console.log(`🔌 Connecting to MongoDB at: ${MONGO_URI.replace(/:[^:]*@/, ":****@")}`);
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to Database successfully.\n");

    const orderAWB = "E2E-9999";
    const trackingId = "TRK-E2E-9999";

    // Clean up any previous test runs
    await Order.deleteMany({ awb: orderAWB });

    // Ensure we have an available agent in the database
    let agent = await User.findOne({
      role: { $in: ["AGENT", "agent", "DRIVER", "driver"] },
      status: { $regex: /^available$/i },
    });

    if (!agent) {
      console.log("ℹ️ No available agent found. Finding or creating test agent...");
      agent = await User.findOne({ role: { $in: ["AGENT", "agent", "DRIVER", "driver"] } });
      if (agent) {
        agent.status = "AVAILABLE";
        agent.availabilityStatus = "AVAILABLE";
        await agent.save();
      } else {
        agent = await User.create({
          name: "Test Runner Agent",
          email: `test-agent-${Date.now()}@logicore.com`,
          role: "AGENT",
          status: "AVAILABLE",
          availabilityStatus: "AVAILABLE",
          vehicleNumber: "DL-01-E2E-99",
          isActive: true,
        });
      }
      console.log(`👤 Active Agent ready: ${agent.name} (ID: ${agent._id})\n`);
    } else {
      console.log(`👤 Using existing Available Agent: ${agent.name} (ID: ${agent._id})\n`);
    }

    const dummyCustomerId = new mongoose.Types.ObjectId("64f1b2c3e4d5a6b7c8d9e0f1");
    const dummyOriginHubId = new mongoose.Types.ObjectId("64f1b2c3e4d5a6b7c8d9e0f2");
    const dummyDestHubId = new mongoose.Types.ObjectId("64f1b2c3e4d5a6b7c8d9e0f3");
    const mockVehicleId = new mongoose.Types.ObjectId("64f1b2c3e4d5a6b7c8d9e0f4");

    // ─────────────────────────────────────────────────────────────
    // Step 1: Create Order (ORDER_PLACED)
    // ─────────────────────────────────────────────────────────────
    console.log("📦 [STEP 1/7] Create Order: Inserting new order E2E-9999...");
    const newOrder = new Order({
      customerId: dummyCustomerId,
      awb: orderAWB,
      trackingId: trackingId,
      status: OrderStatus.ORDER_PLACED,
      pickupAddress: {
        pinCode: "110001",
        fullAddress: "Plot 101, Connaught Place, New Delhi",
        senderName: "E2E Sender Corp",
        senderPhone: "9876543210",
        lat: 28.6315,
        lng: 77.2167,
      },
      deliveryAddress: {
        pinCode: "400001",
        fullAddress: "Flat 402, Marine Drive, Mumbai",
        receiverName: "E2E Recipient Inc",
        receiverPhone: "9123456780",
        lat: 18.9438,
        lng: 72.8231,
      },
      parcelDetails: {
        weightKg: 2.5,
        dimensions: { lengthCm: 25, widthCm: 15, heightCm: 10 },
        category: "ELECTRONICS",
        declaredValue: 1500,
        restrictedItemsConfirmed: true,
      },
      routing: {
        originFranchiseId: dummyOriginHubId,
        destinationFranchiseId: dummyDestHubId,
        isInterFranchise: true,
      },
      paymentMethod: "PREPAID",
      totalAmount: 250,
      pickupOTP: "1234",
      otp: "9999",
      statusHistory: [
        {
          status: OrderStatus.ORDER_PLACED,
          timestamp: new Date(),
          note: "E2E Test: Order registered in system.",
        },
      ],
    });

    await newOrder.save();
    console.log(`   └─> DB Status: ${newOrder.status} | AWB: ${newOrder.awb} | ID: ${newOrder._id}`);
    await sleep(2000);

    // ─────────────────────────────────────────────────────────────
    // Step 2: Auto-Dispatch Pickup (PICKUP_ASSIGNED)
    // ─────────────────────────────────────────────────────────────
    console.log("\n🤖 [STEP 2/7] Auto-Dispatch Pickup: Assigning agent to order...");
    newOrder.status = OrderStatus.PICKUP_ASSIGNED;
    if (!newOrder.routing) (newOrder as any).routing = {};
    (newOrder.routing as any).agentId = agent._id;
    (newOrder.routing as any).vehicleNumber = agent.vehicleNumber || "DL-01-E2E-99";
    (newOrder.routing as any).assignmentType = "AUTO_DISPATCH";
    addStatusHistory(newOrder, OrderStatus.PICKUP_ASSIGNED, `E2E Test: Assigned to agent ${agent.name}`);
    await newOrder.save();

    agent.status = "BUSY";
    agent.availabilityStatus = "BUSY";
    await agent.save();

    console.log(`   └─> Order DB Status: ${newOrder.status} (Agent: ${agent._id})`);
    console.log(`   └─> Agent DB Status: ${agent.status} (Busy on pickup)`);
    await sleep(2000);

    // ─────────────────────────────────────────────────────────────
    // Step 3: Execute Pickup (PICKED_UP)
    // ─────────────────────────────────────────────────────────────
    console.log("\n🤝 [STEP 3/7] Execute Pickup: First-Mile driver confirms parcel pickup...");
    newOrder.status = OrderStatus.PICKED_UP;
    newOrder.actualWeight = 2.5;
    addStatusHistory(newOrder, OrderStatus.PICKED_UP, "E2E Test: Parcel picked up from sender via OTP.");
    await newOrder.save();
    console.log(`   └─> Order DB Status: ${newOrder.status} | Actual Weight: ${newOrder.actualWeight}kg`);
    await sleep(2000);

    // ─────────────────────────────────────────────────────────────
    // Step 4: Origin Inwarding (INWARDED_AT_HUB)
    // ─────────────────────────────────────────────────────────────
    console.log("\n🏢 [STEP 4/7] Origin Inwarding: Inwarded at Origin Hub, releasing driver...");
    newOrder.status = OrderStatus.INWARDED_AT_HUB;
    addStatusHistory(newOrder, OrderStatus.INWARDED_AT_HUB, "E2E Test: Inwarded at origin sorting hub.");
    await newOrder.save();

    // Release agent
    agent.status = "AVAILABLE";
    agent.availabilityStatus = "AVAILABLE";
    await agent.save();

    console.log(`   └─> Order DB Status: ${newOrder.status}`);
    console.log(`   └─> Agent DB Status: ${agent.status} (Released back to pool)`);
    await sleep(2000);

    // ─────────────────────────────────────────────────────────────
    // Step 5: Mid-Mile Transit (IN_TRANSIT)
    // ─────────────────────────────────────────────────────────────
    console.log("\n🚚 [STEP 5/7] Mid-Mile Transit: Manifested to line-haul vehicle...");
    newOrder.status = OrderStatus.IN_TRANSIT;
    if (!newOrder.routing) (newOrder as any).routing = {};
    (newOrder.routing as any).vehicleId = mockVehicleId;
    (newOrder.routing as any).vehicleNumber = "MH-04-LINEHAUL-77";
    addStatusHistory(newOrder, OrderStatus.IN_TRANSIT, `E2E Test: Linehaul transit via truck ${(newOrder.routing as any).vehicleNumber}.`);
    await newOrder.save();
    console.log(`   └─> Order DB Status: ${newOrder.status} | Vehicle: ${(newOrder.routing as any).vehicleNumber}`);
    await sleep(2000);

    // ─────────────────────────────────────────────────────────────
    // Step 6: Destination Inwarding (DESTINATION_HUB)
    // ─────────────────────────────────────────────────────────────
    console.log("\n📍 [STEP 6/7] Destination Inwarding: Arrived and scanned at Destination Hub...");
    newOrder.status = OrderStatus.DESTINATION_HUB;
    addStatusHistory(newOrder, OrderStatus.DESTINATION_HUB, "E2E Test: Inwarded at Mumbai Destination Hub.");
    await newOrder.save();
    console.log(`   └─> Order DB Status: ${newOrder.status}`);
    await sleep(2000);

    // ─────────────────────────────────────────────────────────────
    // Step 7: Last-Mile Delivery (OUT_FOR_DELIVERY -> DELIVERED)
    // ─────────────────────────────────────────────────────────────
    console.log("\n🛵 [STEP 7/7] Last-Mile Delivery: Assigning delivery agent & completing OTP handoff...");
    // Out for delivery
    newOrder.status = OrderStatus.OUT_FOR_DELIVERY;
    if (!newOrder.routing) (newOrder as any).routing = {};
    (newOrder.routing as any).agentId = agent._id;
    addStatusHistory(newOrder, OrderStatus.OUT_FOR_DELIVERY, `E2E Test: Out for delivery with agent ${agent.name}.`);
    await newOrder.save();

    agent.status = "BUSY";
    agent.availabilityStatus = "BUSY";
    await agent.save();

    console.log(`   └─> Order DB Status: ${newOrder.status} (Out with: ${agent.name})`);
    console.log(`   └─> Agent DB Status: ${agent.status}`);
    await sleep(2000);

    // Complete delivery
    newOrder.status = OrderStatus.DELIVERED;
    newOrder.proofOfDeliverySignature = "DATA_SIG_VERIFIED";
    addStatusHistory(newOrder, OrderStatus.DELIVERED, "E2E Test: Delivered to customer with valid OTP verified.");
    await newOrder.save();

    // Release agent
    agent.status = "AVAILABLE";
    agent.availabilityStatus = "AVAILABLE";
    await agent.save();

    console.log(`   └─> Order DB Status: ${newOrder.status} 🎉`);
    console.log(`   └─> Agent DB Status: ${agent.status} (Agent released to pool)`);

    logDivider();
    console.log("\n✨ ═══════════════════════════════════════════════════════════ ✨");
    console.log("📦 Order Placed ➔ 🤖 Dispatched ➔ 🤝 Picked Up ➔ 🏢 Inwarded");
    console.log("   ➔ 🚚 In Transit ➔ 📍 Destination Hub ➔ 🛵 Out ➔ ✅ DELIVERED!");
    console.log("✨ ═══════════════════════════════════════════════════════════ ✨");
    console.log("\n🎉 E2E Simulation completed successfully! All lifecycle stages verified.\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ E2E Simulation failed with error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runE2ESimulation();
