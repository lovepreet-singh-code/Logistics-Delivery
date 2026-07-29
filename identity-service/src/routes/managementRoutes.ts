import { Router } from "express";
import {
  createAgent,
  getAgents,
  getAgentById,
  updateAgent,
  deleteAgent
} from "../controllers/agentController";
import {
  createManager,
  getManagers,
  getManagerById,
  updateManager,
  deleteManager
} from "../controllers/managerController";
import { protect, authorizeRoles } from "../middlewares/authMiddleware";
import { UserRole } from "../@types";

const router = Router();

// Protect all management routes
router.use(protect);
router.use(authorizeRoles(UserRole.ADMIN, UserRole.MANAGER));

// ──── Delivery Agents ────
router.route("/agents")
  .post(authorizeRoles(UserRole.ADMIN), createAgent) // Only Admin can create agents
  .get(getAgents);

router.route("/agents/:id")
  .get(getAgentById)
  .put(authorizeRoles(UserRole.ADMIN), updateAgent)
  .delete(authorizeRoles(UserRole.ADMIN), deleteAgent);

// ──── Managers ────
router.route("/managers")
  .post(authorizeRoles(UserRole.ADMIN), createManager)
  .get(getManagers);

router.route("/managers/:id")
  .get(getManagerById)
  .put(authorizeRoles(UserRole.ADMIN), updateManager)
  .delete(authorizeRoles(UserRole.ADMIN), deleteManager);

export default router;
