import { Router } from "express";
import { optimizeRoutes, dispatchPlan } from "../controllers/planningController";
import { authorizeRoles } from "../middleware/authMiddleware";

const router = Router();

// Assuming auth middleware is applied in server.ts or we can apply it here
router.post("/optimize", optimizeRoutes);
router.post("/dispatch", dispatchPlan);

export default router;
