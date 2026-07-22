import mongoose, { Schema, Model } from "mongoose";
import { IPincodeAreaDocument } from "../@types";

const pincodeAreaSchema = new Schema<IPincodeAreaDocument>(
  {
    pinCode: {
      type: String,
      required: [true, "Pin code is required"],
      unique: true,
      trim: true,
      match: [/^\d{4,10}$/, "Pin code must be 4–10 digits"],
    },
    franchiseId: {
      type: Schema.Types.ObjectId,
      ref: "Franchise",
      required: [true, "Franchise ID is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// ──── Index for fast lookups ────
pincodeAreaSchema.index({ pinCode: 1 });
pincodeAreaSchema.index({ franchiseId: 1 });

const PincodeArea: Model<IPincodeAreaDocument> =
  mongoose.model<IPincodeAreaDocument>("PincodeArea", pincodeAreaSchema);

export default PincodeArea;
