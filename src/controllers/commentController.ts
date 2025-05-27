import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../types';

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { blogId } = req.params;
    const { content } = req.body;
    const authorId = req.user?.id;

    if (!authorId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        blogId,
        authorId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    return res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { blogId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: { blogId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    const total = await prisma.comment.count({ where: { blogId } });

    return res.status(200).json({
      comments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};