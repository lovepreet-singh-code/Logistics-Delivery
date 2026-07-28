import { Request, Response } from "express";
import mongoose from "mongoose";
import { createClient } from "redis";
import Order from "../models/Order";
import { producer } from "../config/kafka";
import { ApiResponse, IOrderCreatedEvent, OrderStatus } from "../@types";

// Initialize Redis Client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.connect().catch(console.error);


// ═══════════════════════════════════════════════
//  ORDER ENDPOINTS
// ═══════════════════════════════════════════════

// POST /api/orders
export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { customerId, pickupAddress, deliveryAddress, parcelDetails } =
      req.body;

    // Validate required fields
    if (!customerId || !pickupAddress || !deliveryAddress || !parcelDetails) {
      res.status(400).json({
        success: false,
        message:
          "Please provide customerId, pickupAddress, deliveryAddress, and parcelDetails.",
      } as ApiResponse);
      return;
    }

    // Create order (status defaults to PENDING, volume auto-calculated by pre-save hook)
    const order = await Order.create({
      customerId,
      pickupAddress,
      deliveryAddress,
      parcelDetails,
    });

    // Publish event to Kafka
    const event: IOrderCreatedEvent = {
      orderId: order._id.toString(),
      pickupPinCode: order.pickupAddress.pinCode,
      deliveryPinCode: order.deliveryAddress.pinCode,
      customerId: order.customerId.toString(),
      timestamp: new Date().toISOString(),
    };

    await producer.send({
      topic: "orders.created",
      messages: [
        {
          key: order._id.toString(),
          value: JSON.stringify(event),
        },
      ],
    });

    console.log(
      `📤 [order] Published orders.created: ${order._id} | ${order.pickupAddress.pinCode} → ${order.deliveryAddress.pinCode}`
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully. Routing in progress.",
      data: order,
    } as ApiResponse);
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (e: any) => e.message
      );
      res
        .status(400)
        .json({
          success: false,
          message: messages.join(". "),
        } as ApiResponse);
      return;
    }
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};

// GET /api/orders
export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, customerId } = req.query;

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully.",
      count: orders.length,
      data: orders,
    } as ApiResponse);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};

// GET /api/orders/:id
export const getOrderById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const orderId = req.params.id;
    const cacheKey = `track_order:${orderId}`;

    // 1. Attempt to fetch from Redis Cache first
    try {
      if (redisClient.isOpen) {
        const cachedOrder = await redisClient.get(cacheKey);
        if (cachedOrder) {
          res.status(200).json({
            success: true,
            message: "Order retrieved successfully. (Cache Hit)",
            data: JSON.parse(cachedOrder),
          } as ApiResponse);
          return;
        }
      }
    } catch (redisError) {
      console.error("Redis fetch error (falling back to DB):", redisError);
    }

    // 2. Fallback: Fetch from DB (Cache Miss)
    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found.",
      } as ApiResponse);
      return;
    }

    // 3. Save the result to Redis with 60s TTL
    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, 60, JSON.stringify(order));
      }
    } catch (redisError) {
      console.error("Redis set error:", redisError);
    }

    res.status(200).json({
      success: true,
      message: "Order retrieved successfully. (Cache Miss)",
      data: order,
    } as ApiResponse);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};

// GET /api/orders/:id/status
export const getOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id).select(
      "status routing updatedAt"
    );

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found.",
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Order status retrieved.",
      data: {
        orderId: order._id,
        status: order.status,
        routing: order.routing,
        lastUpdated: order.updatedAt,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Get order status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};

// ═══════════════════════════════════════════════
//  UPDATE ORDER STATUS
// ═══════════════════════════════════════════════

// PUT /api/orders/:id/status
export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;

    if (!status || !Object.values(OrderStatus).includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid or missing status.",
      } as ApiResponse);
      return;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found.",
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      data: order,
    } as ApiResponse);
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};

// ═══════════════════════════════════════════════
//  INTERNAL API — Used by Dispatch Service
// ═══════════════════════════════════════════════

// GET /api/orders/routed/:franchiseId
export const getRoutedOrdersByFranchise = async (
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

    const orders = await Order.find({
      status: OrderStatus.ROUTED,
      "routing.originFranchiseId": franchiseId,
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      message: "Routed orders retrieved successfully.",
      count: orders.length,
      data: orders,
    } as ApiResponse);
  } catch (error) {
    console.error("Get routed orders error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};
