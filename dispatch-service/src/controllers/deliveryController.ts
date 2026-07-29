import "../models/Order"; // Ensure Order model is registered
import { Request, Response } from "express";
import Delivery from "../models/Delivery";
import { producer } from "../config/kafka";
import { ApiResponse, DeliveryStatus, IDeliveryCompletedEvent } from "../@types";
import mongoose from "mongoose";

// ═══════════════════════════════════════════════
//  DELIVERY ENDPOINTS
// ═══════════════════════════════════════════════

// GET /api/deliveries
export const getDeliveries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deliveries = await Delivery.find()
      .populate("orderId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Deliveries fetched successfully",
      count: deliveries.length,
      data: deliveries,
    } as ApiResponse);
  } catch (error: any) {
    console.error("❌ Error fetching deliveries:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    } as ApiResponse);
  }
};

// GET /api/deliveries/today
export const getDeliveriesToday = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;
    const agentId = user?.id || user?._id || user?.userId;

    if (!agentId) {
      res.status(401).json({ success: false, message: "Unauthorized" } as ApiResponse);
      return;
    }

    const deliveries = await Delivery.find({
      status: "PENDING",
    })
      .populate({ path: "orderId", select: "pickupAddress deliveryAddress customerId customerPhone" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Today's deliveries fetched successfully",
      count: deliveries.length,
      data: deliveries,
    } as ApiResponse);
  } catch (error: any) {
    console.error("❌ Error fetching today's deliveries:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    } as ApiResponse);
  }
};

// PATCH /api/deliveries/:id/start
export const startDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deliveryId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(deliveryId)) {
      res.status(400).json({ success: false, message: "Invalid delivery ID" });
      return;
    }

    const delivery = await Delivery.findByIdAndUpdate(
      deliveryId,
      { status: DeliveryStatus.OUT_FOR_DELIVERY },
      { new: true }
    );

    if (!delivery) {
      res.status(404).json({ success: false, message: "Delivery not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Delivery started successfully",
      data: delivery,
    } as ApiResponse);
  } catch (error: any) {
    console.error("❌ Error starting delivery:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    } as ApiResponse);
  }
};

// PATCH /api/deliveries/:id/complete
export const completeDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deliveryId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(deliveryId)) {
      res.status(400).json({ success: false, message: "Invalid delivery ID" });
      return;
    }

    const delivery = await Delivery.findByIdAndUpdate(
      deliveryId,
      { status: DeliveryStatus.DELIVERED },
      { new: true }
    );

    if (!delivery) {
      res.status(404).json({ success: false, message: "Delivery not found" });
      return;
    }

    // Publish event to Kafka
    const event: IDeliveryCompletedEvent = {
      orderId: delivery.orderId.toString(),
      agentId: delivery.agentId?.toString(),
      status: delivery.status,
      proofOfDelivery: delivery.proofOfDelivery,
      timestamp: new Date().toISOString(),
    };

    await producer.send({
      topic: "delivery.completed",
      messages: [{ value: JSON.stringify(event) }],
    });
    console.log(`📤 Published delivery.completed event for order ${delivery.orderId}`);

    res.status(200).json({
      success: true,
      message: "Delivery completed successfully",
      data: delivery,
    } as ApiResponse);
  } catch (error: any) {
    console.error("❌ Error completing delivery:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    } as ApiResponse);
  }
};

// PATCH /api/deliveries/:id/location
export const updateLocation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const deliveryId = req.params.id;
    const { lat, lng } = req.body;

    if (!mongoose.Types.ObjectId.isValid(deliveryId)) {
      res.status(400).json({ success: false, message: "Invalid delivery ID" });
      return;
    }

    if (lat === undefined || lng === undefined) {
      res.status(400).json({ success: false, message: "Please provide lat and lng" });
      return;
    }

    const delivery = await Delivery.findByIdAndUpdate(
      deliveryId,
      { "currentLocation.lat": lat, "currentLocation.lng": lng },
      { new: true }
    );

    if (!delivery) {
      res.status(404).json({ success: false, message: "Delivery not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: delivery,
    } as ApiResponse);
  } catch (error: any) {
    console.error("❌ Error updating location:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    } as ApiResponse);
  }
};

// POST /api/deliveries/proof
export const uploadProof = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { deliveryId, imageUrl, signatureString } = req.body;

    if (!deliveryId || (!imageUrl && !signatureString)) {
      res.status(400).json({
        success: false,
        message: "Please provide deliveryId and either imageUrl or signatureString",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(deliveryId)) {
      res.status(400).json({ success: false, message: "Invalid delivery ID" });
      return;
    }

    // Mocking an S3 URL or using the provided string
    const proofUrl = imageUrl || signatureString || "https://mock-s3-bucket.s3.amazonaws.com/proof-of-delivery-mock.jpg";

    const delivery = await Delivery.findByIdAndUpdate(
      deliveryId,
      { proofOfDelivery: proofUrl },
      { new: true }
    );

    if (!delivery) {
      res.status(404).json({ success: false, message: "Delivery not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Proof of delivery uploaded successfully",
      data: delivery,
    } as ApiResponse);
  } catch (error: any) {
    console.error("❌ Error uploading proof:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    } as ApiResponse);
  }
};
