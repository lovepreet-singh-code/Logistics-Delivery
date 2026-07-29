import { Router } from "express";
import {
  getDeliveries,
  getDeliveriesToday,
  startDelivery,
  completeDelivery,
  updateDeliveryStatus,
  updateLocation,
  uploadProof,
} from "../controllers/deliveryController";

import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// GET /api/deliveries
router.get("/", getDeliveries);

// GET /api/deliveries/today
router.get("/today", requireAuth, getDeliveriesToday);

// PATCH /api/deliveries/:id/start
router.patch("/:id/start", startDelivery);

// PATCH /api/deliveries/:id/complete
router.patch("/:id/complete", completeDelivery);

// PATCH /api/deliveries/:id
router.patch("/:id", updateDeliveryStatus);

// PATCH /api/deliveries/:id/location
router.patch("/:id/location", updateLocation);

// POST /api/deliveries/proof
router.post("/proof", uploadProof);

export default router;
