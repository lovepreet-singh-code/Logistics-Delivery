import { Request, Response, NextFunction } from "express";

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided, authorization denied." });
  }

  try {
    const token = authHeader.split(" ")[1];
    
    if (!token) {
       return res.status(401).json({ success: false, message: "Invalid token format." });
    }

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Token is not valid." });
  }
};
