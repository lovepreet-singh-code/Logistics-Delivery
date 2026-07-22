import { Types, Document } from "mongoose";

// ──── Vehicle Status ────
export enum VehicleStatus {
  AVAILABLE = "AVAILABLE",
  IN_TRANSIT = "IN_TRANSIT",
  MAINTENANCE = "MAINTENANCE",
}

// ──── Vehicle Capacity ────
export interface IVehicleCapacity {
  maxWeightKg: number;
  maxVolumeCm3: number;
}

// ──── Vehicle ────
export interface IVehicle {
  _id: Types.ObjectId;
  registrationNumber: string;
  franchiseId: Types.ObjectId;
  capacity: IVehicleCapacity;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVehicleDocument extends Omit<IVehicle, "_id">, Document {}

// ──── API Response Envelope ────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  count?: number;
}
