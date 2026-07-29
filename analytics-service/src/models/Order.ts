import mongoose, { Schema, Document, Model } from "mongoose";

// Simplified Schema for Analytics purposes
const orderSchema = new Schema(
  {
    orderId: { type: String, required: true },
    sender: { name: String, phone: String, address: String },
    receiver: { name: String, phone: String, address: String },
    status: { type: String, required: true },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        description: { type: String },
      },
    ],
    metadata: {
      weight: { type: Number, required: true },
      dimensions: {
        length: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
      },
    },
    pricing: {
      basePrice: { type: Number, required: true },
      tax: { type: Number, required: true },
      total: { type: Number, required: true },
    },
    paymentStatus: { type: String, required: true },
    franchiseId: { type: Schema.Types.ObjectId },
    driverId: { type: Schema.Types.ObjectId },
    vehicleId: { type: Schema.Types.ObjectId },
    estimatedDeliveryTime: { type: Date },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
