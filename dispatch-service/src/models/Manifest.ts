import mongoose, { Schema, Model } from "mongoose";
import { IManifestDocument, ManifestStatus } from "../@types";

// ──── Route Sequence Sub-schema ────
const routeSequenceSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order ID is required"],
    },
    lat: {
      type: Number,
      required: [true, "Latitude is required"],
    },
    lng: {
      type: Number,
      required: [true, "Longitude is required"],
    },
  },
  { _id: false }
);

// ──── Manifest Schema ────
const manifestSchema = new Schema<IManifestDocument>(
  {
    franchiseId: {
      type: Schema.Types.ObjectId,
      ref: "Franchise",
      required: [true, "Franchise ID is required"],
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle ID is required"],
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    routeSequence: {
      type: [routeSequenceSchema],
      default: [],
    },
    loadingSequence: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(ManifestStatus),
        message: "Status must be one of: PENDING, ACTIVE, COMPLETED",
      },
      default: ManifestStatus.PENDING,
    },
    date: {
      type: Date,
      required: [true, "Manifest date is required"],
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

// ──── Indexes ────
manifestSchema.index({ franchiseId: 1, date: -1 });
manifestSchema.index({ vehicleId: 1 });
manifestSchema.index({ status: 1 });

const Manifest: Model<IManifestDocument> = mongoose.model<IManifestDocument>(
  "Manifest",
  manifestSchema
);

export default Manifest;
