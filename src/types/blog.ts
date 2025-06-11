import { Request } from "express";

/**
 * TYPE DEFINITIONS FOR BLOG SYSTEM
 */

// Extended Request interface with authenticated user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
}

// Blog creation/update data
export interface BlogData {
  title: string;
  description: string;
  content: string;
  image?: string;
  readingTime?: number;
  featured?: boolean;
  categories?: string[];
  tags?: string[];
}

// Formatted blog response
export interface FormattedBlog {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  image: string;
  date: Date;
  readingTime: number;
  featured: boolean;
  authorId: string;
  author: {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
  };
  categories: string[];
  tags: string[];
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
  commentCount: number;
  liked: boolean;
  bookmarked: boolean;
}

// Pagination response
export interface PaginationResponse {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

// Blog list response
export interface BlogListResponse {
  blogs: FormattedBlog[];
  pagination: PaginationResponse;
}

// Blog search response
export interface BlogSearchResponse extends BlogListResponse {
  query?: string;
}

// Blog category response
export interface BlogCategoryResponse extends BlogListResponse {
  category: string;
}

// Blog interaction status
export interface BlogInteractionStatus {
  liked: boolean;
  bookmarked: boolean;
  likeCount: number;
  bookmarkCount: number;
  commentCount: number;
  viewCount: number;
}

// Blog statistics
export interface BlogStats {
  likeCount: number;
  bookmarkCount: number;
  commentCount: number;
  viewCount: number;
}

// User interaction status
export interface UserInteractionStatus {
  liked: boolean;
  bookmarked: boolean;
  viewed: boolean;
}

// Query parameters for blog endpoints
export interface BlogQueryParams {
  page?: string;
  limit?: string;
  query?: string;
  category?: string;
  featured?: string;
  sortBy?: "date" | "views" | "likes" | "bookmarks";
  sortOrder?: "asc" | "desc";
}

// Blog creation response
export interface BlogCreationResponse {
  success: boolean;
  message: string;
  blog: FormattedBlog;
}

// Blog update response
export interface BlogUpdateResponse {
  success: boolean;
  message: string;
  blog: FormattedBlog;
}

// Blog deletion response
export interface BlogDeletionResponse {
  success: boolean;
  message: string;
  deletedBlogId: string;
}

// Blog interaction response
export interface BlogInteractionResponse {
  success: boolean;
  message: string;
  liked?: boolean;
  bookmarked?: boolean;
  likeCount?: number;
  bookmarkCount?: number;
  viewCount?: number;
}

// Error response
export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: any;
}

// Success response generic
export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
}

// API Response union type
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;
