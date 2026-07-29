import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWarehouse {
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  capacity: number;
  currentInventory: number;
  managerId?: mongoose.Types.ObjectId;
}

export interface IWarehouseDocument extends IWarehouse, Document {}

const warehouseSchema = new Schema<IWarehouseDocument>(
  {
    name: { type: String, required: true, trim: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, required: true }
    },
    capacity: { type: Number, required: true, default: 1000 },
    currentInventory: { type: Number, required: true, default: 0 },
    managerId: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

const Warehouse: Model<IWarehouseDocument> = mongoose.model<IWarehouseDocument>(
  "Warehouse",
  warehouseSchema
);

export default Warehouse;
