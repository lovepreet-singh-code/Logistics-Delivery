import { Request, Response } from "express";
import Franchise from "../models/Franchise";
import PincodeArea from "../models/PincodeArea";
import redis from "../config/redis";
import { ApiResponse, IServiceabilityResult } from "../@types";

// ──── Redis key prefix & TTL ────
const CACHE_PREFIX = "pin:";
const CACHE_TTL_SECONDS = 86400; // 24 hours

// ═══════════════════════════════════════════════
//  FRANCHISE CRUD
// ═══════════════════════════════════════════════

// POST /api/topology/franchises
export const createFranchise = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, region, basePinCode } = req.body;

    if (!name || !region || !basePinCode) {
      res.status(400).json({
        success: false,
        message: "Please provide name, region, and basePinCode.",
      } as ApiResponse);
      return;
    }

    const franchise = await Franchise.create({ name, region, basePinCode });

    res.status(201).json({
      success: true,
      message: "Franchise created successfully.",
      data: franchise,
    } as ApiResponse);
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ success: false, message: messages.join(". ") } as ApiResponse);
      return;
    }
    console.error("Create franchise error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// GET /api/topology/franchises
export const getAllFranchises = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const franchises = await Franchise.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Franchises retrieved successfully.",
      count: franchises.length,
      data: franchises,
    } as ApiResponse);
  } catch (error) {
    console.error("Get franchises error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// GET /api/topology/franchises/:id
export const getFranchiseById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const franchise = await Franchise.findById(req.params.id);

    if (!franchise) {
      res.status(404).json({ success: false, message: "Franchise not found." } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Franchise retrieved successfully.",
      data: franchise,
    } as ApiResponse);
  } catch (error) {
    console.error("Get franchise error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// PUT /api/topology/franchises/:id
export const updateFranchise = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const franchise = await Franchise.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!franchise) {
      res.status(404).json({ success: false, message: "Franchise not found." } as ApiResponse);
      return;
    }

    // Invalidate all cached pincodes for this franchise
    const linkedPincodes = await PincodeArea.find({ franchiseId: franchise._id });
    const pipeline = redis.pipeline();
    for (const pc of linkedPincodes) {
      pipeline.del(`${CACHE_PREFIX}${pc.pinCode}`);
    }
    await pipeline.exec();

    res.status(200).json({
      success: true,
      message: "Franchise updated successfully.",
      data: franchise,
    } as ApiResponse);
  } catch (error: any) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ success: false, message: messages.join(". ") } as ApiResponse);
      return;
    }
    console.error("Update franchise error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// DELETE /api/topology/franchises/:id
export const deleteFranchise = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const franchise = await Franchise.findByIdAndDelete(req.params.id);

    if (!franchise) {
      res.status(404).json({ success: false, message: "Franchise not found." } as ApiResponse);
      return;
    }

    // Invalidate all cached pincodes for this franchise
    const linkedPincodes = await PincodeArea.find({ franchiseId: franchise._id });
    const pipeline = redis.pipeline();
    for (const pc of linkedPincodes) {
      pipeline.del(`${CACHE_PREFIX}${pc.pinCode}`);
    }
    await pipeline.exec();

    res.status(200).json({
      success: true,
      message: "Franchise deleted successfully.",
    } as ApiResponse);
  } catch (error) {
    console.error("Delete franchise error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// ═══════════════════════════════════════════════
//  PINCODE AREA CRUD
// ═══════════════════════════════════════════════

// POST /api/topology/pincodes
export const createPincode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { pinCode, franchiseId, city, isActive } = req.body;

    if (!pinCode || !franchiseId || !city) {
      res.status(400).json({
        success: false,
        message: "Please provide pinCode, franchiseId, and city.",
      } as ApiResponse);
      return;
    }

    // Verify franchise exists
    const franchise = await Franchise.findById(franchiseId);
    if (!franchise) {
      res.status(404).json({ success: false, message: "Franchise not found." } as ApiResponse);
      return;
    }

    const pincodeArea = await PincodeArea.create({ pinCode, franchiseId, city, isActive });

    res.status(201).json({
      success: true,
      message: "Pincode area created successfully.",
      data: pincodeArea,
    } as ApiResponse);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: "This pin code already exists." } as ApiResponse);
      return;
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ success: false, message: messages.join(". ") } as ApiResponse);
      return;
    }
    console.error("Create pincode error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// GET /api/topology/pincodes
export const getAllPincodes = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const pincodes = await PincodeArea.find()
      .populate("franchiseId", "name region basePinCode")
      .sort({ pinCode: 1 });

    res.status(200).json({
      success: true,
      message: "Pincode areas retrieved successfully.",
      count: pincodes.length,
      data: pincodes,
    } as ApiResponse);
  } catch (error) {
    console.error("Get pincodes error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// GET /api/topology/pincodes/:id
export const getPincodeById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const pincode = await PincodeArea.findById(req.params.id).populate(
      "franchiseId",
      "name region basePinCode"
    );

    if (!pincode) {
      res.status(404).json({ success: false, message: "Pincode area not found." } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Pincode area retrieved successfully.",
      data: pincode,
    } as ApiResponse);
  } catch (error) {
    console.error("Get pincode error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// PUT /api/topology/pincodes/:id
export const updatePincode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const existing = await PincodeArea.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ success: false, message: "Pincode area not found." } as ApiResponse);
      return;
    }

    // Invalidate old cache entry
    await redis.del(`${CACHE_PREFIX}${existing.pinCode}`);

    const pincode = await PincodeArea.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Invalidate new pincode cache entry (in case pinCode value changed)
    if (pincode) {
      await redis.del(`${CACHE_PREFIX}${pincode.pinCode}`);
    }

    res.status(200).json({
      success: true,
      message: "Pincode area updated successfully.",
      data: pincode,
    } as ApiResponse);
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ success: false, message: "This pin code already exists." } as ApiResponse);
      return;
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      res.status(400).json({ success: false, message: messages.join(". ") } as ApiResponse);
      return;
    }
    console.error("Update pincode error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// DELETE /api/topology/pincodes/:id
export const deletePincode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const pincode = await PincodeArea.findByIdAndDelete(req.params.id);

    if (!pincode) {
      res.status(404).json({ success: false, message: "Pincode area not found." } as ApiResponse);
      return;
    }

    // Invalidate cache
    await redis.del(`${CACHE_PREFIX}${pincode.pinCode}`);

    res.status(200).json({
      success: true,
      message: "Pincode area deleted successfully.",
    } as ApiResponse);
  } catch (error) {
    console.error("Delete pincode error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};

// ═══════════════════════════════════════════════
//  SERVICEABILITY CHECK (Cache-Aside Pattern)
// ═══════════════════════════════════════════════

// GET /api/topology/check/:pinCode
export const checkServiceability = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { pinCode } = req.params;
    const cacheKey = `${CACHE_PREFIX}${pinCode}`;

    // ── Step A: Check Redis ──
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed: IServiceabilityResult = JSON.parse(cached);
      res.status(200).json({
        success: true,
        message: "Serviceability data retrieved from cache.",
        data: { ...parsed, source: "cache" },
      } as ApiResponse);
      return;
    }

    // ── Step B: Cache miss — query MongoDB ──
    const pincodeArea = await PincodeArea.findOne({ pinCode }).populate(
      "franchiseId",
      "name region basePinCode"
    );

    if (!pincodeArea || !pincodeArea.franchiseId) {
      res.status(404).json({
        success: false,
        message: "Serviceability unavailable for this pin code.",
      } as ApiResponse);
      return;
    }

    const franchise = pincodeArea.franchiseId as any;

    const result: IServiceabilityResult = {
      pinCode: pincodeArea.pinCode,
      city: pincodeArea.city,
      isActive: pincodeArea.isActive,
      franchise: {
        id: franchise._id.toString(),
        name: franchise.name,
        region: franchise.region,
        basePinCode: franchise.basePinCode,
      },
    };

    // ── Step C: Cache result with 24h TTL ──
    await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(result));

    res.status(200).json({
      success: true,
      message: "Serviceability data retrieved from database.",
      data: { ...result, source: "database" },
    } as ApiResponse);
  } catch (error) {
    console.error("Serviceability check error:", error);
    res.status(500).json({ success: false, message: "Internal server error." } as ApiResponse);
  }
};
