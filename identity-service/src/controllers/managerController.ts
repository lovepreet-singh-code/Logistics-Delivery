import { Request, Response } from "express";
import Manager from "../models/Manager";

export const createManager = async (req: Request, res: Response): Promise<void> => {
  try {
    const manager = await Manager.create(req.body);
    res.status(201).json({ success: true, data: manager });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getManagers = async (req: Request, res: Response): Promise<void> => {
  try {
    const managers = await Manager.find();
    res.status(200).json({ success: true, count: managers.length, data: managers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getManagerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const manager = await Manager.findById(req.params.id);
    if (!manager) {
      res.status(404).json({ success: false, message: "Manager not found" });
      return;
    }
    res.status(200).json({ success: true, data: manager });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateManager = async (req: Request, res: Response): Promise<void> => {
  try {
    const manager = await Manager.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: manager });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteManager = async (req: Request, res: Response): Promise<void> => {
  try {
    await Manager.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Manager deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
