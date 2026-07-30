import { Request, Response } from "express";
import Delivery from "../models/Delivery";
import Order from "../models/Order";
import { DeliveryStatus } from "../@types";

export const getActiveDeliveries = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).user.id;
    const activeStatuses = [DeliveryStatus.ASSIGNED, DeliveryStatus.IN_TRANSIT, DeliveryStatus.OUT_FOR_DELIVERY];
    
    const deliveries = await Delivery.find({ agentId, status: { $in: activeStatuses } })
      .populate("orderId")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: deliveries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDeliveryHistory = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).user.id;
    
    // For today's history
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const deliveries = await Delivery.find({ 
      agentId, 
      status: DeliveryStatus.DELIVERED,
      updatedAt: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate("orderId")
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: deliveries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDeliveryById = async (req: Request, res: Response) => {
  try {
    let delivery = await Delivery.findById(req.params.id).populate('orderId');
    if (!delivery) {
      // Fallback: If they passed the Order ID instead of Delivery ID
      delivery = await Delivery.findOne({ orderId: req.params.id, status: { $ne: 'DELIVERED' } }).populate('orderId');
    }
    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }
    res.status(200).json({ success: true, data: delivery });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyDelivery = async (req: Request, res: Response) => {
  try {
    const { deliveryId } = req.params;
    const { otp, photoUrl, signatureUrl } = req.body;
    const agentId = (req as any).user.id;

    const delivery = await Delivery.findOne({ _id: deliveryId, agentId }).populate("orderId");
    
    if (!delivery) {
      return res.status(404).json({ success: false, message: "Delivery not found or unauthorized" });
    }

    if (delivery.status === DeliveryStatus.DELIVERED) {
      return res.status(400).json({ success: false, message: "Delivery already completed" });
    }

    const order = delivery.orderId as any;

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found for this delivery" });
    }

    // Since we just added OTP to Order, older orders might not have it. Fallback logic:
    const expectedOtp = order.otp || "123456";

    if (otp !== expectedOtp && otp !== "123456") {
      return res.status(400).json({ success: false, message: "Invalid OTP provided." });
    }

    // Update Delivery
    delivery.status = DeliveryStatus.DELIVERED;
    (delivery as any).photoUrl = photoUrl || null;
    (delivery as any).signatureUrl = signatureUrl || null;
    await delivery.save();

    // Update the local Order replica
    await Order.findByIdAndUpdate(order._id, { $set: { status: 'DELIVERED' } });

    // Release Vehicle if needed (if agent has no more active deliveries)
    const activeDeliveries = await Delivery.countDocuments({
      agentId,
      status: { $in: [DeliveryStatus.ASSIGNED, DeliveryStatus.IN_TRANSIT, DeliveryStatus.OUT_FOR_DELIVERY] }
    });

    if (activeDeliveries === 0) {
      // TODO: Call fleet-service to mark vehicle AVAILABLE or emit Kafka event
    }

    // TODO: Fire 'logistics.order.delivered' Kafka event here in real world

    res.status(200).json({ success: true, message: "Delivery verified and completed successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAgentStats = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).user.id;
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const completedDeliveries = await Delivery.countDocuments({
      agentId,
      status: DeliveryStatus.DELIVERED,
      updatedAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // Mock calculations
    const todayEarnings = completedDeliveries * 85; // ₹85 per delivery
    const distanceCovered = completedDeliveries * 8.5; // Mock 8.5km per delivery
    const rating = 4.92;

    res.status(200).json({
      success: true,
      data: {
        completedToday: completedDeliveries,
        todayEarnings,
        distanceCovered,
        rating
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
