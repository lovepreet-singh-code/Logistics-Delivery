import cron from "node-cron";
import axios from "axios";
import config from "../config";
import { generateDailyManifests } from "../services/dispatchEngine";

// ──── List of active franchise IDs ────
// In production, fetch this dynamically from the topology-service
let activeFranchiseIds: string[] = [];

// Fetch active franchises from topology-service
const refreshFranchises = async (): Promise<void> => {
  try {
    const response = await axios.get(
      `http://localhost:4002/api/topology/franchises`
    );
    const franchises = response.data.data || [];
    activeFranchiseIds = franchises.map((f: any) => f._id);
    console.log(
      `🔄 [cron] Refreshed franchise list: ${activeFranchiseIds.length} active franchises`
    );
  } catch (error) {
    console.error(
      "⚠️  [cron] Could not fetch franchises. Using cached list."
    );
  }
};

// ──── Schedule: Daily at midnight ────
export const startDailyDispatchCron = (): void => {
  // Run at midnight every day: "0 0 * * *"
  cron.schedule("0 0 * * *", async () => {
    console.log(
      `\n⏰ [cron] Daily dispatch triggered at ${new Date().toISOString()}`
    );

    // Refresh franchise list before running
    await refreshFranchises();

    if (activeFranchiseIds.length === 0) {
      console.log("ℹ️  [cron] No active franchises found. Skipping.");
      return;
    }

    for (const franchiseId of activeFranchiseIds) {
      try {
        console.log(`\n── Processing franchise: ${franchiseId} ──`);
        const results = await generateDailyManifests(franchiseId);
        console.log(
          `   → ${results.length} manifest(s) generated for franchise ${franchiseId}`
        );
      } catch (error: any) {
        console.error(
          `❌ [cron] Dispatch failed for franchise ${franchiseId}:`,
          error.message
        );
      }
    }

    console.log(`\n✅ [cron] Daily dispatch cycle complete.\n`);
  });

  console.log("⏰ Daily Dispatch Cron scheduled: 0 0 * * * (midnight)");
};
