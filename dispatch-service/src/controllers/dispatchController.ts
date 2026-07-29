import { Request, Response } from "express";
import mongoose from "mongoose";
import Manifest from "../models/Manifest";
import Delivery from "../models/Delivery";
import { generateDailyManifests } from "../services/dispatchEngine";
import { ApiResponse } from "../@types";
import { producer } from "../config/kafka";import { producer } from "../config/kafka";

// ═══════════════════════════════════════════════
//  DISPATCH CONTROLLER
// ═══════════════════════════════════════════════

// POST /api/dispatch/run/:franchiseId
export const getAgentManifest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const agentId = (req as any).user?.id;
    if (!agentId) {
      res.status(401).json({ success: false, message: "Unauthorized" } as ApiResponse);
      return;
    }

    // 1. Find the ACTIVE manifest assigned to this agent
    const manifest = await Manifest.findOne({ agentId, status: "ACTIVE" }).lean();
    if (!manifest || manifest.routeSequence.length === 0) {
      console.log(`[Manifest API] No active manifest found for agent: ${agentId}`);
      res.status(200).json({ success: true, data: [] } as ApiResponse);
      return;
    }

    console.log(`[Manifest API] Found active manifest for agent ${agentId} with ${manifest.routeSequence.length} orders in sequence.`);

    // 2. Extract order IDs from the route sequence
    const orderIds = manifest.routeSequence.map((seq) => seq.orderId);

    // 3. Query the shared MongoDB 'orders' collection directly for speed
    const orders = await mongoose.connection.db!.collection("orders")
      .find({ _id: { $in: orderIds.map((id: any) => new mongoose.Types.ObjectId(id.toString())) } })
      .project({ _id: 1, trackingId: 1, deliveryAddress: 1, status: 1, customerPhone: 1, updatedAt: 1 })
      .toArray();

    // Map order details back to the sequence order (LIFO - reverse)
    const reversedSequence = [...manifest.routeSequence].reverse();
    const orderedOrders = reversedSequence.map(seq => {
      return orders.find(o => o._id.toString() === seq.orderId.toString());
    }).filter(Boolean);

    console.log(`[Manifest API] Successfully populated and returning ${orderedOrders.length} orders for agent ${agentId}.`);

    res.status(200).json({ success: true, data: orderedOrders } as ApiResponse);
  } catch (error) {
    console.error("Error fetching agent manifest:", error);
    res.status(500).json({ success: false, message: "Internal server error" } as ApiResponse);
  }
};

// ═══════════════════════════════════════════════
//  DEBUG ENDPOINTS
// ═══════════════════════════════════════════════

// POST /api/dispatch/debug/create-mock-manifest
export const createMockManifest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { agentId, orderId } = req.body;

    if (!agentId || !orderId) {
      res.status(400).json({ success: false, message: "agentId and orderId are required" } as ApiResponse);
      return;
    }

    // Deactivate any existing active manifests for this agent to avoid conflicts
    await Manifest.updateMany(
      { agentId: new mongoose.Types.ObjectId(agentId), status: "ACTIVE" },
      { $set: { status: "COMPLETED" } }
    );

    // Create a new active manifest
    const manifest = await Manifest.create({
      franchiseId: new mongoose.Types.ObjectId(), // Mock Franchise
      vehicleId: new mongoose.Types.ObjectId(),   // Mock Vehicle
      agentId: new mongoose.Types.ObjectId(agentId),
      status: "ACTIVE",
      date: new Date(),
      routeSequence: [
        {
          orderId: new mongoose.Types.ObjectId(orderId),
          lat: 40.7128,
          lng: -74.0060
        }
      ],
      loadingSequence: [new mongoose.Types.ObjectId(orderId)]
    });

    // Automatically create a corresponding Delivery record for the Agent Portal
    const delivery = await Delivery.create({
      orderId: new mongoose.Types.ObjectId(orderId),
      agentId: new mongoose.Types.ObjectId(agentId),
      status: "PENDING",
    });

    res.status(201).json({
      success: true,
      message: "Mock manifest created successfully.",
      data: {
        manifest,
        deliveryId: delivery._id
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error("Create mock manifest error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" } as ApiResponse);
  }
};

