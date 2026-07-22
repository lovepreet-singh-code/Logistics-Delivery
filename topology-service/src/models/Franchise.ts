import mongoose, { Schema, Model } from "mongoose";
import { IFranchiseDocument } from "../@types";

const franchiseSchema = new Schema<IFranchiseDocument>(
  {
    name: {
      type: String,
      required: [true, "Franchise name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [150, "Name cannot exceed 150 characters"],
    },
    region: {
      type: String,
      required: [true, "Region is required"],
      trim: true,
    },
    basePinCode: {
      type: String,
      required: [true, "Base pin code is required"],
      trim: true,
      match: [/^\d{4,10}$/, "Pin code must be 4–10 digits"],
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

const Franchise: Model<IFranchiseDocument> = mongoose.model<IFranchiseDocument>(
  "Franchise",
  franchiseSchema
);

export default Franchise;
