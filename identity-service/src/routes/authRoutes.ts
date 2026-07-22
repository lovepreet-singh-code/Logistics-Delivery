import { Router } from "express";
import { register, login, getMe } from "../controllers/authController";
import { protect, authorizeRoles } from "../middlewares/authMiddleware";
import { UserRole } from "../@types";

const router = Router();

// ──── Public Routes ────
router.post("/register", register);
router.post("/login", login);

// ──── Protected Routes ────
router.get("/me", protect, getMe);

// ──── Admin-only Example Route ────
router.get(
  "/admin/dashboard",
  protect,
  authorizeRoles(UserRole.ADMIN),
  (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome to the Admin dashboard.",
    });
  }
);

export default router;
