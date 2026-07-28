import axios from "axios";
import mongoose from "mongoose";
import Manifest from "../models/Manifest";
import { producer } from "../config/kafka";
import config from "../config";
import {
  IExternalOrder,
  IExternalVehicle,
  IDispatchManifestedEvent,
  IManifestResult,
  IRouteSequenceEntry,
} from "../@types";

// ═══════════════════════════════════════════════
//  DISPATCH ENGINE
//  Bin Packing + Route Simulation + LIFO Loading
// ═══════════════════════════════════════════════

export const generateDailyManifests = async (
  franchiseId: string
): Promise<IManifestResult[]> => {
  console.log(`\n🚀 [dispatch] Starting dispatch engine for franchise: ${franchiseId}`);

  // ──────────────────────────────────────────
  //  STEP 1: Data Fetching (Inter-Service Calls)
  // ──────────────────────────────────────────

  // Fetch ROUTED orders from Order Service
  const ordersResponse = await axios.get(
    `${config.services.orderServiceUrl}/api/orders/routed/${franchiseId}`
  );
  const orders: IExternalOrder[] = ordersResponse.data.data || [];

  if (orders.length === 0) {
    console.log(`ℹ️  [dispatch] No routed orders found for franchise ${franchiseId}`);
    return [];
  }

  console.log(`📦 [dispatch] Found ${orders.length} routed orders`);

  // Fetch AVAILABLE vehicles from Fleet Service
  const vehiclesResponse = await axios.get(
    `${config.services.fleetServiceUrl}/api/fleet/franchise/${franchiseId}/available`
  );
  const vehicles: IExternalVehicle[] =
    vehiclesResponse.data.data?.vehicles || [];

  if (vehicles.length === 0) {
    console.log(`ℹ️  [dispatch] No available vehicles returned by fleet-service for franchise ${franchiseId}`);
    
    // DEBUG LOGGING: Let's query the raw DB to see what vehicles actually exist for this franchise
    try {
      const allVehicles = await mongoose.connection.db!.collection('vehicles').find({ 
        franchiseId: new mongoose.Types.ObjectId(franchiseId) 
      }).toArray();
      
      console.log(`[DEBUG] Found ${allVehicles.length} total vehicles registered to this franchise in MongoDB:`);
      allVehicles.forEach(v => {
        console.log(`  -> Vehicle: ${v.registrationNumber} | Status: '${v.status}'`);
      });
    } catch (err: any) {
      console.log(`[DEBUG] Could not fetch raw vehicles from DB: ${err.message}`);
    }
    
    return [];
  }

  console.log(`🚛 [dispatch] Found ${vehicles.length} available vehicles`);

  // ──────────────────────────────────────────
  //  STEP 2: Bin Packing Algorithm
  // ──────────────────────────────────────────

  const results: IManifestResult[] = [];
  const assignedOrderIds = new Set<string>();

  for (const vehicle of vehicles) {
    let currentWeight = 0;
    let currentVolume = 0;
    const assignedOrders: IExternalOrder[] = [];

    for (const order of orders) {
      // Skip already assigned orders
      if (assignedOrderIds.has(order._id)) continue;

      const orderWeight = order.parcelDetails.weightKg;
      const orderVolume = order.parcelDetails.totalVolumeCm3;

      // Bin packing check: weight AND volume constraints
      if (
        currentWeight + orderWeight <= vehicle.capacity.maxWeightKg &&
        currentVolume + orderVolume <= vehicle.capacity.maxVolumeCm3
      ) {
        assignedOrders.push(order);
        assignedOrderIds.add(order._id);
        currentWeight += orderWeight;
        currentVolume += orderVolume;
      }
    }

    // Skip vehicles with no assigned orders
    if (assignedOrders.length === 0) {
      console.log(`⚠️  [dispatch] Vehicle ${vehicle.registrationNumber} (Max: ${vehicle.capacity.maxWeightKg}kg / ${vehicle.capacity.maxVolumeCm3}cm3) was skipped. NO orders fit its capacity constraints.`);
      continue;
    }

    // ──────────────────────────────────────────
    //  STEP 3: Route Optimization + LIFO
    // ──────────────────────────────────────────

    // Route Simulation: Sort by delivery latitude (ascending)
    // This simulates a south-to-north delivery route.
    // In production, replace with Google Maps Directions API.
    const routeSorted = [...assignedOrders].sort(
      (a, b) => a.deliveryAddress.lat - b.deliveryAddress.lat
    );

    // Build routeSequence (delivery order)
    const routeSequence: IRouteSequenceEntry[] = routeSorted.map((order) => ({
      orderId: new mongoose.Types.ObjectId(order._id),
      lat: order.deliveryAddress.lat,
      lng: order.deliveryAddress.lng,
    }));

    // Build loadingSequence (LIFO = reverse of route)
    // Last delivery loaded first → first delivery loaded last (on top)
    const loadingSequence = [...routeSequence]
      .reverse()
      .map((entry) => entry.orderId);

    // ──────────────────────────────────────────
    //  STEP 4: Save Manifest & Publish Event
    // ──────────────────────────────────────────

    const manifest = await Manifest.create({
      franchiseId: new mongoose.Types.ObjectId(franchiseId),
      vehicleId: new mongoose.Types.ObjectId(vehicle._id),
      routeSequence,
      loadingSequence,
      date: new Date(),
    });

    // Publish dispatch.manifested event
    const event: IDispatchManifestedEvent = {
      manifestId: manifest._id.toString(),
      franchiseId,
      vehicleId: vehicle._id,
      orderIds: assignedOrders.map((o) => o._id),
      timestamp: new Date().toISOString(),
    };

    await producer.send({
      topic: "dispatch.manifested",
      messages: [
        {
          key: manifest._id.toString(),
          value: JSON.stringify(event),
        },
      ],
    });

    const weightUtil = ((currentWeight / vehicle.capacity.maxWeightKg) * 100).toFixed(1);
    const volumeUtil = ((currentVolume / vehicle.capacity.maxVolumeCm3) * 100).toFixed(1);

    console.log(
      `📋 [dispatch] Manifest ${manifest._id} | Vehicle: ${vehicle.registrationNumber} | Orders: ${assignedOrders.length} | Weight: ${weightUtil}% | Volume: ${volumeUtil}%`
    );

    results.push({
      vehicleId: vehicle._id,
      registrationNumber: vehicle.registrationNumber,
      ordersAssigned: assignedOrders.length,
      weightUtilization: `${weightUtil}%`,
      volumeUtilization: `${volumeUtil}%`,
      manifestId: manifest._id.toString(),
    });
  }

  const unassignedCount = orders.length - assignedOrderIds.size;
  if (unassignedCount > 0) {
    console.log(
      `⚠️  [dispatch] ${unassignedCount} orders could not be assigned (insufficient vehicle capacity)`
    );
  }

  console.log(
    `✅ [dispatch] Engine complete: ${results.length} manifests created, ${assignedOrderIds.size}/${orders.length} orders assigned\n`
  );

  return results;
};
