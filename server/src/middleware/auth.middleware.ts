import { Request, Response, NextFunction } from "express";
import { JwtService } from "../services/ui/jwt.service";

const jwtService = new JwtService();

export interface AuthRequest extends Request {
  userId?: string;
  phoneNumber?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwtService.verify(token);
    req.userId = payload.userId;
    req.phoneNumber = payload.phoneNumber;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
