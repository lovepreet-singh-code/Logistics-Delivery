import mongoose, { Schema, Model } from "mongoose";
import { IDeliveryDocument, DeliveryStatus } from "../@types";

const deliverySchema = new Schema<IDeliveryDocument>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      required: [true, "Order ID is required"],
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(DeliveryStatus),
        message: "Status must be one of: PENDING, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED",
      },
      default: DeliveryStatus.PENDING,
    },
    currentLocation: {
      lat: {
        type: Number,
      },
      lng: {
        type: Number,
      },
    },
    proofOfDelivery: {
      type: String,
      default: null,
    },
    photoUrl: {
      type: String,
      default: null,
    },
    signatureUrl: {
      type: String,
      default: null,
    },
    manifestId: {
      type: Schema.Types.ObjectId,
      ref: "Manifest",
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

// ──── Indexes ────
deliverySchema.index({ orderId: 1 });
deliverySchema.index({ agentId: 1 });
deliverySchema.index({ status: 1 });
deliverySchema.index({ createdAt: -1 }); // Useful for getting today's deliveries

const Delivery: Model<IDeliveryDocument> = mongoose.model<IDeliveryDocument>(
  "Delivery",
  deliverySchema
);

export default Delivery;
