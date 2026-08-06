import { Types, Document } from "mongoose";

// ──── Order Status ────
export enum OrderStatus {
  ORDER_PLACED = "ORDER_PLACED",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  DESTINATION_HUB = "DESTINATION_HUB",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
}

// ──── Address Sub-document ────
export interface IAddress {
  pinCode: string;
  lat: number;
  lng: number;
  fullAddress: string;
  senderName?: string;
  senderPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
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
  parcelType?: string; // Enum: Document, Box, Electronics, Fragile
  declaredValue?: number;
}

// ──── Routing Info ────
export interface IRouting {
  originFranchiseId?: Types.ObjectId;
  destinationFranchiseId?: Types.ObjectId;
  isInterFranchise?: boolean;
  agentId?: Types.ObjectId;
  vehicleId?: Types.ObjectId;
  assignmentType?: string;
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
  paymentStatus?: PaymentStatus;
  otp?: string;
  statusHistory?: {
    status: string;
    updatedBy?: string;
    timestamp?: Date;
    note?: string;
  }[];
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

// ──── Kafka Event: Dispatch Manifested ────
export interface IDispatchManifestedEvent {
  manifestId: string;
  franchiseId: string;
  vehicleId: string;
  orderIds: string[];
  timestamp: string;
}

// ──── Kafka Event: Delivery Completed ────
export interface IDeliveryCompletedEvent {
  orderId: string;
  agentId?: string;
  status: string;
  proofOfDelivery?: string;
  timestamp: string;
}

// ──── API Response Envelope ────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  count?: number;
}
