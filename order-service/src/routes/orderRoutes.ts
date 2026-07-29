import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderStatus,
  updateOrderStatus,
  getRoutedOrdersByFranchise,
  manualAssignOrder,
  getOrderStats,
  generateInvoice,
  bulkCreateOrders,
  getMyOrders,
} from "../controllers/orderController";

const router = Router();

// ──── Dashboard Stats ────
router.get("/stats", getOrderStats);

// ──── Order Endpoints ────
router.route("/")
  .post(createOrder)
  .get(getAllOrders);

router.post("/bulk", bulkCreateOrders);

// ──── Internal API (used by Dispatch Service) ────
router.get("/routed/:franchiseId", getRoutedOrdersByFranchise);

// ──── Order Detail Endpoints ────
router.get("/my-orders", getMyOrders);
router.get("/:id", getOrderById);
router.get("/:id/invoice", generateInvoice);
router.get("/:id/status", getOrderStatus);
router.put("/:id/status", updateOrderStatus);
router.patch("/:id/status", updateOrderStatus);
router.put("/:orderId/assign", manualAssignOrder);

export default router;
