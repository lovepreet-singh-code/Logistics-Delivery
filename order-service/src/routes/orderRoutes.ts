import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderStatus,
} from "../controllers/orderController";

const router = Router();

// ──── Order Endpoints ────
router.route("/")
  .post(createOrder)
  .get(getAllOrders);

router.get("/:id", getOrderById);
router.get("/:id/status", getOrderStatus);

export default router;
