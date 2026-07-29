import { Router } from "express";
import {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse
} from "../controllers/warehouseController";

const router = Router();

router.route("/")
  .post(createWarehouse)
  .get(getWarehouses);

router.route("/:id")
  .get(getWarehouseById)
  .put(updateWarehouse)
  .delete(deleteWarehouse);

export default router;
