import { Router } from "express";
import {
  runDispatch,
  getAllManifests,
  getManifestById,
  getAgentManifest,
  createMockManifest,
  assignDriver,
  assignVehicle
} from "../controllers/dispatchController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// ──── Dispatch Engine ────
router.post("/run/:franchiseId", runDispatch);

// ──── Debug Endpoints ────
router.post("/debug/create-mock-manifest", createMockManifest);

// ──── Manifest Endpoints ────
router.get("/agent/manifest", requireAuth, getAgentManifest);
router.get("/manifests", getAllManifests);
router.get("/manifests/:id", getManifestById);

// ──── Manual Assignments ────
router.post("/assign-driver", requireAuth, assignDriver);
router.post("/assign-vehicle", requireAuth, assignVehicle);

export default router;
