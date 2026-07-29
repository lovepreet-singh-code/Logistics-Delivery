import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import config from "./config";
import connectDB from "./config/database";
import { producer } from "./config/kafka";
import dispatchRoutes from "./routes/dispatchRoutes";
import deliveryRoutes from "./routes/deliveryRoutes";
import { startDailyDispatchCron } from "./cron/dailyDispatch";

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
    message: "Dispatch Service is running.",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ──── API Routes ────
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/deliveries", deliveryRoutes);

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

  // ──── Connect Kafka Producer ────
  await producer.connect();
  console.log("✅ Kafka producer connected (dispatch-service)");

  // ──── Start Daily Dispatch Cron ────
  startDailyDispatchCron();

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║   📋  Dispatch Service                  ║
    ║   📡  Port: ${String(config.port).padEnd(27)}║
    ║   🌍  Env:  ${config.nodeEnv.padEnd(27)}║
    ╚══════════════════════════════════════════╝
    `);
  });
};

startServer();

export default app;
