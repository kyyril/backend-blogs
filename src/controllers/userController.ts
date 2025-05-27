import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../types';

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        blogs: {
          include: {
            categories: {
              include: { category: true }
            },
            tags: {
              include: { tag: true }
            }
          }
        },
        _count: {
          select: {
            followers: true,
            following: true,
            blogs: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Increment profile views
    await prisma.user.update({
      where: { id: userId },
      data: { profileViews: { increment: 1 } }
    });

    const formattedUser = {
      ...user,
      blogs: user.blogs.map(blog => ({
        ...blog,
        categories: blog.categories.map(c => c.category.name),
        tags: blog.tags.map(t => t.tag.name)
      }))
    };

    return res.status(200).json(formattedUser);
  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.user?.id;

    if (!followerId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (followerId === userId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId: userId
      }
    });

    return res.status(200).json({ message: 'Successfully followed user', follow });
  } catch (error) {
    console.error('Follow user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const unfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.user?.id;

    if (!followerId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId
        }
      }
    });

    return res.status(200).json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};