import { Request } from "express";
import { Types } from "mongoose";

// ──── User Roles ────
export enum UserRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  AGENT = "AGENT",
  CUSTOMER = "CUSTOMER",
}

// ──── User Document Interface ────
export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ──── JWT Payload ────
export interface IJwtPayload {
  id: string;
  role: UserRole;
}

// ──── Authenticated Request ────
export interface AuthRequest extends Request {
  user?: IUser;
}

// ──── API Response Envelope ────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}
