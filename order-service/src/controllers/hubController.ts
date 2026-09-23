import { Request, Response } from "express";
import Hub from "../models/Hub";

export const createHub = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hubName, hubCode, managerName, contactNumber, serviceablePincodes, isActive } = req.body;
    
    const existing = await Hub.findOne({ hubCode });
    if (existing) {
      res.status(409).json({ success: false, message: "Hub code already exists." });
      return;
    }

    const hub = await Hub.create({
      hubName,
      hubCode,
      managerName,
      contactNumber,
      serviceablePincodes: serviceablePincodes || [],
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ success: true, data: hub, message: "Hub created successfully." });
  } catch (error: any) {
    console.error("Create Hub Error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error." });
  }
};

export const getAllHubs = async (req: Request, res: Response): Promise<void> => {
  try {
    const hubs = await Hub.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: hubs });
  } catch (error: any) {
    console.error("Get Hubs Error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error." });
  }
};

export const updateHubPincodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { serviceablePincodes } = req.body;

    if (!Array.isArray(serviceablePincodes)) {
      res.status(400).json({ success: false, message: "serviceablePincodes must be an array." });
      return;
    }

    const hub = await Hub.findByIdAndUpdate(
      id,
      { serviceablePincodes },
      { new: true }
    );

    if (!hub) {
      res.status(404).json({ success: false, message: "Hub not found." });
      return;
    }

    res.status(200).json({ success: true, data: hub, message: "Hub pincodes updated." });
  } catch (error: any) {
    console.error("Update Hub Pincodes Error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error." });
  }
};

export const toggleHubStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const hub = await Hub.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!hub) {
      res.status(404).json({ success: false, message: "Hub not found." });
      return;
    }

    res.status(200).json({ success: true, data: hub, message: `Hub marked as ${isActive ? 'Active' : 'Inactive'}.` });
  } catch (error: any) {
    console.error("Toggle Hub Status Error:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error." });
  }
};
