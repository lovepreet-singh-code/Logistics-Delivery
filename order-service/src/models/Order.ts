import mongoose, { Schema, Model } from "mongoose";
import { IOrderDocument, OrderStatus } from "../@types";

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
  },
  { _id: false }
);

// ──── Dimensions Sub-schema ────
const dimensionsSchema = new Schema(
  {
    lengthCm: {
      type: Number,
      required: [true, "Length is required"],
      min: [0, "Length cannot be negative"],
    },
    widthCm: {
      type: Number,
      required: [true, "Width is required"],
      min: [0, "Width cannot be negative"],
    },
    heightCm: {
      type: Number,
      required: [true, "Height is required"],
      min: [0, "Height cannot be negative"],
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
    dimensions: {
      type: dimensionsSchema,
      required: [true, "Dimensions are required"],
    },
    totalVolumeCm3: {
      type: Number,
      default: 0,
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
    status: {
      type: String,
      enum: {
        values: Object.values(OrderStatus),
        message: "Status must be one of: PENDING, ROUTED, MANIFESTED, IN_TRANSIT, DELIVERED",
      },
      default: OrderStatus.PENDING,
    },
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
    this.parcelDetails.totalVolumeCm3 = lengthCm * widthCm * heightCm;
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
