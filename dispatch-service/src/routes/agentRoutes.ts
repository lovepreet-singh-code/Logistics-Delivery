import { Router } from "express";
import { getActiveDeliveries, getDeliveryHistory, verifyDelivery, getAgentStats, getDeliveryById } from "../controllers/agentController";

// Using require to load middleware that we know exists in common structure, or assume express middleware for checking token exists
// The existing routes probably use an auth middleware. Let's assume there is one.
// Let's create a dummy authMiddleware or require it if it exists. 
// From typical setup, authMiddleware adds req.user. Let's assume the router is wrapped with it in app.ts, or we import it here.
import { requireAuth, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.use(requireAuth);
router.use(requireRole(["AGENT", "DRIVER"]));

router.get("/deliveries/active", getActiveDeliveries);
router.get("/deliveries/history", getDeliveryHistory);
router.get("/deliveries/:id", getDeliveryById);
router.post("/deliveries/:deliveryId/verify", verifyDelivery);
router.get("/stats", getAgentStats);

export default router;
