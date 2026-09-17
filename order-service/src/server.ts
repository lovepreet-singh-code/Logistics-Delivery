import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import config from "./config";
import connectDB from "./config/database";
import { connectProducer, startConsumer, disconnectKafka } from "./config/kafka";
import orderRoutes from "./routes/orderRoutes";
import { startOrderRoutedWorker } from "./workers/orderRoutedWorker";
import { startDispatchManifestedWorker } from "./workers/dispatchManifestedWorker";
import { startDeliveryCompletedWorker } from "./workers/deliveryCompletedWorker";
import { startOrderStatusWorker } from "./workers/orderStatusWorker";

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

// ──── 404 Handler ────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// ──── Start Server ────
const startServer = async (): Promise<void> => {
  await connectDB();

  // ──── Connect Kafka ────
  await connectProducer();
  await startConsumer();

  // ──── Start Background Workers ────
  await startOrderRoutedWorker();
  await startDispatchManifestedWorker();
  await startDeliveryCompletedWorker();
  await startOrderStatusWorker();

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

    socket.on("join-room", (orderId: string) => {
      socket.join(`room:${orderId}`);
      console.log(`[Socket] Client ${socket.id} joined room:room:${orderId}`);
    });

    socket.on("update-location", (data: { orderId: string, lat: number, lng: number }) => {
      io.to(`room:${data.orderId}`).emit("location-updated", { lat: data.lat, lng: data.lng });
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
