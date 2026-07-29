import { Request, Response } from "express";
import DeliveryAgent from "../models/DeliveryAgent";

export const createAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const agent = await DeliveryAgent.create(req.body);
    res.status(201).json({ success: true, data: agent });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAgents = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: any = {};
    if ((req as any).user?.role === "MANAGER" && (req as any).user?.managedHubId) {
      filter.assignedHubId = (req as any).user.managedHubId;
    }
    
    const agents = await DeliveryAgent.find(filter);
    res.status(200).json({ success: true, count: agents.length, data: agents });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAgentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const agent = await DeliveryAgent.findById(req.params.id);
    if (!agent) {
      res.status(404).json({ success: false, message: "Agent not found" });
      return;
    }
    res.status(200).json({ success: true, data: agent });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    const agent = await DeliveryAgent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: agent });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAgent = async (req: Request, res: Response): Promise<void> => {
  try {
    await DeliveryAgent.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Agent deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
