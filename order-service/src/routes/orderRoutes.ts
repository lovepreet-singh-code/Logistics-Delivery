import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderStatus,
  updateOrderStatus,
  getRoutedOrdersByFranchise,
} from "../controllers/orderController";

const router = Router();

// ──── Order Endpoints ────
router.route("/")
  .post(createOrder)
  .get(getAllOrders);

// ──── Internal API (used by Dispatch Service) ────
router.get("/routed/:franchiseId", getRoutedOrdersByFranchise);

// ──── Order Detail Endpoints ────
router.get("/:id", getOrderById);
router.get("/:id/status", getOrderStatus);
router.put("/:id/status", updateOrderStatus);

export default router;
