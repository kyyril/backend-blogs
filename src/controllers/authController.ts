import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { prisma } from "../index";
import { AuthRequest } from "../types";

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    // The authenticate middleware already populated req.user
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

// JWT Secret - make sure to set this in your environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "15m"; // 15 minutes

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
      user = await prisma.user.create({
        data: {
          name: name || "Google User",
          email,
          googleId: sub,
          avatar: picture || null,
        },
      });
    }

    // Create JWT access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set HTTP-only cookie
    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
      path: "/",
    });

    return res.status(200).json({
      message: "Google authentication successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar || picture,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // Clear the access token cookie
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
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
