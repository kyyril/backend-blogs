import { prisma } from "../index";
import { getBlogIncludeOptions } from "../utils/blogHelpers";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Format blog data for GraphQL response
 */
const formatBlogForGraphQL = async (blog: any) => {
    const [likeCount, bookmarkCount, commentCount] = await Promise.all([
        prisma.blogLike.count({ where: { blogId: blog.id } }),
        prisma.blogBookmark.count({ where: { blogId: blog.id } }),
        prisma.comment.count({ where: { blogId: blog.id } }),
    ]);

    return {
        ...blog,
        date: blog.date.toISOString(),
        createdAt: blog.createdAt.toISOString(),
        updatedAt: blog.updatedAt.toISOString(),
        author: {
            id: blog.author.id,
            username: blog.author.username,
            name: blog.author.name,
            avatar: blog.author.avatar,
        },
        categories: blog.categories?.map((c: any) => ({
            id: c.category.id,
            name: c.category.name,
        })) || [],
        tags: blog.tags?.map((t: any) => ({
            id: t.tag.id,
            name: t.tag.name,
        })) || [],
        likeCount,
        bookmarkCount,
        commentCount,
    };
};

// ==========================================
// RESOLVERS
// ==========================================

export const resolvers = {
    Query: {
        // ========================================
        // BLOG QUERIES
        // ========================================

        /**
         * Get all blogs with pagination
         */
        blogs: async (_: any, args: { page?: number; limit?: number }) => {
            const page = args.page || 1;
            const limit = args.limit || 10;
            const skip = (page - 1) * limit;

            const totalCount = await prisma.blog.count();

            const blogs = await prisma.blog.findMany({
                skip,
                take: limit,
                orderBy: { date: "desc" },
                include: getBlogIncludeOptions(),
            });

            const formattedBlogs = await Promise.all(
                blogs.map((blog) => formatBlogForGraphQL(blog))
            );

            return {
                blogs: formattedBlogs,
                pagination: {
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: page,
                    limit,
                },
            };
        },

        /**
         * Get a single blog by slug or ID
         */
        blog: async (_: any, args: { slug?: string; id?: string }) => {
            if (!args.slug && !args.id) {
                throw new Error("Either slug or id is required");
            }

            const blog = await prisma.blog.findUnique({
                where: args.slug ? { slug: args.slug } : { id: args.id },
                include: getBlogIncludeOptions(),
            });

            if (!blog) {
                return null;
            }

            return formatBlogForGraphQL(blog);
        },

        /**
         * Search blogs
         */
        searchBlogs: async (
            _: any,
            args: { query: string; page?: number; limit?: number }
        ) => {
            const page = args.page || 1;
            const limit = args.limit || 10;
            const skip = (page - 1) * limit;

            const whereClause = {
                OR: [
                    { title: { contains: args.query, mode: "insensitive" as const } },
                    { description: { contains: args.query, mode: "insensitive" as const } },
                    { content: { contains: args.query, mode: "insensitive" as const } },
                ],
            };

            const totalCount = await prisma.blog.count({ where: whereClause });

            const blogs = await prisma.blog.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { date: "desc" },
                include: getBlogIncludeOptions(),
            });

            const formattedBlogs = await Promise.all(
                blogs.map((blog) => formatBlogForGraphQL(blog))
            );

            return {
                blogs: formattedBlogs,
                pagination: {
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: page,
                    limit,
                },
            };
        },

        /**
         * Get featured blogs
         */
        featuredBlogs: async (_: any, args: { limit?: number }) => {
            const limit = args.limit || 5;

            const blogs = await prisma.blog.findMany({
                where: { featured: true },
                take: limit,
                orderBy: { date: "desc" },
                include: getBlogIncludeOptions(),
            });

            const formattedBlogs = await Promise.all(
                blogs.map((blog) => formatBlogForGraphQL(blog))
            );

            return {
                featuredBlogs: formattedBlogs,
            };
        },

        /**
         * Get blogs by category
         */
        blogsByCategory: async (
            _: any,
            args: { category: string; page?: number; limit?: number }
        ) => {
            const page = args.page || 1;
            const limit = args.limit || 10;
            const skip = (page - 1) * limit;

            const categoryEntity = await prisma.category.findFirst({
                where: { name: { equals: args.category, mode: "insensitive" } },
            });

            if (!categoryEntity) {
                return {
                    category: args.category,
                    blogs: [],
                    pagination: {
                        totalCount: 0,
                        totalPages: 0,
                        currentPage: page,
                        limit,
                    },
                };
            }

            const whereClause = {
                categories: {
                    some: { categoryId: categoryEntity.id },
                },
            };

            const totalCount = await prisma.blog.count({ where: whereClause });

            const blogs = await prisma.blog.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { date: "desc" },
                include: getBlogIncludeOptions(),
            });

            const formattedBlogs = await Promise.all(
                blogs.map((blog) => formatBlogForGraphQL(blog))
            );

            return {
                category: categoryEntity.name,
                blogs: formattedBlogs,
                pagination: {
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: page,
                    limit,
                },
            };
        },

        /**
         * Get blogs by tags
         */
        blogsByTags: async (
            _: any,
            args: { tags: string; page?: number; limit?: number }
        ) => {
            const page = args.page || 1;
            const limit = args.limit || 10;
            const skip = (page - 1) * limit;

            const tagList = args.tags.split(",").map((tag) => tag.trim());

            const tagEntities = await prisma.tag.findMany({
                where: { name: { in: tagList } },
            });

            if (tagEntities.length === 0) {
                return {
                    blogs: [],
                    pagination: {
                        totalCount: 0,
                        totalPages: 0,
                        currentPage: page,
                        limit,
                    },
                };
            }

            const tagIds = tagEntities.map((tag) => tag.id);

            const tagOnBlogRecords = await prisma.tagOnBlog.findMany({
                where: { tagId: { in: tagIds } },
                select: { blogId: true },
            });

            const blogIds = tagOnBlogRecords.map((record) => record.blogId);

            const totalCount = await prisma.blog.count({
                where: { id: { in: blogIds } },
            });

            const blogs = await prisma.blog.findMany({
                where: { id: { in: blogIds } },
                skip,
                take: limit,
                orderBy: { date: "desc" },
                include: getBlogIncludeOptions(),
            });

            const formattedBlogs = await Promise.all(
                blogs.map((blog) => formatBlogForGraphQL(blog))
            );

            return {
                blogs: formattedBlogs,
                pagination: {
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: page,
                    limit,
                },
            };
        },

        // ========================================
        // USER QUERIES
        // ========================================

        /**
         * Get user profile by username
         */
        user: async (_: any, args: { username: string }) => {
            const user = await prisma.user.findUnique({
                where: { username: args.username },
                include: {
                    blogs: {
                        take: 10,
                        orderBy: { date: "desc" },
                        include: getBlogIncludeOptions(),
                    },
                    followers: true,
                    following: true,
                },
            });

            if (!user) {
                return null;
            }

            // Get total stats
            const [blogCount, totalViews] = await Promise.all([
                prisma.blog.count({ where: { authorId: user.id } }),
                prisma.blogView.count({
                    where: { blog: { authorId: user.id } },
                }),
            ]);

            const formattedBlogs = await Promise.all(
                user.blogs.map((blog: any) => formatBlogForGraphQL(blog))
            );

            return {
                ...user,
                createdAt: user.createdAt.toISOString(),
                followerCount: user.followers.length,
                followingCount: user.following.length,
                blogCount,
                totalViews,
                blogs: {
                    blogs: formattedBlogs,
                    pagination: {
                        totalCount: blogCount,
                        totalPages: Math.ceil(blogCount / 10),
                        currentPage: 1,
                        limit: 10,
                    },
                },
            };
        },

        /**
         * Get all users (basic list)
         */
        users: async (_: any, args: { page?: number; limit?: number }) => {
            const page = args.page || 1;
            const limit = args.limit || 10;
            const skip = (page - 1) * limit;

            const users = await prisma.user.findMany({
                skip,
                take: limit,
                include: {
                    followers: true,
                    following: true,
                },
            });

            return users.map((user) => ({
                ...user,
                createdAt: user.createdAt.toISOString(),
                followerCount: user.followers.length,
                followingCount: user.following.length,
            }));
        },

        // ========================================
        // CATEGORY & TAG QUERIES
        // ========================================

        /**
         * Get all categories
         */
        categories: async () => {
            return prisma.category.findMany({
                orderBy: { name: "asc" },
            });
        },

        /**
         * Get all tags
         */
        tags: async () => {
            return prisma.tag.findMany({
                orderBy: { name: "asc" },
            });
        },
    },
};
