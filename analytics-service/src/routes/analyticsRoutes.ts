import { Router } from "express";
import { getDashboardStats, exportReports } from "../controllers/analyticsController";

const router = Router();

router.get("/dashboard-stats", getDashboardStats);
router.get("/reports/export", exportReports);

export default router;
