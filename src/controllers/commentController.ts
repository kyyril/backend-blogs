import { Response } from "express";
import { prisma } from "../index";
import {
  AuthRequest,
  CommentResponse,
  PaginatedCommentsResponse,
} from "../types";

export const createComment = async (
  req: AuthRequest,
  res: Response<CommentResponse | { message: string }>
) => {
  try {
    const { blogId } = req.params;
    const { content, parentId } = req.body;
    const authorId = req.user?.id;

    if (!authorId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        blogId,
        authorId,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json(comment);
  } catch (error) {
    console.error("Create comment error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateComment = async (
  req: AuthRequest,
  res: Response<CommentResponse | { message: string }>
) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.authorId !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this comment" });
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return res.status(200).json(updatedComment);
  } catch (error) {
    console.error("Update comment error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.authorId !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    await prisma.comment.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Delete comment error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getComments = async (
  req: AuthRequest,
  res: Response<PaginatedCommentsResponse | { message: string }>
) => {
  try {
    const { blogId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: {
        blogId,
        parentId: null, // Only get top-level comments
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.comment.count({
      where: {
        blogId,
        parentId: null,
      },
    });

    return res.status(200).json({
      comments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
