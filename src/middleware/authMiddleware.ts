// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


interface UserPayload {
  id: number;
  role: string;
}
export interface AuthenticatedRequest extends Request {
user:UserPayload;

}

export const authenticateUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ status: "error", message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as { data: UserPayload };
    req.user = decoded.data;
    next();
  } catch (err) {
    return res.status(403).json({ status: "error", message: "Invalid token" });
  }
};
