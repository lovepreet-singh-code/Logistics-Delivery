import mongoose, { Schema, Model } from "mongoose";
import { IVehicleDocument, VehicleStatus } from "../@types";

const vehicleSchema = new Schema<IVehicleDocument>(
  {
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    franchiseId: {
      type: Schema.Types.ObjectId,
      ref: "Franchise",
      required: [true, "Franchise ID is required"],
    },
    capacity: {
      maxWeightKg: {
        type: Number,
        required: [true, "Max weight capacity is required"],
        min: [0, "Weight capacity cannot be negative"],
      },
      maxVolumeCm3: {
        type: Number,
        required: [true, "Max volume capacity is required"],
        min: [0, "Volume capacity cannot be negative"],
      },
    },
    status: {
      type: String,
      enum: {
        values: Object.values(VehicleStatus),
        message: "Status must be one of: AVAILABLE, IN_TRANSIT, MAINTENANCE",
      },
      default: VehicleStatus.AVAILABLE,
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

// ──── Indexes for fleet queries ────
vehicleSchema.index({ franchiseId: 1, status: 1 });
vehicleSchema.index({ registrationNumber: 1 });

const Vehicle: Model<IVehicleDocument> = mongoose.model<IVehicleDocument>(
  "Vehicle",
  vehicleSchema
);

export default Vehicle;
