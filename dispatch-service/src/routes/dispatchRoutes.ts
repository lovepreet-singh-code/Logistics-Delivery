import { Router } from "express";
import {
  runDispatch,
  getAllManifests,
  getManifestById,
  getAgentManifest,
} from "../controllers/dispatchController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// ──── Dispatch Engine ────
router.post("/run/:franchiseId", runDispatch);

// ──── Manifest Endpoints ────
router.get("/agent/manifest", requireAuth, getAgentManifest);
router.get("/manifests", getAllManifests);
router.get("/manifests/:id", getManifestById);

export default router;
