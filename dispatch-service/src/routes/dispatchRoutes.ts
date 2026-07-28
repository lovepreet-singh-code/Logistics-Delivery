import { Router } from "express";
import {
  runDispatch,
  getAllManifests,
  getManifestById,
  getAgentManifest,
  createMockManifest,
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

export default router;
