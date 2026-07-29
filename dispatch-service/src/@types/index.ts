import { Types, Document } from "mongoose";

// ──── Manifest Status ────
export enum ManifestStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
}

// ──── Delivery Status ────
export enum DeliveryStatus {
  PENDING = "PENDING",
  ASSIGNED = "ASSIGNED",
  IN_TRANSIT = "IN_TRANSIT",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
}

// ──── Route Sequence Entry ────
export interface IRouteSequenceEntry {
  orderId: Types.ObjectId;
  lat: number;
  lng: number;
}

// ──── Manifest ────
export interface IManifest {
  _id: Types.ObjectId;
  franchiseId: Types.ObjectId;
  vehicleId: Types.ObjectId;
  agentId?: Types.ObjectId;
  routeSequence: IRouteSequenceEntry[];
  loadingSequence: Types.ObjectId[];
  status: ManifestStatus;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IManifestDocument extends Omit<IManifest, "_id">, Document {}

// ──── Delivery ────
export interface IDelivery {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  agentId?: Types.ObjectId;
  status: DeliveryStatus;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  proofOfDelivery?: string;
  photoUrl?: string;
  signatureUrl?: string;
  manifestId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeliveryDocument extends Omit<IDelivery, "_id">, Document {}

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

// ──── External API Types (from other services) ────
export interface IExternalOrder {
  _id: string;
  customerId: string;
  pickupAddress: {
    pinCode: string;
    lat: number;
    lng: number;
    fullAddress: string;
  };
  deliveryAddress: {
    pinCode: string;
    lat: number;
    lng: number;
    fullAddress: string;
  };
  parcelDetails: {
    weightKg: number;
    dimensions: {
      lengthCm: number;
      widthCm: number;
      heightCm: number;
    };
    totalVolumeCm3: number;
  };
  routing: {
    originFranchiseId: string;
    destinationFranchiseId: string;
    isInterFranchise: boolean;
  };
  status: string;
}

export interface IExternalVehicle {
  _id: string;
  registrationNumber: string;
  franchiseId: string;
  capacity: {
    maxWeightKg: number;
    maxVolumeCm3: number;
  };
  status: string;
}

// ──── Dispatch Engine Result ────
export interface IManifestResult {
  vehicleId: string;
  registrationNumber: string;
  ordersAssigned: number;
  weightUtilization: string;
  volumeUtilization: string;
  manifestId: string;
}

// ──── API Response Envelope ────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  count?: number;
}
