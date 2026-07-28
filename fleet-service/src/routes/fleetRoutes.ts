import { Router } from "express";
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getAvailableVehiclesByFranchise,
  getFleetStats,
} from "../controllers/fleetController";

const router = Router();

// ──── Available Vehicles by Franchise (capacity planning) ────
router.get("/franchise/:franchiseId/available", getAvailableVehiclesByFranchise);

// ──── Fleet Stats (Admin Dashboard) ────
router.get("/stats", getFleetStats);

// ──── Vehicle CRUD ────
router.route("/vehicles")
  .post(createVehicle)
  .get(getAllVehicles);

router.route("/vehicles/:id")
  .get(getVehicleById)
  .put(updateVehicle)
  .delete(deleteVehicle);

export default router;
