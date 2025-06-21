import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { prisma } from "../index";
import { AuthRequest } from "../types";
import { generateUniqueUsername } from "../utils/userHelpers";

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    return res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    console.error("Get me error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "your-refresh-secret";

const ACCESS_TOKEN_EXPIRES = "60m"; // 15 minutes
const REFRESH_TOKEN_EXPIRES = "7d"; // 7 days

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { email, name, picture, sub } = payload;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Generate unique username from email
      const username = await generateUniqueUsername(email);

      user = await prisma.user.create({
        data: {
          name: name || "Google User",
          email,
          username,
          googleId: sub,
          avatar: picture || null,
        },
      });
    }

    // Create access token (short-lived)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );

    // Create refresh token (long-lived)
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES }
    );

    // Set HTTP-only cookies
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    return res.status(200).json({
      message: "Google authentication successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar || picture,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET) as {
        userId: string;
        email: string;
      };
    } catch (error) {
      console.error("Refresh token verification failed:", error);
      // Re-throw to be caught by the outer catch block
      throw error;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        avatar: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Create new access token
    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES }
    );

    // Set new access token cookie
    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    });

    return res.status(200).json({
      message: "Token refreshed successfully",
      user,
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    // Clear cookies if refresh token is invalid
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const logout = async (_req: Request, res: Response) => {
  try {
    // Clear both cookies
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
