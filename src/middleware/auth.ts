import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../index";
import { AuthRequest } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from HTTP-only cookie
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Convert null values to undefined to match AuthRequest type
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio ?? undefined,
      avatar: user.avatar ?? undefined,
    };
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    // Handle JWT specific errors
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }

    if (error instanceof jwt.TokenExpiredError) {
      // Clear expired cookie
      res.clearCookie("access_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Not authorized" });
  }
  return;
};
