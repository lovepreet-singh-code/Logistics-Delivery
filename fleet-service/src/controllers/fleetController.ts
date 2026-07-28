import { Request, Response } from "express";
import mongoose from "mongoose";
import Vehicle from "../models/Vehicle";
import { ApiResponse, VehicleStatus } from "../@types";

// ═══════════════════════════════════════════════
//  VEHICLE CRUD
// ═══════════════════════════════════════════════

// POST /api/fleet/vehicles
export const createVehicle = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { registrationNumber, franchiseId, capacity, status } = req.body;

    if (!registrationNumber || !franchiseId || !capacity) {
      res.status(400).json({
        success: false,
        message: "Please provide registrationNumber, franchiseId, and capacity.",
      } as ApiResponse);
      return;
    }

    if (!capacity.maxWeightKg || !capacity.maxVolumeCm3) {
      res.status(400).json({
        success: false,
        message: "Capacity must include maxWeightKg and maxVolumeCm3.",
      } as ApiResponse);
      return;
    }

    const vehicle = await Vehicle.create({
      registrationNumber,
      franchiseId,
      capacity,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Vehicle registered successfully.",
      data: vehicle,
    } as ApiResponse);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: "A vehicle with this registration number already exists.",
      } as ApiResponse);
      return;
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ success: false, message: messages.join(". ") } as ApiResponse);
      return;
    }
    console.error("Create vehicle error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// GET /api/fleet/vehicles
export const getAllVehicles = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, franchiseId } = req.query;

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (franchiseId) filter.franchiseId = franchiseId;

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Vehicles retrieved successfully.",
      count: vehicles.length,
      data: vehicles,
    } as ApiResponse);
  } catch (error) {
    console.error("Get vehicles error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// GET /api/fleet/vehicles/:id
export const getVehicleById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      res.status(404).json({ success: false, message: "Vehicle not found." } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Vehicle retrieved successfully.",
      data: vehicle,
    } as ApiResponse);
  } catch (error) {
    console.error("Get vehicle error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// PUT /api/fleet/vehicles/:id
export const updateVehicle = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      res.status(404).json({ success: false, message: "Vehicle not found." } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Vehicle updated successfully.",
      data: vehicle,
    } as ApiResponse);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: "A vehicle with this registration number already exists.",
      } as ApiResponse);
      return;
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ success: false, message: messages.join(". ") } as ApiResponse);
      return;
    }
    console.error("Update vehicle error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// DELETE /api/fleet/vehicles/:id
export const deleteVehicle = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      res.status(404).json({ success: false, message: "Vehicle not found." } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully.",
    } as ApiResponse);
  } catch (error) {
    console.error("Delete vehicle error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// ═══════════════════════════════════════════════
//  AVAILABLE VEHICLES FOR A FRANCHISE (Capacity Planning)
// ═══════════════════════════════════════════════

// GET /api/fleet/franchise/:franchiseId/available
export const getAvailableVehiclesByFranchise = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { franchiseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(franchiseId)) {
      res.status(400).json({
        success: false,
        message: "Invalid franchise ID format.",
      } as ApiResponse);
      return;
    }

    const vehicles = await Vehicle.find({
      franchiseId,
      status: VehicleStatus.AVAILABLE,
    }).sort({ "capacity.maxWeightKg": -1 });

    // Aggregate total available capacity
    const totalCapacity = vehicles.reduce(
      (acc, v) => ({
        totalWeightKg: acc.totalWeightKg + v.capacity.maxWeightKg,
        totalVolumeCm3: acc.totalVolumeCm3 + v.capacity.maxVolumeCm3,
      }),
      { totalWeightKg: 0, totalVolumeCm3: 0 }
    );

    res.status(200).json({
      success: true,
      message: "Available vehicles retrieved successfully.",
      count: vehicles.length,
      data: {
        franchiseId,
        availableCount: vehicles.length,
        totalCapacity,
        vehicles,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Get available vehicles error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// GET /api/fleet/stats
export const getFleetStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const count = await Vehicle.countDocuments();
    // Returning both flat and nested to satisfy generic frontend expectations
    res.status(200).json({
      success: true,
      count,
      data: { count }
    });
  } catch (error) {
    console.error("Get fleet stats error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
