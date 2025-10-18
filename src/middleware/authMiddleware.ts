import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface UserPayload {
  id: number;
  role: string;
}

// Extend Express Request to include user payload
export interface AuthenticatedRequest extends Request {
  user: UserPayload;
}

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {accessToken, refreshToken} = req.cookies;

  let token;

  if (!accessToken) {
    token = refreshToken
  } else {
    token = accessToken
  }

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Not authenticated. Token missing.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY as string) as {
      data: UserPayload;
    };

    // Attach the user to the request object using a type assertion
    (req as AuthenticatedRequest).user = decoded.data;

    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(403).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }
};
