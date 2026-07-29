import { Request, Response } from "express";
import mongoose from "mongoose";

// A quick schema reference since they exist in the shared DB
const Order = mongoose.models.Order || mongoose.model("Order", new mongoose.Schema({}, { strict: false }));
const Delivery = mongoose.models.Delivery || mongoose.model("Delivery", new mongoose.Schema({}, { strict: false }));

export const optimizeRoutes = async (req: Request, res: Response): Promise<void> => {
  try {
    // Aggregate PENDING orders grouped by franchiseId
    const pendingOrders = await Order.aggregate([
      { $match: { status: "PENDING" } },
      { 
        $group: { 
          _id: "$franchiseId", 
          orders: { $push: "$$ROOT" },
          totalWeight: { $sum: "$metadata.weight" },
          totalVolume: { 
            $sum: { 
              $multiply: [
                "$metadata.dimensions.length",
                "$metadata.dimensions.width",
                "$metadata.dimensions.height"
              ] 
            } 
          },
          count: { $sum: 1 }
        } 
      }
    ]);

    // Simple heuristic: if vehicle capacity is around 1000 weight units
    const capacityThreshold = 1000;
    
    const optimizedPlans = pendingOrders.map((group: any) => {
      return {
        hubId: group._id,
        totalOrders: group.count,
        totalWeight: group.totalWeight,
        utilizationScore: Math.min((group.totalWeight / capacityThreshold) * 100, 100),
        recommendedVehicles: Math.ceil(group.totalWeight / capacityThreshold),
        orders: group.orders.map((o: any) => o.orderId)
      };
    });

    res.status(200).json({ success: true, data: optimizedPlans });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const dispatchPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { driverId, vehicleId, orderIds, hubId } = req.body;

    if (!driverId || !vehicleId || !orderIds || !orderIds.length) {
      res.status(400).json({ success: false, message: "driverId, vehicleId, and orderIds are required" });
      return;
    }

    // Assign route/manifest
    const delivery = await Delivery.create({
      driverId,
      vehicleId,
      orders: orderIds,
      status: "ASSIGNED",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Update all these orders to ASSIGNED and link the driver/vehicle
    await Order.updateMany(
      { orderId: { $in: orderIds } },
      { 
        $set: { 
          status: "ASSIGNED", 
          driverId, 
          vehicleId, 
          franchiseId: hubId,
          "timeline": {
             status: "ASSIGNED",
             timestamp: new Date(),
             description: "Assigned via Planning Engine"
          } 
        } 
      }
    );

    res.status(200).json({ success: true, message: "Dispatch successful", data: delivery });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
