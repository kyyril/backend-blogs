import gql from "graphql-tag";

export const typeDefs = gql`
  # ==========================================
  # TYPES
  # ==========================================

  type User {
    id: ID!
    email: String!
    username: String!
    name: String!
    bio: String
    avatar: String
    country: String
    twitterAcc: String
    githubAcc: String
    linkedinAcc: String
    anotherAcc: String
    createdAt: String!
    profileViews: Int!
    blogs: [Blog!]!
    followerCount: Int!
    followingCount: Int!
  }

  type Author {
    id: ID!
    username: String!
    name: String!
    avatar: String
  }

  type Category {
    id: ID!
    name: String!
  }

  type Tag {
    id: ID!
    name: String!
  }

  type Blog {
    id: ID!
    slug: String!
    title: String!
    description: String!
    date: String!
    image: String!
    content: String!
    readingTime: Int!
    featured: Boolean!
    createdAt: String!
    updatedAt: String!
    viewCount: Int!
    author: Author!
    categories: [Category!]!
    tags: [Tag!]!
    likeCount: Int!
    commentCount: Int!
    bookmarkCount: Int!
  }

  type BlogConnection {
    blogs: [Blog!]!
    pagination: Pagination!
  }

  type Pagination {
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
    limit: Int!
  }

  type FeaturedBlogsResponse {
    featuredBlogs: [Blog!]!
  }

  type CategoryBlogsResponse {
    category: String!
    blogs: [Blog!]!
    pagination: Pagination!
  }

  type UserProfile {
    id: ID!
    email: String!
    username: String!
    name: String!
    bio: String
    avatar: String
    country: String
    twitterAcc: String
    githubAcc: String
    linkedinAcc: String
    anotherAcc: String
    createdAt: String!
    profileViews: Int!
    followerCount: Int!
    followingCount: Int!
    blogCount: Int!
    totalViews: Int!
    blogs: BlogConnection!
  }

  # ==========================================
  # QUERIES
  # ==========================================

  type Query {
    # Blog Queries
    blogs(page: Int, limit: Int): BlogConnection!
    blog(slug: String, id: ID): Blog
    searchBlogs(query: String!, page: Int, limit: Int): BlogConnection!
    featuredBlogs(limit: Int): FeaturedBlogsResponse!
    blogsByCategory(category: String!, page: Int, limit: Int): CategoryBlogsResponse!
    blogsByTags(tags: String!, page: Int, limit: Int): BlogConnection!

    # User Queries
    user(username: String!): UserProfile
    users(page: Int, limit: Int): [User!]!

    # Category & Tag Queries
    categories: [Category!]!
    tags: [Tag!]!
  }
`;
