import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import config from "./config";
import connectDB from "./config/database";
import { connectProducer, startConsumer, disconnectKafka, isKafkaAvailable } from "./config/kafka";
import orderRoutes from "./routes/orderRoutes";
import hubRoutes from "./routes/hubRoutes";
import serviceabilityRoutes from "./routes/serviceabilityRoutes";
import pricingRoutes from "./routes/pricingRoutes";
import { startOrderRoutedWorker } from "./workers/orderRoutedWorker";
import { startDispatchManifestedWorker } from "./workers/dispatchManifestedWorker";
import { startDeliveryCompletedWorker } from "./workers/deliveryCompletedWorker";
import { startOrderStatusWorker } from "./workers/orderStatusWorker";
import cron from "node-cron";
import { runAutoDispatchLogic } from "./controllers/orderController";

// ──── Initialize Express App ────
const app = express();


// ──── Global Middleware ────
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:8080",
  "http://127.0.0.1:8080"
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or matched origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Dev-friendly fallback
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
    "Access-Control-Allow-Origin"
  ],
}));

app.options("*", cors());
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
// ── Phase 2: CX Routes ──
app.use("/api/serviceability", serviceabilityRoutes);
app.use("/api/pricing", pricingRoutes);

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

  // ──── Connect Kafka (Graceful Degradation) ────
  try {
    await connectProducer();
    if (isKafkaAvailable) {
      await startConsumer();
      console.log("Kafka connected successfully.");
    }
  } catch (err) {
    console.warn("[KAFKA WARNING] Broker not ready, running in degraded mode");
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

  // ──── Start Background Workers (Non-blocking & Graceful) ────
  if (isKafkaAvailable) {
    startOrderRoutedWorker().catch(() => console.warn("[KAFKA WARNING] Order Routed worker running in degraded mode"));
    startDispatchManifestedWorker().catch(() => console.warn("[KAFKA WARNING] Dispatch Manifested worker running in degraded mode"));
    startDeliveryCompletedWorker().catch(() => console.warn("[KAFKA WARNING] Delivery Completed worker running in degraded mode"));
    startOrderStatusWorker().catch(() => console.warn("[KAFKA WARNING] Order Status worker running in degraded mode"));
  } else {
    console.warn("[KAFKA WARNING] Skipping background Kafka workers, running in degraded mode");
  }

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

  process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err);
  });

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();

export default app;
