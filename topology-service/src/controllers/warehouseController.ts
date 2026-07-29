import { Request, Response } from "express";
import Warehouse from "../models/Warehouse";

export const createWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouse = await Warehouse.create(req.body);
    res.status(201).json({ success: true, data: warehouse });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWarehouses = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {};
    if ((req as any).user?.role === "MANAGER" && (req as any).user?.managedHubId) {
      filter._id = (req as any).user.managedHubId; // Assuming manager manages this warehouse
    }
    
    const warehouses = await Warehouse.find(filter);
    res.status(200).json({ success: true, count: warehouses.length, data: warehouses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWarehouseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      res.status(404).json({ success: false, message: "Warehouse not found" });
      return;
    }
    res.status(200).json({ success: true, data: warehouse });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: warehouse });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteWarehouse = async (req: Request, res: Response): Promise<void> => {
  try {
    await Warehouse.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Warehouse deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
