import mongoose, { Schema, Model, Document, Types } from "mongoose";

// A minimal Order schema for dispatch-service to allow population
// It only contains the fields necessary for the dispatch service read operations.

interface IAddress {
  pinCode: string;
  lat: number;
  lng: number;
  fullAddress: string;
}

interface IOrderDocument extends Document {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  pickupAddress: IAddress;
  deliveryAddress: IAddress;
  status: string;
  customerPhone?: string;
}

const addressSchema = new Schema(
  {
    street: String,
    city: String,
    pincode: String,
    pinCode: String,
    lat: Number,
    lng: Number,
    fullAddress: String,
  },
  { _id: false }
);

const orderSchema = new Schema<IOrderDocument>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    pickupAddress: addressSchema,
    deliveryAddress: addressSchema,
    status: String,
    customerPhone: String,
  },
  {
    timestamps: true,
  }
);

// We define this so mongoose knows about the "Order" collection.
const Order: Model<IOrderDocument> = mongoose.model<IOrderDocument>("Order", orderSchema);

export default Order;
