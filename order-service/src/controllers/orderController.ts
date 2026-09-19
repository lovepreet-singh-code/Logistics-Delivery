import { Request, Response } from "express";
import mongoose from "mongoose";
import { createClient } from "redis";
import Order from "../models/Order";
import { producer, publishOrderEvent } from "../config/kafka";
import { ApiResponse, IOrderCreatedEvent, OrderStatus } from "../@types";
import { geocodeAddress } from "../utils/geocoder";
import { generateInvoicePDF } from "../utils/invoiceGenerator";
import stream from "stream";
import csvParser from "csv-parser";
import { v2 as cloudinary } from "cloudinary";
import Razorpay from "razorpay";
import crypto from "crypto";
import { calculateTotalAmount } from "../utils/pricing";

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
    const user = (req as any).user;
    const customerId = req.body.customerId || user?.id || user?._id || user?.userId;
    const { pickupAddress, deliveryAddress, parcelDetails } = req.body;

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

    // Calculate dynamic pricing
    const totalAmount = calculateTotalAmount(pLat, pLng, dLat, dLng, parcelDetails.weightKg || 1);

    const awb = `AWB-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create order (status defaults to PENDING, volume auto-calculated by pre-save hook)
    const order = await Order.create({
      customerId,
      awb,
      pickupAddress,
      deliveryAddress,
      parcelDetails,
      totalAmount,
      paymentStatus: "PENDING_PAYMENT",
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
    console.error("Order Creation Error:", error);
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

// POST /api/orders/bulk-upload
export const bulkUploadOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No CSV file uploaded." } as ApiResponse);
      return;
    }

    const customerId = req.body.customerId || "000000000000000000000000";

    const results: any[] = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        const validOrders = [];
        const errors = [];
        let failed = 0;

        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          try {
            const awb = `AWB-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            
            const newOrder = new Order({
              customerId,
              awb,
              pickupAddress: {
                pinCode: row.SenderPincode || "000000",
                fullAddress: row.SenderAddress || "Default Pickup Address",
                senderName: row.SenderName || "Unknown Sender",
                senderPhone: row.SenderPhone || "0000000000",
                lat: 0,
                lng: 0
              },
              deliveryAddress: {
                pinCode: row.ReceiverPincode || "000000",
                fullAddress: row.ReceiverAddress || "Default Delivery Address",
                receiverName: row.ReceiverName || "Unknown Receiver",
                receiverPhone: row.ReceiverPhone || "0000000000",
                lat: 0,
                lng: 0
              },
              parcelDetails: {
                weightKg: parseFloat(row.Weight) || 1,
                parcelType: ["Document", "Box", "Electronics", "Fragile"].includes(row.ServiceType) ? row.ServiceType : "Box",
                dimensions: { lengthCm: 10, widthCm: 10, heightCm: 10 }
              }
            });

            const validationError = newOrder.validateSync();
            if (validationError) {
              failed++;
              errors.push(`Row ${i + 1}: ${validationError.message}`);
            } else {
              validOrders.push(newOrder);
            }
          } catch (err: any) {
             failed++;
             errors.push(`Row ${i + 1}: ${err.message}`);
          }
        }

        if (validOrders.length > 0) {
          try {
             await Order.insertMany(validOrders, { ordered: false });
          } catch (insertError: any) {
             console.error("Bulk Insert Warning:", insertError);
             // With ordered: false, successful inserts are saved. 
             // We can extract failed duplicates if necessary.
          }
        }

        res.status(200).json({
          success: true,
          message: "Bulk upload processed",
          data: {
             totalProcessed: results.length,
             successful: validOrders.length,
             failed,
             errors
          }
        } as ApiResponse);
      });
      
  } catch (error: any) {
    console.error("Bulk upload CSV error:", error);
    res.status(500).json({ success: false, message: "Server error during bulk upload." } as ApiResponse);
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
// PATCH /api/orders/:id/pickup-confirm
export const confirmPickup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { pickupOtp, actualWeight, pickupImageBase64 } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    if (!pickupOtp || String(order.pickupOtp) !== String(pickupOtp)) {
      res.status(400).json({ success: false, message: 'Invalid Pickup OTP.' });
      return;
    }

    if (actualWeight) {
      order.actualWeight = Number(actualWeight);
      const pLat = order.pickupAddress.lat;
      const pLng = order.pickupAddress.lng;
      const dLat = order.deliveryAddress.lat;
      const dLng = order.deliveryAddress.lng;
      order.totalAmount = calculateTotalAmount(pLat, pLng, dLat, dLng, order.actualWeight);
    }

    if (pickupImageBase64) {
      const uploadResult = await cloudinary.uploader.upload(pickupImageBase64, {
        folder: "logistics_pickup",
        public_id: `pickup_${id}_${Date.now()}`,
      });
      order.pickupImageUrl = uploadResult.secure_url;
    }

    order.status = OrderStatus.PICKED_UP;
    await order.save();

    try {
      await producer.send({
        topic: "order.status.updated",
        messages: [{
          value: JSON.stringify({
            orderId: order._id.toString(),
            status: order.status,
            otp: order.otp,
            customerId: order.customerId.toString(),
            timestamp: new Date().toISOString()
          })
        }]
      });
    } catch (kafkaError) {
      console.error("Kafka Publish Failed (order.status.updated):", kafkaError);
    }

    try {
      if (redisClient.isOpen) {
        await redisClient.del(`track_order:${id}`);
      }
    } catch (redisError) {
      console.error("Redis delete error:", redisError);
    }

    res.status(200).json({ success: true, message: '✅ Parcel Picked Up Successfully & Price Updated!', data: order });
  } catch (error: any) {
    console.error("Pickup confirm error:", error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, signatureBase64, otp } = req.body;
    
    // 1. Find the order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // OTP Validation for Delivery
    if (status === OrderStatus.DELIVERED || status === "DELIVERED") {
      if (!otp || String(otp) !== String(order.otp)) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP. Please ask the customer for the correct PIN."
        });
      }
    }

    // 2. Update status and POD signature
    order.status = status || OrderStatus.DELIVERED;
    if (signatureBase64) {
      order.proofOfDeliverySignature = signatureBase64;
    }
    await order.save();

    // EMIT order.status.updated KAFKA EVENT
    try {
      await producer.send({
        topic: "order.status.updated",
        messages: [{
          value: JSON.stringify({
            orderId: order._id.toString(),
            status: order.status,
            otp: order.otp,
            customerId: order.customerId.toString(),
            timestamp: new Date().toISOString()
          })
        }]
      });
      console.log(`📤 Published order.status.updated for order ${order._id.toString()} (Status: ${order.status})`);
    } catch (kafkaError) {
      console.error("Kafka Publish Failed (order.status.updated):", kafkaError);
    }

    // 2.5 Invalidate Redis cache
    try {
      if (redisClient.isOpen) {
        await redisClient.del(`track_order:${id}`);
      }
    } catch (redisError) {
      console.error("Redis delete error:", redisError);
    }

    // 3. Return success immediately
    return res.status(200).json({ success: true, message: `Order marked as ${order.status} successfully` });

  } catch (error: any) {
    console.error("CRITICAL BACKEND ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
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

    // EMIT order.status.updated KAFKA EVENT
    try {
      await producer.send({
        topic: "order.status.updated",
        messages: [{
          value: JSON.stringify({
            orderId: order._id.toString(),
            status: order.status,
            otp: order.otp,
            customerId: order.customerId.toString(),
            timestamp: new Date().toISOString()
          })
        }]
      });
      console.log(`📤 Published order.status.updated for order ${order._id.toString()} (Status: ${order.status})`);
    } catch (kafkaError) {
      console.error("Kafka Publish Failed (order.status.updated):", kafkaError);
    }

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
      status: OrderStatus.ORDER_PLACED,
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

// GET /api/orders/recent
export const getRecentOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      message: "Recent orders fetched successfully.",
      data: orders,
    } as ApiResponse);
  } catch (error) {
    console.error("Get recent orders error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};

// GET /api/orders/unassigned
export const getUnassignedOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const orders = await Order.find({
      status: { $in: [OrderStatus.ORDER_PLACED, "PENDING"] }
    })
      .sort({ createdAt: 1 })
      .limit(10); // You can adjust the limit as needed

    res.status(200).json({
      success: true,
      message: "Unassigned orders fetched successfully.",
      data: orders,
    } as ApiResponse);
  } catch (error) {
    console.error("Get unassigned orders error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};

// ═══════════════════════════════════════════════
//  PROOF OF DELIVERY (CLOUD STORAGE)
// ═══════════════════════════════════════════════

// POST /api/orders/:id/pod
export const uploadPodImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { signatureBase64 } = req.body;

    if (!signatureBase64) {
      res.status(400).json({ success: false, message: "No signature image provided." } as ApiResponse);
      return;
    }

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" } as ApiResponse);
      return;
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(signatureBase64, {
      folder: "logistics_pod",
      public_id: `pod_${id}_${Date.now()}`,
    });

    order.podImageUrl = uploadResult.secure_url;
    // We can also keep the base64 just in case, but replacing it is fine.
    order.proofOfDeliverySignature = signatureBase64;
    await order.save();

    // Invalidate cache
    try {
      if (redisClient.isOpen) {
        await redisClient.del(`track_order:${id}`);
      }
    } catch (redisError) {
      console.error("Redis delete error:", redisError);
    }

    res.status(200).json({
      success: true,
      message: "POD Image uploaded successfully",
      data: { podImageUrl: uploadResult.secure_url }
    } as ApiResponse);

  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    res.status(500).json({ success: false, message: "Failed to upload POD image to cloud." } as ApiResponse);
  }
};

// ═══════════════════════════════════════════════
//  PAYMENT GATEWAY (RAZORPAY)
// ═══════════════════════════════════════════════

// POST /api/orders/:id/pay
export const initPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" } as ApiResponse);
      return;
    }

    if (order.paymentStatus === "PAID") {
      res.status(400).json({ success: false, message: "Order is already paid." } as ApiResponse);
      return;
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_fallback",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_secret_fallback",
    });

    const options = {
      amount: Math.round((order.totalAmount || 0) * 100), // amount in the smallest currency unit
      currency: "INR",
      receipt: order._id.toString(),
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      message: "Razorpay order created",
      data: razorpayOrder,
    } as ApiResponse);
  } catch (error: any) {
    console.error("Razorpay init error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to initialize payment." } as ApiResponse);
  }
};

