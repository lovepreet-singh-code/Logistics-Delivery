import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import config from "./config";
import connectDB from "./config/database";
import authRoutes from "./routes/authRoutes";
import managementRoutes from "./routes/managementRoutes";

// ──── Initialize Express App ────
const app = express();

// ──── Global Middleware ────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
}

// ──── Health Check ────
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Identity Service is running.",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ──── API Routes ────
app.use("/api/auth", authRoutes);
app.use("/api/management", managementRoutes);

// ──── 404 Handler ────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

import User from "./models/User";
import { UserRole } from "./@types";

const seedUsers = async () => {
  try {
    const adminExists = await User.findOne({ email: "admin@example.com" });
    if (!adminExists) {
      await User.create({ name: "Admin User", email: "admin@example.com", password: "password", role: UserRole.ADMIN });
      console.log("🌱 Seeded Admin User");
    }
    const driverExists = await User.findOne({ email: "driver@example.com" });
    if (!driverExists) {
      await User.create({ name: "Driver User", email: "driver@example.com", password: "password", role: UserRole.AGENT });
      console.log("🌱 Seeded Driver User");
    }
    const customerExists = await User.findOne({ email: "custmore@example.com" });
    if (!customerExists) {
      await User.create({ name: "Customer User", email: "custmore@example.com", password: "password", role: UserRole.CUSTOMER });
      console.log("🌱 Seeded Customer User");
    }
  } catch (error) {
    console.error("Error seeding users:", error);
  }
};

// ──── Start Server ────
const startServer = async (): Promise<void> => {
  await connectDB();
  await seedUsers();

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║   🚀  Identity Service                  ║
    ║   📡  Port: ${String(config.port).padEnd(27)}║
    ║   🌍  Env:  ${config.nodeEnv.padEnd(27)}║
    ╚══════════════════════════════════════════╝
    `);
  });
};

startServer();

export default app;
