import mongoose, { Schema, Model } from "mongoose";
import { IOrderDocument, OrderStatus, PaymentStatus } from "../@types";

// ──── Address Sub-schema ────
const addressSchema = new Schema(
  {
    pinCode: {
      type: String,
      required: [true, "Pin code is required"],
      trim: true,
    },
    lat: {
      type: Number,
      required: [true, "Latitude is required"],
    },
    lng: {
      type: Number,
      required: [true, "Longitude is required"],
    },
    fullAddress: {
      type: String,
      required: [true, "Full address is required"],
      trim: true,
    },
    senderName: { type: String },
    senderPhone: { type: String },
    receiverName: { type: String },
    receiverPhone: { type: String },
  },
  { _id: false }
);

// ──── Dimensions Sub-schema ────
const dimensionsSchema = new Schema(
  {
    lengthCm: {
      type: Number,
      min: [0, "Length cannot be negative"],
      required: [true, "Length is required"],
    },
    widthCm: {
      type: Number,
      min: [0, "Width cannot be negative"],
      required: [true, "Width is required"],
    },
    heightCm: {
      type: Number,
      min: [0, "Height cannot be negative"],
      required: [true, "Height is required"],
    },
  },
  { _id: false }
);

// ──── Parcel Details Sub-schema ────
const parcelDetailsSchema = new Schema(
  {
    weightKg: {
      type: Number,
      required: [true, "Weight is required"],
      min: [0, "Weight cannot be negative"],
    },
    declaredValue: {
      type: Number,
      required: [true, "Declared value is required"],
      min: [0, "Declared value cannot be negative"]
    },
    restrictedItemsConfirmed: {
      type: Boolean,
      required: [true, "You must confirm restricted items compliance"],
      validate: {
        validator: function(v: boolean) {
          return v === true;
        },
        message: "You must confirm that the parcel contains no restricted or hazardous items."
      }
    },
    dimensions: {
      type: dimensionsSchema,
      required: [true, "Dimensions are required"]
    },
    totalVolumeCm3: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      enum: ['DOCUMENT', 'ELECTRONICS', 'CLOTHING', 'FRAGILE', 'LIQUID', 'OTHER'],
      required: [true, "Category is required"],
    },
  },
  { _id: false }
);

// ──── Routing Sub-schema ────
const routingSchema = new Schema(
  {
    originFranchiseId: {
      type: Schema.Types.ObjectId,
      ref: "Franchise",
      default: null,
    },
    destinationFranchiseId: {
      type: Schema.Types.ObjectId,
      ref: "Franchise",
      default: null,
    },
    isInterFranchise: {
      type: Boolean,
      default: null,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
    assignmentType: {
      type: String,
      default: null,
    },
    vehicleNumber: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

// ──── Order Schema ────
const orderSchema = new Schema<IOrderDocument>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
    },
    awb: {
      type: String,
      unique: true,
    },
    pickupAddress: {
      type: addressSchema,
      required: [true, "Pickup address is required"],
    },
    deliveryAddress: {
      type: addressSchema,
      required: [true, "Delivery address is required"],
    },
    parcelDetails: {
      type: parcelDetailsSchema,
      required: [true, "Parcel details are required"],
    },
    routing: {
      type: routingSchema,
      default: () => ({}),
    },
    pickupDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(OrderStatus),
        message: "Status must be one of the valid OrderStatus enum values",
      },
      default: OrderStatus.ORDER_PLACED,
    },
    paymentMethod: {
      type: String,
      enum: ["PREPAID", "COD"],
      default: "PREPAID",
    },
    exceptionReason: {
      type: String,
      default: null,
    },
    rtoImageUrl: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING_PAYMENT,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    otp: {
      type: String,
      default: () => Math.floor(100000 + Math.random() * 900000).toString(),
    },
    pickupOtp: {
      type: String,
      default: () => Math.floor(100000 + Math.random() * 900000).toString(),
    },
    pickupImageUrl: {
      type: String,
      default: null,
    },
    actualWeight: {
      type: Number,
      default: null,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        updatedBy: { type: String }, // e.g., 'ADMIN', 'SYSTEM', or userId
        timestamp: { type: Date, default: Date.now },
        note: { type: String }
      }
    ],
    proofOfDeliverySignature: {
      type: String,
      default: null,
    },
    podImageUrl: {
      type: String,
      default: null,
    },
    sequenceOrder: {
      type: Number,
      default: null,
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ──── Pre-save Hook: Auto-calculate totalVolumeCm3 ────
orderSchema.pre<IOrderDocument>("save", function (next) {
  if (this.parcelDetails?.dimensions) {
    const { lengthCm, widthCm, heightCm } = this.parcelDetails.dimensions;
    if (lengthCm && widthCm && heightCm) {
      this.parcelDetails.totalVolumeCm3 = lengthCm * widthCm * heightCm;
    } else {
      this.parcelDetails.totalVolumeCm3 = 0;
    }
  }
  next();
});

// ──── Indexes ────
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "routing.originFranchiseId": 1 });
orderSchema.index({ "routing.destinationFranchiseId": 1 });
orderSchema.index({ createdAt: -1 });

const Order: Model<IOrderDocument> = mongoose.model<IOrderDocument>(
  "Order",
  orderSchema
);

export default Order;
