import { Router } from "express";
import { getAdminAnalytics } from "../controllers/analyticsController";
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
  bulkUploadOrders,
  getMyOrders,
} from "../controllers/orderController";
import multer from "multer";
import { adminAuth } from "../middleware/authMiddleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// ──── Dashboard Stats ────
router.get("/stats", getOrderStats);
router.get("/admin/analytics", getAdminAnalytics);

// ──── Order Endpoints ────
router.route("/")
  .post(createOrder)
  .get(getAllOrders);

router.post("/bulk", bulkCreateOrders);
router.post("/bulk-upload", adminAuth, upload.single("file"), bulkUploadOrders);

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
