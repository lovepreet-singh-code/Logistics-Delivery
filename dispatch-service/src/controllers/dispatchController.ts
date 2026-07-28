import { Request, Response } from "express";
import mongoose from "mongoose";
import Manifest from "../models/Manifest";
import { generateDailyManifests } from "../services/dispatchEngine";
import { ApiResponse } from "../@types";

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
