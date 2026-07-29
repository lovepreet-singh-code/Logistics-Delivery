import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDeliveryAgent {
  name: string;
  userId: mongoose.Types.ObjectId;
  assignedHubId?: mongoose.Types.ObjectId;
  vehicleId?: mongoose.Types.ObjectId;
  status: "AVAILABLE" | "BUSY" | "OFFLINE";
  rating: number;
}

export interface IDeliveryAgentDocument extends IDeliveryAgent, Document {}

const deliveryAgentSchema = new Schema<IDeliveryAgentDocument>(
  {
    name: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    assignedHubId: { type: Schema.Types.ObjectId },
    vehicleId: { type: Schema.Types.ObjectId },
    status: { type: String, enum: ["AVAILABLE", "BUSY", "OFFLINE"], default: "OFFLINE" },
    rating: { type: Number, default: 5.0, min: 1, max: 5 }
  },
  { timestamps: true }
);

const DeliveryAgent: Model<IDeliveryAgentDocument> = mongoose.model<IDeliveryAgentDocument>(
  "DeliveryAgent",
  deliveryAgentSchema
);

export default DeliveryAgent;
