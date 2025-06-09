import { Request } from "express";

/**
 * Extended Request interface with user property
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    bio?: string;
    avatar?: string;
  };
  file?: {
    path: string;
    filename: string;
  };
}

/**
 * Blog payload interface
 */
export interface BlogPayload {
  slug: string;
  title: string;
  description: string;
  date: string;
  image: string;
  content: string;
  author: {
    name: string;
    bio: string;
    avatar: string;
  };
  categories: string[];
  tags: string[];
  readingTime: number;
  featured: boolean;
}

/**
 * Comment payload interface
 */
export interface CommentPayload {
  content: string;
  parentId?: string;
}

/**
 * Comment response interface
 */
export interface CommentResponse {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  blogId: string;
  authorId: string;
  parentId: string | null;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  replies?: CommentResponse[];
}

/**
 * Paginated comments response interface
 */
export interface PaginatedCommentsResponse {
  comments: CommentResponse[];
  pagination: {
    total: number;
    pages: number;
    current: number;
  };
}
