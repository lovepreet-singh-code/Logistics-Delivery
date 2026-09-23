import mongoose, { Document, Schema } from "mongoose";

export interface IHub extends Document {
  hubName: string;
  hubCode: string;
  managerName: string;
  contactNumber: string;
  serviceablePincodes: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hubSchema: Schema = new Schema(
  {
    hubName: {
      type: String,
      required: true,
      trim: true,
    },
    hubCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    managerName: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    serviceablePincodes: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Hub || mongoose.model<IHub>("Hub", hubSchema);
