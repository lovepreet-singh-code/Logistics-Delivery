import mongoose, { Schema, Document, Model } from "mongoose";

export interface IManager {
  name: string;
  userId: mongoose.Types.ObjectId;
  managedHubId?: mongoose.Types.ObjectId;
  region: string;
}

export interface IManagerDocument extends IManager, Document {}

const managerSchema = new Schema<IManagerDocument>(
  {
    name: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    managedHubId: { type: Schema.Types.ObjectId },
    region: { type: String, required: true, default: "Global" }
  },
  { timestamps: true }
);

const Manager: Model<IManagerDocument> = mongoose.model<IManagerDocument>(
  "Manager",
  managerSchema
);

export default Manager;
