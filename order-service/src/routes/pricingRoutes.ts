import { Router, Request, Response } from "express";

const router = Router();

// ──── Pricing Constants ────────────────────────────────────────────────────
const RATE_PER_KG         = 50;   // ₹50 per chargeable kg
const VOLUMETRIC_DIVISOR  = 5000; // Industry-standard DIM factor
const PREMIUM_SURCHARGE   = 100;  // Flat ₹100 for FRAGILE / ELECTRONICS
const GST_RATE            = 0.18; // 18% GST
const PREMIUM_CATEGORIES  = new Set(["FRAGILE", "ELECTRONICS"]);

/**
 * POST /api/pricing/calculate
 *
 * Phase 2 Feature 2 — Live Price Calculator.
 * Stateless endpoint: pure math, no DB call needed.
 *
 * Body: { weight, length, width, height, category }
 * All dimension fields are optional / nullable (safe-coerced to 0).
 *
 * Returns:
 *   { volumetricWeight, chargeableWeight, baseCharge, premium,
 *     tax, totalAmount, breakdown }
 */
router.post("/calculate", (req: Request, res: Response) => {
  // ── Parse & sanitize inputs ────────────────────────────────────────────
  const weight   = Math.max(0, parseFloat(req.body?.weight)   || 0);
  const lengthCm = Math.max(0, parseFloat(req.body?.length)   || 0);
  const widthCm  = Math.max(0, parseFloat(req.body?.width)    || 0);
  const heightCm = Math.max(0, parseFloat(req.body?.height)   || 0);
  const category = (typeof req.body?.category === "string"
    ? req.body.category.toUpperCase().trim()
    : "OTHER");

  if (weight <= 0) {
    return res.status(400).json({
      success: false,
      message: "Weight must be greater than 0.",
    });
  }

  // ── Core Calculations ──────────────────────────────────────────────────
  // Volumetric weight: only non-zero when all three dimensions are provided
  const volumetricWeight =
    lengthCm > 0 && widthCm > 0 && heightCm > 0
      ? parseFloat(((lengthCm * widthCm * heightCm) / VOLUMETRIC_DIVISOR).toFixed(2))
      : 0;

  const chargeableWeight = parseFloat(
    Math.max(weight, volumetricWeight).toFixed(2)
  );

  const baseCharge = parseFloat((chargeableWeight * RATE_PER_KG).toFixed(2));

  const premium = PREMIUM_CATEGORIES.has(category) ? PREMIUM_SURCHARGE : 0;

  // GST applied on (baseCharge + premium) — the taxable amount
  const taxableAmount = baseCharge + premium;
  const tax           = parseFloat((taxableAmount * GST_RATE).toFixed(2));
  const totalAmount   = parseFloat((taxableAmount + tax).toFixed(2));

  return res.status(200).json({
    success: true,
    baseCharge,
    premium,
    tax,
    totalAmount,
    chargeableWeight,
    volumetricWeight,
    data: {
      volumetricWeight,
      chargeableWeight,
      baseCharge,
      premium,
      tax,
      totalAmount,
      breakdown: {
        ratePerKg: RATE_PER_KG,
        gstPercent: GST_RATE * 100,
        category,
        isPremium: premium > 0,
      },
    },
  });
});

export default router;
