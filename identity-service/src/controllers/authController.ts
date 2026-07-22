import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import config from "../config";
import { ApiResponse, IJwtPayload, AuthRequest } from "../@types";

// ──── Helper: Generate JWT ────
const generateToken = (payload: IJwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

// ──────────────────────────────────────────────
//  POST /api/auth/register
// ──────────────────────────────────────────────
export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Please provide name, email, and password.",
      } as ApiResponse);
      return;
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      } as ApiResponse);
      return;
    }

    // Create user (password is hashed by pre-save hook)
    const user = await User.create({ name, email, password, role });

    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
        token,
      },
    } as ApiResponse);
  } catch (error: any) {
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      res.status(400).json({
        success: false,
        message: messages.join(". "),
      } as ApiResponse);
      return;
    }

    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};

// ──────────────────────────────────────────────
//  POST /api/auth/login
// ──────────────────────────────────────────────
export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      } as ApiResponse);
      return;
    }

    // Find user and explicitly include password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      } as ApiResponse);
      return;
    }

    // Check if account is active
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "Account has been deactivated. Contact support.",
      } as ApiResponse);
      return;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      } as ApiResponse);
      return;
    }

    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
        token,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};

// ──────────────────────────────────────────────
//  GET /api/auth/me  (protected)
// ──────────────────────────────────────────────
export const getMe = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: "User profile retrieved.",
      data: { user: req.user },
    } as ApiResponse);
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};