// POST /api/dispatch/run/:franchiseId
export const runDispatch = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { franchiseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(franchiseId)) {
      res.status(400).json({
        success: false,
        message: "Invalid franchise ID format.",
      } as ApiResponse);
      return;
    }

    const results = await generateDailyManifests(franchiseId);

    if (results.length === 0) {
      res.status(200).json({
        success: true,
        message: "No manifests generated. No routed orders or available vehicles.",
        data: [],
      } as ApiResponse);
      return;
    }

    res.status(201).json({
      success: true,
      message: `Dispatch complete. ${results.length} manifest(s) generated.`,
      count: results.length,
      data: results,
    } as ApiResponse);
  } catch (error: any) {
    console.error("Dispatch engine error:", error.message);

    // Handle inter-service call failures
    if (error.code === "ECONNREFUSED") {
      res.status(503).json({
        success: false,
        message: "Dependent service unavailable. Ensure order-service and fleet-service are running.",
      } as ApiResponse);
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};

// GET /api/dispatch/manifests
export const getAllManifests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { franchiseId, status } = req.query;

    const filter: Record<string, any> = {};
    if (franchiseId) filter.franchiseId = franchiseId;
    if (status) filter.status = status;

    const manifests = await Manifest.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Manifests retrieved successfully.",
      count: manifests.length,
      data: manifests,
    } as ApiResponse);
  } catch (error) {
    console.error("Get manifests error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};

// GET /api/dispatch/manifests/:id
export const getManifestById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const manifest = await Manifest.findById(req.params.id);

    if (!manifest) {
      res.status(404).json({
        success: false,
        message: "Manifest not found.",
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Manifest retrieved successfully.",
      data: manifest,
    } as ApiResponse);
  } catch (error) {
    console.error("Get manifest error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};

// ═══════════════════════════════════════════════
//  MANUAL DISPATCH ASSIGNMENTS
// ═══════════════════════════════════════════════

// POST /api/dispatch/assign-driver
export const assignDriver = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId, driverId, franchiseId } = req.body;

    if (!orderId || !driverId || !franchiseId) {
      res.status(400).json({ success: false, message: "orderId, driverId, and franchiseId are required" } as ApiResponse);
      return;
    }

    const usersCollection = mongoose.connection.db!.collection("users");
    const driver = await usersCollection.findOne({
      _id: new mongoose.Types.ObjectId(driverId),
      franchiseId: new mongoose.Types.ObjectId(franchiseId)
    });

    if (!driver) {
      res.status(404).json({ success: false, message: "Driver not found or does not belong to this franchise" } as ApiResponse);
      return;
    }

    if (driver.availabilityStatus !== "AVAILABLE") {
      res.status(400).json({ success: false, message: `Driver is currently ${driver.availabilityStatus}` } as ApiResponse);
      return;
    }

    // Update orders collection
    const ordersCollection = mongoose.connection.db!.collection("orders");
    const order = await ordersCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(orderId) },
      { $set: { "routing.agentId": new mongoose.Types.ObjectId(driverId), status: "ASSIGNED", updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" } as ApiResponse);
      return;
    }

    // Create or Update Manifest and Delivery
    let manifest = await Manifest.findOne({ agentId: new mongoose.Types.ObjectId(driverId), status: "ACTIVE" });
    if (!manifest) {
      manifest = await Manifest.create({
        franchiseId: new mongoose.Types.ObjectId(franchiseId),
        agentId: new mongoose.Types.ObjectId(driverId),
        status: "ACTIVE",
        date: new Date(),
        routeSequence: [{ orderId: new mongoose.Types.ObjectId(orderId), lat: 0, lng: 0 }],
        loadingSequence: [new mongoose.Types.ObjectId(orderId)]
      });
    } else {
      if (!manifest.routeSequence.find(r => r.orderId.toString() === orderId)) {
        manifest.routeSequence.push({ orderId: new mongoose.Types.ObjectId(orderId), lat: 0, lng: 0 });
        manifest.loadingSequence.push(new mongoose.Types.ObjectId(orderId));
        await manifest.save();
      }
    }

    await Delivery.findOneAndUpdate(
      { orderId: new mongoose.Types.ObjectId(orderId) },
      { $set: { agentId: new mongoose.Types.ObjectId(driverId), status: "ASSIGNED", manifestId: manifest._id } },
      { upsert: true }
    );

    // Update driver status
    await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(driverId) },
      { $set: { availabilityStatus: "ON_DUTY", updatedAt: new Date() } }
    );

    // Trigger Kafka event
    try {
      await producer.send({
        topic: "logistics.orders",
        messages: [{
          key: orderId,
          value: JSON.stringify({ event: 'ORDER_ASSIGNED', data: { orderId, driverId } }),
        }],
      });
    } catch (err) {
      console.error("Failed to publish logistics.order.assigned:", err);
    }

    res.status(200).json({ success: true, message: "Driver assigned successfully", data: order } as ApiResponse);
  } catch (error: any) {
    console.error("Assign driver error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" } as ApiResponse);
  }
};

// POST /api/dispatch/assign-vehicle
export const assignVehicle = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId, vehicleId, franchiseId } = req.body;

    if (!orderId || !vehicleId || !franchiseId) {
      res.status(400).json({ success: false, message: "orderId, vehicleId, and franchiseId are required" } as ApiResponse);
      return;
    }

    const vehiclesCollection = mongoose.connection.db!.collection("vehicles");
    const vehicle = await vehiclesCollection.findOne({
      _id: new mongoose.Types.ObjectId(vehicleId),
      franchiseId: new mongoose.Types.ObjectId(franchiseId)
    });

    if (!vehicle) {
      res.status(404).json({ success: false, message: "Vehicle not found or does not belong to this franchise" } as ApiResponse);
      return;
    }

    if (vehicle.status !== "AVAILABLE") {
      res.status(400).json({ success: false, message: `Vehicle is currently ${vehicle.status}` } as ApiResponse);
      return;
    }

    // Update orders collection
    const ordersCollection = mongoose.connection.db!.collection("orders");
    const order = await ordersCollection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(orderId) },
      { $set: { "routing.vehicleId": new mongoose.Types.ObjectId(vehicleId), status: "ASSIGNED", updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" } as ApiResponse);
      return;
    }

    // We can attach vehicleId to manifest if the order already has one
    const delivery = await Delivery.findOne({ orderId: new mongoose.Types.ObjectId(orderId) });
    if (delivery && delivery.manifestId) {
      await Manifest.updateOne(
        { _id: delivery.manifestId },
        { $set: { vehicleId: new mongoose.Types.ObjectId(vehicleId) } }
      );
    }

    // Update vehicle status
    await vehiclesCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(vehicleId) },
      { $set: { status: "IN_TRANSIT", updatedAt: new Date() } }
    );

    // Trigger Kafka event
    try {
      await producer.send({
        topic: "logistics.orders",
        messages: [{
          key: orderId,
          value: JSON.stringify({ event: 'ORDER_ASSIGNED', data: { orderId, vehicleId } }),
        }],
      });
    } catch (err) {
      console.error("Failed to publish logistics.order.assigned:", err);
    }

    res.status(200).json({ success: true, message: "Vehicle assigned successfully", data: order } as ApiResponse);
  } catch (error: any) {
    console.error("Assign vehicle error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" } as ApiResponse);
  }
};
