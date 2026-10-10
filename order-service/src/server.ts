import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import config from "./config";
import connectDB from "./config/database";
import { connectProducer, startConsumer, disconnectKafka } from "./config/kafka";
import orderRoutes from "./routes/orderRoutes";
import hubRoutes from "./routes/hubRoutes";
import { startOrderRoutedWorker } from "./workers/orderRoutedWorker";
import { startDispatchManifestedWorker } from "./workers/dispatchManifestedWorker";
import { startDeliveryCompletedWorker } from "./workers/deliveryCompletedWorker";
import { startOrderStatusWorker } from "./workers/orderStatusWorker";
import cron from "node-cron";
import { runAutoDispatchLogic } from "./controllers/orderController";

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
    message: "Order Service is running.",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ──── API Routes ────
app.use("/api/orders", orderRoutes);
app.use("/api/hubs", hubRoutes);

// ──── 404 Handler ────
app.use((req: Request, res: Response) => {
  console.log(`[404] Unhandled route: ${req.method} ${req.originalUrl} | Path: ${req.path}`);
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// ──── Start Server ────
const startServer = async (): Promise<void> => {
  await connectDB();

  // ──── Connect Kafka ────
  try {
    await connectProducer();
    await startConsumer();
    console.log("Kafka connected successfully.");
  } catch (err) {
    console.error("Kafka connection failed. Running without Kafka...", err);
  }

  const httpServer = require("http").createServer(app);
  const { Server } = require("socket.io");
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/socket.io/"
  });

  io.on("connection", (socket: any) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    socket.on("joinTrackingRoom", (trackingId: string) => {
      socket.join(`room:${trackingId}`);
      console.log(`[Socket] Client ${socket.id} joined room:room:${trackingId}`);
    });

    socket.on("agentLocationUpdate", (data: { trackingId: string, lat: number, lng: number }) => {
      io.to(`room:${data.trackingId}`).emit("driverLocationUpdated", { lat: data.lat, lng: data.lng });
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  const server = httpServer.listen(config.port, '0.0.0.0', () => {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║   📦  Order Service (with Socket.io)    ║
    ║   📡  Port: ${String(config.port).padEnd(27)}║
    ║   🌍  Env:  ${config.nodeEnv.padEnd(27)}║
    ╚══════════════════════════════════════════╝
    `);
  });

  // ──── Start Background Workers (Non-blocking) ────
  startOrderRoutedWorker().catch(e => console.error("Worker failed", e));
  startDispatchManifestedWorker().catch(e => console.error("Worker failed", e));
  startDeliveryCompletedWorker().catch(e => console.error("Worker failed", e));
  startOrderStatusWorker().catch(e => console.error("Worker failed", e));

  // ──── Zero-Touch Auto-Dispatch Cron Job ────
  cron.schedule('*/1 * * * *', async () => {
    console.log(`[CRON] Starting Auto-Dispatch check at ${new Date().toISOString()}`);
    try {
      const assigned = await runAutoDispatchLogic();
      if (assigned > 0) {
        console.log(`[CRON] ⚡ Auto-Dispatch executed: ${assigned} orders assigned.`);
      }
      console.log(`[CRON] Finished Auto-Dispatch check.`);
    } catch (error) {
      console.error("[CRON] Auto-Dispatch failed:", error);
    }
  });
  console.log("[CRON] Scheduled Zero-Touch Auto-Dispatch Engine (Runs every 1 min).");

  const shutdown = async () => {
    console.log("Shutting down server gracefully...");
    server.close();
    await disconnectKafka();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();

export default app;
