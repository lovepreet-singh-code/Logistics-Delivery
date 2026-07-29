import { Request, Response } from "express";
import Order from "../models/Order";

// GET /api/analytics/dashboard-stats
export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const pipeline = [
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$pricing.total" },
                totalOrders: { $sum: 1 },
                deliveredOrders: {
                  $sum: { $cond: [{ $eq: ["$status", "DELIVERED"] }, 1, 0] },
                },
                avgDeliveryTime: {
                  $avg: {
                    $cond: [
                      { $eq: ["$status", "DELIVERED"] },
                      { $subtract: ["$updatedAt", "$createdAt"] },
                      null
                    ]
                  }
                }
              },
            },
          ],
          topHubs: [
            { $match: { franchiseId: { $ne: null } } },
            { $group: { _id: "$franchiseId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "franchises",
                localField: "_id",
                foreignField: "_id",
                as: "hub",
              },
            },
            { $unwind: { path: "$hub", preserveNullAndEmptyArrays: true } },
            { $project: { _id: 1, count: 1, name: "$hub.name" } },
          ],
          topDrivers: [
            { $match: { status: "DELIVERED", driverId: { $ne: null } } },
            { $group: { _id: "$driverId", deliveries: { $sum: 1 } } },
            { $sort: { deliveries: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "driver",
              },
            },
            { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
            { $project: { _id: 1, deliveries: 1, name: "$driver.name" } },
          ],
        },
      },
    ];

    const results = await Order.aggregate(pipeline);
    const data = results[0];

    const stats = data.totalStats[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      deliveredOrders: 0,
      avgDeliveryTime: 0
    };

    const successRate = stats.totalOrders > 0 ? (stats.deliveredOrders / stats.totalOrders) * 100 : 0;
    
    // convert avgDeliveryTime from ms to hours
    const avgDeliveryTimeHours = stats.avgDeliveryTime ? stats.avgDeliveryTime / (1000 * 60 * 60) : 0;

    res.status(200).json({
      success: true,
      data: {
        revenueTotal: stats.totalRevenue,
        successRate: successRate,
        avgDeliveryTime: avgDeliveryTimeHours,
        topHubs: data.topHubs,
        topDrivers: data.topDrivers,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import { Parser } from 'json2csv';
import { jsPDF } from 'jspdf';

// GET /api/analytics/reports/export
export const exportReports = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const format = req.query.format || "json";
    
    const orders = await Order.find().select("orderId status pricing.total createdAt updatedAt").lean();
    
    const exportData = orders.map(order => ({
      TrackingID: order.orderId,
      Status: order.status,
      Revenue: order.pricing?.total || 0,
      CreatedDate: new Date(order.createdAt as Date).toLocaleDateString(),
      LastUpdated: new Date(order.updatedAt as Date).toLocaleDateString()
    }));

    if (format === "csv") {
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(exportData);
      res.header('Content-Type', 'text/csv');
      res.attachment('logistics_report.csv');
      res.send(csv);
      return;
    }
    
    if (format === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Logistics Enterprise Report", 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      
      let y = 45;
      exportData.forEach((row, index) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${index + 1}. ID: ${row.TrackingID} | Status: ${row.Status} | Revenue: Rs. ${row.Revenue}`, 14, y);
        y += 10;
      });
      
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      res.header('Content-Type', 'application/pdf');
      res.attachment('logistics_report.pdf');
      res.send(pdfBuffer);
      return;
    }

    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
