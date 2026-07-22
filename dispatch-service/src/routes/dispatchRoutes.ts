import { Router } from "express";
import {
  runDispatch,
  getAllManifests,
  getManifestById,
} from "../controllers/dispatchController";

const router = Router();

// ──── Dispatch Engine ────
router.post("/run/:franchiseId", runDispatch);

// ──── Manifest Endpoints ────
router.get("/manifests", getAllManifests);
router.get("/manifests/:id", getManifestById);

export default router;
