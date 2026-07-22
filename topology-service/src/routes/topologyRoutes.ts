import { Router } from "express";
import {
  createFranchise,
  getAllFranchises,
  getFranchiseById,
  updateFranchise,
  deleteFranchise,
  createPincode,
  getAllPincodes,
  getPincodeById,
  updatePincode,
  deletePincode,
  checkServiceability,
} from "../controllers/topologyController";

const router = Router();

// ──── Serviceability Check ────
router.get("/check/:pinCode", checkServiceability);

// ──── Franchise CRUD ────
router.route("/franchises")
  .post(createFranchise)
  .get(getAllFranchises);

router.route("/franchises/:id")
  .get(getFranchiseById)
  .put(updateFranchise)
  .delete(deleteFranchise);

// ──── Pincode Area CRUD ────
router.route("/pincodes")
  .post(createPincode)
  .get(getAllPincodes);

router.route("/pincodes/:id")
  .get(getPincodeById)
  .put(updatePincode)
  .delete(deletePincode);

export default router;