// POST /api/orders/verify-payment
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || "rzp_secret_fallback";

    // Create HMAC SHA256
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpay_signature) {
      res.status(400).json({ success: false, message: "Payment verification failed. Invalid signature." } as ApiResponse);
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" } as ApiResponse);
      return;
    }

    order.paymentStatus = "PAID" as any;
    await order.save();

    res.status(200).json({ success: true, message: "Payment verified successfully", data: order } as ApiResponse);
  } catch (error: any) {
    console.error("Payment verification error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to verify payment." } as ApiResponse);
  }
};


// ═══════════════════════════════════════════════
//  EXCEPTION MANAGEMENT (RTO)
// ═══════════════════════════════════════════════

// PATCH /api/orders/:id/exception
export const reportException = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, exceptionReason, base64Image } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" } as ApiResponse);
      return;
    }

    if (base64Image) {
      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: "logistics_rto",
        public_id: `rto_${id}_${Date.now()}`,
      });
      order.rtoImageUrl = uploadResult.secure_url;
    }

    order.status = status || "ATTEMPT_FAILED";
    if (exceptionReason) {
      order.exceptionReason = exceptionReason;
    }

    await order.save();

    // EMIT order.status.updated KAFKA EVENT
    try {
      await producer.send({
        topic: "order.status.updated",
        messages: [{
          value: JSON.stringify({
            orderId: order._id.toString(),
            status: order.status,
            exceptionReason: order.exceptionReason,
            customerId: order.customerId.toString(),
            timestamp: new Date().toISOString()
          })
        }]
      });
    } catch (kafkaError) {
      console.error("Kafka Publish Failed (order.status.updated):", kafkaError);
    }

    try {
      if (redisClient.isOpen) {
        await redisClient.del(`track_order:${id}`);
      }
    } catch (redisError) {
      console.error("Redis delete error:", redisError);
    }

    res.status(200).json({ success: true, message: "Exception reported successfully", data: order } as ApiResponse);
  } catch (error: any) {
    console.error("Report Exception Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to report exception." } as ApiResponse);
  }
};

