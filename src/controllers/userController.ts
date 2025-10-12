import { Request, Response } from "express";
import { prisma } from "../index";
import { AuthRequest } from "../types";
import { UserProfile } from "../types/user";
import { formatBlogData } from "../utils/blogHelpers";

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

    const followers = await prisma.follow.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    const following = await prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

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
      blogs: await Promise.all(
        user.blogs.map(async (blog) => {
          return await formatBlogData(blog, user.id);
        })
      ),
      followers: followers.map((follow) => follow.follower),
      following: following.map((follow) => follow.following),
    };

    return res.status(200).json(formattedUser);
  } catch (error) {
    console.error("Get user profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getUserProfileByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
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

    const followers = await prisma.follow.findMany({
      where: {
        followingId: user.id,
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    const following = await prisma.follow.findMany({
      where: {
        followerId: user.id,
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

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
      blogs: await Promise.all(
        user.blogs.map(async (blog) => {
          return await formatBlogData(blog, user.id);
        })
      ),
      followers: followers.map((follow) => follow.follower),
      following: following.map((follow) => follow.following),
    };

    return res.status(200).json(formattedUser);
  } catch (error) {
    console.error("Get user profile by username error:", error);
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

    // Get the uploaded avatar file from multer
    const avatarFile = req.file;
    let avatarUpdate = {};

    if (avatarFile) {
      // If new avatar was uploaded, use its Cloudinary URL
      avatarUpdate = {
        avatar: avatarFile.path,
      };
    } else if (req.body.avatar === null) {
      // If avatar was explicitly set to null, remove avatar
      avatarUpdate = {
        avatar: null,
      };
    }
    // If no avatar file and no explicit null, keep existing avatar

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        bio: bio || undefined,
        country: country || undefined,
        twitterAcc: twitterAcc || undefined,
        githubAcc: githubAcc || undefined,
        linkedinAcc: linkedinAcc || undefined,
        anotherAcc: anotherAcc || undefined,
        ...avatarUpdate,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
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

export const getUserFollowers = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const followers = await prisma.follow.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return res.status(200).json(followers.map((follow) => follow.follower));
  } catch (error) {
    console.error("Get user followers error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getUserFollowing = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const following = await prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return res.status(200).json(following.map((follow) => follow.following));
  } catch (error) {
    console.error("Get user following error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
