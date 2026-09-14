import { Request, Response } from "express";
import User from "../models/User";
import { ApiResponse } from "../@types";

// GET /api/management/users
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    
    const users = await User.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      count: users.length,
      data: users
    } as ApiResponse);
  } catch (error: any) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    } as ApiResponse);
  }
};

// PATCH /api/management/users/:id/status
export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" } as ApiResponse);
      return;
    }
    
    user.isActive = isActive;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
      data: user
    } as ApiResponse);
  } catch (error: any) {
    console.error("Update user status error:", error);
    res.status(500).json({ success: false, message: "Internal server error" } as ApiResponse);
  }
};

// DELETE /api/management/users/:id
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" } as ApiResponse);
      return;
    }
    
    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    } as ApiResponse);
  } catch (error: any) {
    console.error("Delete user error:", error);
    res.status(500).json({ success: false, message: "Internal server error" } as ApiResponse);
  }
};
