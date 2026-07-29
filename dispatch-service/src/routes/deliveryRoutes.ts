import { Router } from "express";
import {
  getDeliveries,
  getDeliveriesToday,
  startDelivery,
  completeDelivery,
  updateLocation,
  uploadProof,
} from "../controllers/deliveryController";

const router = Router();

// GET /api/deliveries
router.get("/", getDeliveries);

// GET /api/deliveries/today
router.get("/today", getDeliveriesToday);

// PATCH /api/deliveries/:id/start
router.patch("/:id/start", startDelivery);

// PATCH /api/deliveries/:id/complete
router.patch("/:id/complete", completeDelivery);

// PATCH /api/deliveries/:id/location
router.patch("/:id/location", updateLocation);

// POST /api/deliveries/proof
router.post("/proof", uploadProof);

export default router;
