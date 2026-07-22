import { Types, Document } from "mongoose";

// ──── Franchise ────
export interface IFranchise {
  _id: Types.ObjectId;
  name: string;
  region: string;
  basePinCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFranchiseDocument extends Omit<IFranchise, "_id">, Document {}

// ──── PincodeArea ────
export interface IPincodeArea {
  _id: Types.ObjectId;
  pinCode: string;
  franchiseId: Types.ObjectId;
  city: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPincodeAreaDocument extends Omit<IPincodeArea, "_id">, Document {}

// ──── Serviceability Check Response ────
export interface IServiceabilityResult {
  pinCode: string;
  city: string;
  isActive: boolean;
  franchise: {
    id: string;
    name: string;
    region: string;
    basePinCode: string;
  };
}

// ──── Kafka Event: Order Created ────
export interface IOrderCreatedEvent {
  orderId: string;
  pickupPinCode: string;
  deliveryPinCode: string;
  customerId: string;
  timestamp: string;
}

// ──── Kafka Event: Order Routed ────
export interface IOrderRoutedEvent {
  orderId: string;
  originFranchiseId: string;
  destinationFranchiseId: string;
  isInterFranchise: boolean;
  timestamp: string;
}

// ──── API Response Envelope ────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  count?: number;
}
