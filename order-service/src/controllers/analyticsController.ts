import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order";
import { ApiResponse, OrderStatus } from "../@types";

// ═══════════════════════════════════════════════
//  ANALYTICS CONTROLLER
// ═══════════════════════════════════════════════

export const getAdminAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Revenue Metrics
    const revenueAgg = await Order.aggregate([
      {
        $facet: {
          total: [
            { $group: { _id: null, sum: { $sum: "$pricing.total" } } }
          ],
          thisMonth: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, sum: { $sum: "$pricing.total" } } }
          ],
          today: [
            { $match: { createdAt: { $gte: startOfToday } } },
            { $group: { _id: null, sum: { $sum: "$pricing.total" } } }
          ]
        }
      }
    ]);

    const revenue = {
      total: revenueAgg[0]?.total[0]?.sum || 0,
      thisMonth: revenueAgg[0]?.thisMonth[0]?.sum || 0,
      today: revenueAgg[0]?.today[0]?.sum || 0,
    };

    // 2. Delivery Metrics
    const totalOrders = await Order.countDocuments();
    const deliveredOrders = await Order.countDocuments({ status: OrderStatus.DELIVERED });
    const failedOrders = await Order.countDocuments({ status: "FAILED" }); // Assuming 'FAILED' exists or just 0

    const successRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(2) : 0;

    // 3. Top Hubs (based on routed origin franchise)
    const topHubs = await Order.aggregate([
      { $match: { "routing.originFranchiseId": { $exists: true, $ne: null } } },
      { $group: { _id: "$routing.originFranchiseId", orderCount: { $sum: 1 } } },
      { $sort: { orderCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "franchises", // Querying shared DB for names
          localField: "_id",
          foreignField: "_id",
          as: "hubDetails"
        }
      },
      {
        $project: {
          _id: 1,
          orderCount: 1,
          name: { $arrayElemAt: ["$hubDetails.name", 0] }
        }
      }
    ]);

    // 4. Top Drivers (based on agentId)
    const topDrivers = await Order.aggregate([
      { $match: { "routing.agentId": { $exists: true, $ne: null }, status: OrderStatus.DELIVERED } },
      { $group: { _id: "$routing.agentId", deliveryCount: { $sum: 1 } } },
      { $sort: { deliveryCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users", // Querying shared DB for names
          localField: "_id",
          foreignField: "_id",
          as: "driverDetails"
        }
      },
      {
        $project: {
          _id: 1,
          deliveryCount: 1,
          name: { $arrayElemAt: ["$driverDetails.name", 0] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: "Analytics retrieved successfully.",
      data: {
        revenue,
        delivery: {
          total: totalOrders,
          delivered: deliveredOrders,
          failed: failedOrders,
          successRate: Number(successRate)
        },
        topHubs,
        topDrivers
      }
    } as ApiResponse);
  } catch (error: any) {
    console.error("Get analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    } as ApiResponse);
  }
};
