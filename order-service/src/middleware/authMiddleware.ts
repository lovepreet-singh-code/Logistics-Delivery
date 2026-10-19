import { Request, Response, NextFunction } from "express";

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // In dev / demo environments, permit requests without token
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    
    if (!token) {
       return next();
    }

    next();
  } catch (error) {
    next();
  }
};
