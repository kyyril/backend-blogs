import { Request, Response } from "express";
import { prisma } from "../index";
import { AuthRequest } from "../types";
import { UserProfile } from "../types/user";

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        blogs: {
          include: {
            categories: {
              include: { category: true },
            },
            tags: {
              include: { tag: true },
            },
          },
        },
        _count: {
          select: {
            followers: true,
            following: true,
            blogs: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const formattedUser: UserProfile = {
      ...user,
      name: user.name || "",
      bio: user.bio || "",
      avatar: user.avatar || "",
      country: user.country || "",
      twitterAcc: user.twitterAcc || "",
      githubAcc: user.githubAcc || "",
      linkedinAcc: user.linkedinAcc || "",
      anotherAcc: user.anotherAcc || "",
      blogs: user.blogs.map((blog) => ({
        ...blog,
        categories: blog.categories.map((c) => c.category.name),
        tags: blog.tags.map((t) => t.tag.name),
      })),
    };

    return res.status(200).json(formattedUser);
  } catch (error) {
    console.error("Get user profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.user?.id;

    if (!followerId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (followerId === userId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId: userId,
      },
    });

    return res
      .status(200)
      .json({ message: "Successfully followed user", follow });
  } catch (error) {
    console.error("Follow user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const unfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.user?.id;

    if (!followerId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    return res.status(200).json({ message: "Successfully unfollowed user" });
  } catch (error) {
    console.error("Unfollow user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getFollowStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (currentUserId === userId) {
      return res
        .status(400)
        .json({ message: "Cannot check follow status for yourself" });
    }

    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    });

    return res.status(200).json({
      is_following: !!followRecord,
    });
  } catch (error) {
    console.error("Get follow status error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update the UpdateUserInput type first
interface UpdateUserInput {
  name?: string;
  bio?: string;
  country?: string;
  twitterAcc?: string;
  githubAcc?: string;
  linkedinAcc?: string;
  anotherAcc?: string;
}

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const {
      name,
      bio,
      country,
      twitterAcc,
      githubAcc,
      linkedinAcc,
      anotherAcc,
    }: UpdateUserInput = req.body;

    const avatarFile = req.file;
    let avatarUrl = undefined;

    if (avatarFile) {
      avatarUrl = avatarFile.path;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        bio: bio || undefined,
        avatar: avatarUrl || undefined,
        country: country || undefined,
        twitterAcc: twitterAcc || undefined,
        githubAcc: githubAcc || undefined,
        linkedinAcc: linkedinAcc || undefined,
        anotherAcc: anotherAcc || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatar: true,
        country: true,
        twitterAcc: true,
        githubAcc: true,
        linkedinAcc: true,
        anotherAcc: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
