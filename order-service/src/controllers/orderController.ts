import { Request, Response } from "express";
import mongoose from "mongoose";
import { createClient } from "redis";
import Order from "../models/Order";
import { producer, publishOrderEvent } from "../config/kafka";
import { ApiResponse, IOrderCreatedEvent, OrderStatus } from "../@types";
import { geocodeAddress } from "../utils/geocoder";
import { generateInvoicePDF } from "../utils/invoiceGenerator";

// Initialize Redis Client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
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

    // Geocode addresses
    const [pLat, pLng] = await geocodeAddress(pickupAddress.fullAddress || "");
    const [dLat, dLng] = await geocodeAddress(deliveryAddress.fullAddress || "");

    pickupAddress.lat = pLat;
    pickupAddress.lng = pLng;
    deliveryAddress.lat = dLat;
    deliveryAddress.lng = dLng;

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

    try {
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
    } catch (kafkaError) {
      console.error("Kafka Publish Failed (orders.created):", kafkaError);
    }

    // Publish custom event to logistics.orders as requested
    await publishOrderEvent('logistics.orders', { event: 'ORDER_CREATED', data: order });

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

// GET /api/orders/my-orders
export const getMyOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Assuming you have an authentication middleware that attaches user to req
    const user = (req as any).user;
    const customerId = user?.id || user?._id || user?.userId;

    if (!customerId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized. Missing customer context.",
      } as ApiResponse);
      return;
    }

    const orders = await Order.find({ customerId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Customer orders fetched successfully",
      count: orders.length,
      data: orders,
    } as ApiResponse);
  } catch (error: any) {
    console.error("❌ Error fetching customer orders:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
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

// GET /api/orders/:id/invoice
export const generateInvoice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      } as ApiResponse);
      return;
    }

    // Only allow for DELIVERED orders
    if (order.status !== OrderStatus.DELIVERED) {
      res.status(400).json({
        success: false,
        message: "Invoice can only be generated for DELIVERED orders",
      } as ApiResponse);
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${order._id}.pdf`);

    const doc = generateInvoicePDF(order);
    doc.pipe(res);
  } catch (error) {
    console.error("Generate invoice error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};

// POST /api/orders/bulk
export const bulkCreateOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ordersData = req.body;
    
    if (!Array.isArray(ordersData) || ordersData.length === 0) {
      res.status(400).json({
        success: false,
        message: "Request body must be a non-empty array of orders",
      } as ApiResponse);
      return;
    }

    const createdOrders = [];
    
    // Process iteratively to respect Geocoder rate limit and Kafka events
    for (let i = 0; i < ordersData.length; i++) {
      const { customerId, pickupAddress, deliveryAddress, parcelDetails } = ordersData[i];
      
      // Delay to prevent Nominatim rate limits (except on first request)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const [pLat, pLng] = await geocodeAddress(pickupAddress.fullAddress);
      const [dLat, dLng] = await geocodeAddress(deliveryAddress.fullAddress);

      pickupAddress.lat = pLat;
      pickupAddress.lng = pLng;
      deliveryAddress.lat = dLat;
      deliveryAddress.lng = dLng;

      const order = new Order({
        customerId, // Defaulted in the frontend if needed
        pickupAddress,
        deliveryAddress,
        parcelDetails,
      });

      const savedOrder = await order.save();
      createdOrders.push(savedOrder);

      const event: IOrderCreatedEvent = {
        orderId: savedOrder._id.toString(),
        pickupPinCode: savedOrder.pickupAddress.pinCode,
        deliveryPinCode: savedOrder.deliveryAddress.pinCode,
        customerId: savedOrder.customerId.toString(),
        timestamp: new Date().toISOString(),
      };

      try {
        await publishOrderEvent("order.created", event);
      } catch (kafkaError) {
        console.error("Failed to publish Kafka event for bulk order", savedOrder._id, kafkaError);
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdOrders.length} orders in bulk`,
      data: createdOrders,
    } as ApiResponse);
  } catch (error: any) {
    console.error("❌ Bulk create error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error during bulk upload",
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
// PATCH /api/orders/:id/status
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

    // ── Cache Invalidation ──
    try {
      const cacheKey = `track_order:${order._id}`;
      if (redisClient.isOpen) {
        await redisClient.del(cacheKey);
        console.log(`🧹 [Cache] Invalidated ${cacheKey}`);
      }
    } catch (cacheErr) {
      console.error("Failed to invalidate cache (Graceful Degradation):", cacheErr);
    }

    // ── Kafka Event Publishing ──
    try {
      if (status === OrderStatus.DELIVERED) {
        await publishOrderEvent("logistics.orders", {
          event: "ORDER_DELIVERED",
          data: order,
        });
        console.log(`📤 [Kafka] Published ORDER_DELIVERED for ${order._id}`);
      }
    } catch (kafkaErr) {
      console.error("Failed to publish Kafka event (Graceful Degradation):", kafkaErr);
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
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
//  MANUAL ASSIGNMENT (TESTING BYPASS)
// ═══════════════════════════════════════════════

// PUT /api/orders/:orderId/assign
export const manualAssignOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { agentId, franchiseId, vehicleId, assignmentType, status } = req.body;

    // 1. Validate Order
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" } as ApiResponse);
      return;
    }

    // 2. Query Agent in shared DB
    const usersCollection = mongoose.connection.db!.collection("users");
    const agent = await usersCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(agentId),
      franchiseId: new mongoose.Types.ObjectId(franchiseId)
    });

    if (!agent) {
      res.status(404).json({ success: false, message: "Agent not found or does not belong to this franchise" } as ApiResponse);
      return;
    }

    // 3. Update Order
    order.status = status || OrderStatus.OUT_FOR_DELIVERY;
    
    // Make sure routing object exists
    if (!order.routing) {
      order.routing = {};
    }
    order.routing.agentId = new mongoose.Types.ObjectId(agentId);
    order.routing.vehicleId = new mongoose.Types.ObjectId(vehicleId);
    order.routing.assignmentType = assignmentType || "MANUAL";
    
    await order.save();

    // 4. Update Agent Availability
    await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(agentId) },
      { $set: { availabilityStatus: "ON_DUTY", updatedAt: new Date() } }
    );

    res.status(200).json({ 
      success: true, 
      message: "Order assigned successfully (Manual Bypass)", 
      data: order 
    } as ApiResponse);
  } catch (error: any) {
    console.error("Manual assign error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" } as ApiResponse);
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

// ═══════════════════════════════════════════════
//  DASHBOARD METRICS
// ═══════════════════════════════════════════════

// GET /api/orders/stats
export const getOrderStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const pending = await Order.countDocuments({ status: "PENDING" });
    const delivered = await Order.countDocuments({ status: "DELIVERED" });
    
    res.status(200).json({
      success: true,
      pending,
      delivered,
      data: { pending, delivered }
    });
  } catch (error) {
    console.error("Get order stats error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
