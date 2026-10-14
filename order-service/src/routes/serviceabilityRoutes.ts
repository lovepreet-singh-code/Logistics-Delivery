import { Router, Request, Response } from "express";
import Hub from "../models/Hub";

const router = Router();

/**
 * GET /api/serviceability/check?pincode=XXXXXX
 *
 * Phase 2 — CX Upgrade: Dynamically validates a 6-digit PIN code against
 * the live MongoDB Hub collection (`Hub.serviceablePincodes[]`).
 *
 * Query logic:
 *   - Finds any Hub document where the pincode is contained in
 *     `serviceablePincodes` AND `isActive` is true.
 *   - The city name is derived from `hub.hubName` (e.g. "Lucknow Hub" → "Lucknow Hub").
 *
 * Returns: { success, serviceable: boolean, city: string, hubCode: string, message: string }
 */
router.get("/check", async (req: Request, res: Response) => {
  const { pincode } = req.query;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!pincode || typeof pincode !== "string") {
    return res.status(400).json({
      success: false,
      serviceable: false,
      city: "",
      message: "Please provide a pincode query parameter.",
    });
  }

  const sanitized = pincode.trim();

  if (!/^\d{6}$/.test(sanitized)) {
    return res.status(400).json({
      success: false,
      serviceable: false,
      city: "",
      message: "Pincode must be exactly 6 digits.",
    });
  }

  // ── Dynamic DB Lookup ─────────────────────────────────────────────────────
  try {
    const hub = await Hub.findOne({
      serviceablePincodes: sanitized, // Mongoose checks if value exists in the array
      isActive: true,
    }).select("hubName hubCode serviceablePincodes").lean();

    if (hub) {
      const city = hub.hubName; // e.g. "Lucknow Hub", "Mumbai Hub"
      return res.status(200).json({
        success: true,
        serviceable: true,
        city,
        hubCode: hub.hubCode,
        message: `Serviceable — ${city}`,
      });
    } else {
      return res.status(200).json({
        success: true,
        serviceable: false,
        city: "",
        hubCode: "",
        message: "This pincode is currently outside our delivery network.",
      });
    }
  } catch (error: any) {
    console.error("[Serviceability] DB lookup error:", error);
    return res.status(500).json({
      success: false,
      serviceable: false,
      city: "",
      message: "Serviceability check temporarily unavailable. Please try again.",
    });
  }
});

export default router;
