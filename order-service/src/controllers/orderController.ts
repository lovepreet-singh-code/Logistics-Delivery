import { Request, Response } from "express";
import mongoose from "mongoose";
import { createClient } from "redis";
import Order from "../models/Order";
import Hub from "../models/Hub";
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
    console.log("📥 INCOMING BOOKING PAYLOAD:", JSON.stringify(req.body, null, 2));
    const user = (req as any).user;
    const customerId = req.body.customerId || user?.id || user?._id || user?.userId || "64f1b2c3e4d5a6b7c8d9e0f1";
    const { sender, receiver, parcelDetails, paymentMethod, pickupDate } = req.body;

    // Support both direct pickupAddress/deliveryAddress and the new sender/receiver objects
    const pickupAddress = sender ? {
      fullAddress: sender.fullAddress,
      pinCode: sender.pincode || sender.pinCode,
      senderName: sender.name,
      senderPhone: sender.phone,
    } : req.body.pickupAddress;

    const deliveryAddress = receiver ? {
      fullAddress: receiver.fullAddress,
      pinCode: receiver.pincode || receiver.pinCode,
      receiverName: receiver.name,
      receiverPhone: receiver.phone,
    } : req.body.deliveryAddress;

    // Validate required fields
    if (!customerId || !pickupAddress || !deliveryAddress || !parcelDetails) {
      res.status(400).json({
        success: false,
        message:
          "Please provide customerId, pickupAddress, deliveryAddress, and parcelDetails.",
      } as ApiResponse);
      return;
    }

    const isRestrictedConfirmed = req.body.restrictedItemsConfirmed ?? parcelDetails?.restrictedItemsConfirmed;
    if (isRestrictedConfirmed !== true) {
      res.status(400).json({
        success: false,
        message: "You must confirm that the parcel contains no restricted or hazardous items."
      } as ApiResponse);
      return;
    }

    // Ensure parcelDetails contains the properties if they were passed at the root
    if (req.body.dimensions && !parcelDetails.dimensions) parcelDetails.dimensions = req.body.dimensions;
    if (req.body.declaredValue && !parcelDetails.declaredValue) parcelDetails.declaredValue = req.body.declaredValue;
    parcelDetails.restrictedItemsConfirmed = true;

    // --- BOOKING VALIDATION INTERCEPTOR ---
    const pickupPincode = pickupAddress.pinCode || req.body.pickupDetails?.pincode;
    const deliveryPincode = deliveryAddress.pinCode || req.body.deliveryDetails?.pincode;

    const [isPickupServiceable, isDeliveryServiceable] = await Promise.all([
      Hub.exists({ isActive: true, serviceablePincodes: pickupPincode }),
      Hub.exists({ isActive: true, serviceablePincodes: deliveryPincode })
    ]);

    if (!isPickupServiceable || !isDeliveryServiceable) {
      res.status(400).json({
        success: false,
        message: "Service is currently not available for one or both of the provided pincodes."
      });
      return;
    }
    // --------------------------------------

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

    req.body.customerId = req.body.customerId || "64f1b2c3e4d5a6b7c8d9e0f1";
    req.body.price = req.body.price || 150; // Add default price
    req.body.status = req.body.status || "ORDER_PLACED";
    req.body.paymentStatus = req.body.paymentMethod === 'COD' ? "PENDING_PAYMENT" : "PENDING_PAYMENT";
    req.body.trackingId = req.body.trackingId || `TRK${Date.now()}`;

    // Create order instance (status defaults to PENDING_PICKUP if auto-assign fails)
    const order = new Order({
      customerId: customerId || req.body.customerId,
      awb,
      pickupAddress,
      deliveryAddress,
      parcelDetails,
      pickupDate,
      status: req.body.status || OrderStatus.PENDING_PICKUP, // Default fallback
      paymentMethod: paymentMethod || "PREPAID",
      totalAmount: totalAmount || req.body.price,
      paymentStatus: req.body.paymentStatus,
    });

    // --- AUTO-DISPATCH ENGINE (REAL AGENT) ---
    if (mongoose.connection.db) {
      const usersCollection = mongoose.connection.db.collection("users");
      const realAgent = await usersCollection.findOne({ email: "driver@example.com" }) || await usersCollection.findOne({ role: { $regex: /^agent$/i } });
      
      if (realAgent) {
        order.routing = order.routing || {};
        order.routing.agentId = realAgent._id as mongoose.Types.ObjectId;
        order.status = OrderStatus.PICKUP_ASSIGNED;
        console.log(`[Auto-Dispatch] Assigned order ${order._id} to real agent ${order.routing.agentId}`);
      } else {
        console.log(`[Auto-Dispatch] No agent found, remaining in PENDING_PICKUP`);
      }
    }
    // ----------------------------

    await order.save();

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
    publishOrderEvent('logistics.orders', { event: 'ORDER_CREATED', data: order }).catch(e => console.error("Event Publish Error:", e.message));

    res.status(201).json({
      success: true,
      message: "Order created successfully. Routing in progress.",
      data: order,
    } as ApiResponse);
  } catch (error: any) {
    console.error("❌ Mongoose Error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({
        success: false,
        message: messages.join(". ") || "Unknown schema error occurred",
      } as ApiResponse);
      return;
    }
    res.status(400).json({
      success: false,
      message: error.message || "Unknown schema error occurred",
    } as ApiResponse);
  }
};

