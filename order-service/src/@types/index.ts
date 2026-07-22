import { Types, Document } from "mongoose";

// ──── Order Status ────
export enum OrderStatus {
  PENDING = "PENDING",
  ROUTED = "ROUTED",
  MANIFESTED = "MANIFESTED",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
}

// ──── Address Sub-document ────
export interface IAddress {
  pinCode: string;
  lat: number;
  lng: number;
  fullAddress: string;
}

// ──── Parcel Dimensions ────
export interface IDimensions {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

// ──── Parcel Details ────
export interface IParcelDetails {
  weightKg: number;
  dimensions: IDimensions;
  totalVolumeCm3: number;
}

// ──── Routing Info ────
export interface IRouting {
  originFranchiseId?: Types.ObjectId;
  destinationFranchiseId?: Types.ObjectId;
  isInterFranchise?: boolean;
}

// ──── Order ────
export interface IOrder {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  pickupAddress: IAddress;
  deliveryAddress: IAddress;
  parcelDetails: IParcelDetails;
  routing: IRouting;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDocument extends Omit<IOrder, "_id">, Document {}

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
