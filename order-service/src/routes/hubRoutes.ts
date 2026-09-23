import { Router } from "express";
import {
  createHub,
  getAllHubs,
  updateHubPincodes,
  toggleHubStatus
} from "../controllers/hubController";

const router = Router();

router.post("/", createHub);
router.get("/", getAllHubs);
router.put("/:id/pincodes", updateHubPincodes);
router.patch("/:id/status", toggleHubStatus);

export default router;