// GET /api/orders
export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, customerId, agentId, startDate, endDate } = req.query;

    const filter: Record<string, any> = {};
    console.log("Query Status:", req.query.status);
    if (status) {
      if (Array.isArray(status)) {
        filter.status = { $in: status };
      } else if (typeof status === 'string') {
        if (status.includes(',')) {
          filter.status = { $in: status.split(',').map(s => s.trim()) };
        } else {
          filter.status = status.trim();
        }
      }
    }
    if (customerId) filter.customerId = customerId;
    // if (agentId) filter["routing.agentId"] = new mongoose.Types.ObjectId(agentId as string); // BYPASSED FOR DEMO
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    console.log("DB Query:", filter);
    let orders = await Order.find(filter).sort({ createdAt: -1 });
    console.log("Orders Found:", orders.length);

    // DEMO FALLBACK: If querying for PICKUP_ASSIGNED and finding 0, convert the most recent order
    if (orders.length === 0 && filter.status === "PICKUP_ASSIGNED") {
        console.log("DEMO MODE: No PICKUP_ASSIGNED orders found. Forcing assignment on most recent order...");
        const recentOrder = await Order.findOne().sort({ createdAt: -1 });
        if (recentOrder) {
            recentOrder.status = OrderStatus.PICKUP_ASSIGNED;
            if (!recentOrder.routing) recentOrder.routing = {};
            if (agentId) recentOrder.routing.agentId = new mongoose.Types.ObjectId(agentId as string);
            await recentOrder.save();
            orders = [recentOrder];
            console.log(`Forced order ${recentOrder._id} to PICKUP_ASSIGNED`);
        }
    }

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
    const isValidId = mongoose.Types.ObjectId.isValid(orderId);
    const order = await Order.findOne({
      $or: [
        { _id: isValidId ? new mongoose.Types.ObjectId(orderId) : null },
        { awb: orderId },
        { trackingId: orderId }
      ]
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found.",
      } as ApiResponse);
      return;
    }

    let orderData: any = order.toObject();
    
    // God-Mode Dummy Profile Override
    if (orderData.status === 'PICKUP_ASSIGNED' || orderData.status === 'IN_TRANSIT') {
      orderData.agentProfile = {
        name: "Ramesh (Auto-Assigned)",
        phone: "+91 98765 43210"
      };
    }

    // 3. Save the result to Redis with 60s TTL
    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, 60, JSON.stringify(orderData));
      }
    } catch (redisError) {
      console.error("Redis set error:", redisError);
    }

    res.status(200).json({
      success: true,
      message: "Order retrieved successfully. (Cache Miss)",
      data: orderData,
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
                category: ["DOCUMENT", "ELECTRONICS", "CLOTHING", "FRAGILE", "LIQUID", "OTHER"].includes(row.ServiceType?.toUpperCase()) ? row.ServiceType.toUpperCase() : "OTHER",
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

export const updateOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, 
      { new: true }
    );
    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/:id/status

// PATCH /api/orders/:id/status
// PATCH /api/orders/:id/pickup-confirm

export const markAsPickedUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { actualWeight, scannedQR } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
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

    // You can validate scannedQR against order.awb here if needed
    // if (scannedQR && scannedQR !== order.awb) { ... }

    order.status = OrderStatus.PICKED_UP;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: OrderStatus.PICKED_UP,
      timestamp: new Date(),
      note: `Picked up with actual weight: ${actualWeight}kg`
    });

    await order.save();

    try {
      await producer.send({
        topic: "order.status.updated",
        messages: [{
          value: JSON.stringify({
            orderId: order._id.toString(),
            status: order.status,
            customerId: order.customerId.toString(),
            timestamp: new Date().toISOString()
          })
        }]
      });
    } catch (kafkaError) {
      console.error("Kafka Publish Failed (order.status.updated):", kafkaError);
    }

    if (redisClient.isOpen) {
      await redisClient.del(`track_order:${id}`);
    }

    res.status(200).json({ success: true, message: 'Parcel Picked Up Successfully!', data: order });
  } catch (error: any) {
    console.error("markAsPickedUp error:", error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

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

// PATCH /api/orders/:id/inward
  export const inwardOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { lengthCm, widthCm, heightCm, actualWeightKg } = req.body;
  
      const isValidId = mongoose.Types.ObjectId.isValid(id);
      const order = await Order.findOne({
        $or: [
          { _id: isValidId ? new mongoose.Types.ObjectId(id) : null },
          { awb: id },
          { trackingId: id }
        ]
      });
  
      if (!order) {
        res.status(404).json({ success: false, message: "Order not found" });
        return;
      }
  
      // Update Dimensions
      if (lengthCm && widthCm && heightCm) {
        if (!order.parcelDetails.dimensions) {
          order.parcelDetails.dimensions = { lengthCm: 0, widthCm: 0, heightCm: 0 };
        }
        order.parcelDetails.dimensions.lengthCm = Number(lengthCm);
        order.parcelDetails.dimensions.widthCm = Number(widthCm);
        order.parcelDetails.dimensions.heightCm = Number(heightCm);
        order.parcelDetails.totalVolumeCm3 = Number(lengthCm) * Number(widthCm) * Number(heightCm);
      }
  
      if (actualWeightKg) {
        order.actualWeight = Number(actualWeightKg);
      }
  
      // Calculate billing weight = max(actual, volumetric)
      const volWeight = (order.parcelDetails.totalVolumeCm3 || 0) / 5000;
      const actualWt = order.actualWeight || order.parcelDetails.weightKg || 1;
      const billingWeight = Math.max(volWeight, actualWt);
  
      // Recalculate price
      const updatedTotalAmount = calculateTotalAmount(
        order.pickupAddress.lat,
        order.pickupAddress.lng,
        order.deliveryAddress.lat,
        order.deliveryAddress.lng,
        billingWeight
      );
  
      order.totalAmount = updatedTotalAmount;
      order.status = "AT_HUB" as any;
      if (!order.statusHistory) {
        order.statusHistory = [];
      }
      order.statusHistory.push({
        status: "AT_HUB",
        timestamp: new Date(),
        note: "Inwarded at Hub with exact measurements",
      });
  
      await order.save();
  
      res.status(200).json({
        success: true,
        message: "Order inwarded successfully",
        data: order,
      });
    } catch (error: any) {
      console.error("Inward Order Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

// POST /api/orders/inward
export const inwardParcel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.body;
    if (!trackingId) {
      res.status(400).json({ success: false, message: "trackingId is required" });
      return;
    }

    const order = await Order.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(trackingId) ? new mongoose.Types.ObjectId(trackingId) : null },
        { awb: trackingId },
        { trackingId: trackingId }
      ]
    });

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (order.status !== OrderStatus.PICKED_UP) {
      res.status(400).json({ 
        success: false, 
        message: `Parcel is not ready for inwarding or already inwarded. Current status: ${order.status}` 
      });
      return;
    }

    order.status = OrderStatus.INWARDED_AT_HUB;
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: OrderStatus.INWARDED_AT_HUB,
      timestamp: new Date(),
      note: "Parcel inwarded at hub",
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: "Parcel successfully inwarded at Hub",
      data: order,
    });
  } catch (error: any) {
    console.error("Inward Parcel Error:", error);
    res.status(500).json({ success: false, message: error.message });
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
    if (order.status === "ORDER_PLACED" || order.status === "PENDING_PICKUP") {
      order.status = "PICKUP_ASSIGNED" as any;
    } else if (order.status === "INWARDED_AT_HUB") {
      order.status = "OUT_FOR_DELIVERY" as any;
    } else {
      order.status = status || "OUT_FOR_DELIVERY" as any;
    }
    
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

// POST /api/orders/settle-agent-cod
export const settleAgentCOD = async (req: Request, res: Response): Promise<void> => {
  try {
    const { agentId } = req.body;
    if (!agentId) {
      res.status(400).json({ success: false, message: "Agent ID required" } as ApiResponse);
      return;
    }

    // Find all DELIVERED COD orders for this agent that are PENDING_PAYMENT
    const orders = await Order.find({
      status: "DELIVERED",
      paymentMethod: "COD",
      paymentStatus: { $ne: "PAID" },
      "routing.agentId": new mongoose.Types.ObjectId(agentId)
    });

    if (orders.length === 0) {
      res.status(404).json({ success: false, message: "No pending COD orders found for this agent" } as ApiResponse);
      return;
    }

    const orderIds = orders.map(o => o._id);
    
    // Update them all to PAID
    await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: { paymentStatus: "PAID" as any } }
    );

    res.status(200).json({
      success: true,
      message: `Successfully settled COD cash for ${orders.length} orders.`,
      settledAmount: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    } as ApiResponse);
  } catch (error: any) {
    console.error("COD Settlement error:", error);
    res.status(500).json({ success: false, message: "Server error during settlement." } as ApiResponse);
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

