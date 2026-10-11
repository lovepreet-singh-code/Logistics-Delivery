import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserDocument extends Document {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  availabilityStatus?: string;
  vehicleNumber?: string;
  [key: string]: any;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String },
    email: { type: String },
    role: { type: String },
    status: { type: String },
    availabilityStatus: { type: String },
    vehicleNumber: { type: String },
  },
  { strict: false, timestamps: true }
);

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema, "users");

export default User;
