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
  .post(authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), createAgent) // Managers check hubId in controller
  .get(getAgents);

router.route("/agents/:id")
  .get(getAgentById)
  .put(authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), updateAgent)
  .delete(authorizeRoles(UserRole.ADMIN), deleteAgent);

// ──── Managers ────
router.route("/managers")
  .post(authorizeRoles(UserRole.ADMIN), createManager)
  .get(getManagers);

router.route("/managers/:id")
  .get(getManagerById)
  .put(authorizeRoles(UserRole.ADMIN), updateManager)
  .delete(authorizeRoles(UserRole.ADMIN), deleteManager);

import {
  getUsers,
  updateUserStatus,
  deleteUser
} from "../controllers/userController";

// ──── Users (General) ────
router.route("/users")
  .get(authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), getUsers);

router.route("/users/:id/status")
  .patch(authorizeRoles(UserRole.ADMIN, UserRole.MANAGER), updateUserStatus);

router.route("/users/:id")
  .delete(authorizeRoles(UserRole.ADMIN), deleteUser);

export default router;
