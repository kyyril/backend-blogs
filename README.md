# Blog API Backend

A RESTful API backend for a blog application built with TypeScript, Express.js, Supabase, and Prisma ORM.

## Features

- **User Authentication & Profiles**

  - Google OAuth authentication
  - View user profiles with stats
  - Follow/unfollow other users
  - Track profile views

- **Blog Management**

  - Create, read, update, and delete blog posts
  - Upload blog images to Cloudinary
  - View all blogs with pagination
  - Search blogs by query
  - Filter blogs by category
  - Track blog views and engagement

- **Social Features**

  - Follow other bloggers
  - View blogger's posts
  - Comment on blog posts
  - View follower/following counts

- **Analytics**
  - Blog view counts
  - Profile view tracking
  - Follower statistics

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: Google OAuth
- **File Storage**: Cloudinary
- **Validation**: Express Validator

## API Endpoints

### Authentication

#### Google Authentication

- **URL**: `/api/auth/google`
- **Method**: `POST`
- **Body**:

```json
{
  "token": "google-id-token"
}
```

- **Response**: User object

### Blogs

#### Create Blog

- **URL**: `/api/blogs`
- **Method**: `POST`
- **Auth**: Required
- **Body**: Form data with the following fields:

```json
{
  "title": "Getting Started with Next.js 15 and App Router",
  "description": "Learn how to build modern web applications with Next.js 15 and its revolutionary App Router architecture.",
  "content": "# Getting Started with Next.js 15 and App Router\n\nNext.js has revolutionized...",
  "categories": ["Web Development", "React"],
  "tags": ["nextjs", "react", "typescript", "app-router"],
  "readingTime": 5,
  "featured": true,
  "image": "[File Upload]"
}
```

#### Update Blog

- **URL**: `/api/blogs/:id`
- **Method**: `PUT`
- **Auth**: Required
- **Body**: Same as Create Blog

#### Delete Blog

- **URL**: `/api/blogs/:id`
- **Method**: `DELETE`
- **Auth**: Required

#### Get All Blogs

- **URL**: `/api/blogs?page=1&limit=10`
- **Method**: `GET`

#### Get Blog by ID

- **URL**: `/api/blogs/:id`
- **Method**: `GET`

#### Get Blog by Slug

- **URL**: `/api/blogs/:slug`
- **Method**: `GET`

#### Search Blogs

- **URL**: `/api/blogs/search?query=next.js&page=1&limit=10`
- **Method**: `GET`

#### Get Blogs by Category

- **URL**: `/api/blogs/category/:category?page=1&limit=10`
- **Method**: `GET`

#### Record Blog View

- **URL**: `/api/blogs/:id/view`
- **Method**: `POST`
- **Auth**: Required

### Users

#### Get User Profile

- **URL**: `/api/users/:userId`
- **Method**: `GET`
- **Response**:

```json
{
  "id": "user-uuid",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "bio": "Frontend Developer and Next.js enthusiast",
  "avatar": "https://example.com/avatar.jpg",
  "profileViews": 42,
  "_count": {
    "followers": 150,
    "following": 89,
    "blogs": 25
  },
  "blogs": [
    /* array of blog objects */
  ]
}
```

#### Follow User

- **URL**: `/api/users/:userId/follow`
- **Method**: `POST`
- **Auth**: Required

#### Unfollow User

- **URL**: `/api/users/:userId/follow`
- **Method**: `DELETE`
- **Auth**: Required

#### following Status

- **URL**: `/api/users/:userId/follow-status`
- **Method**: `GET`
- **Auth**: Required

### Comments

#### Create Comment

- **URL**: `/api/blogs/:blogId/comments`
- **Method**: `POST`
- **Auth**: Required
- **Body**:

```json
{
  "content": "Great article! Very informative."
}
```

#### Get Comments

- **URL**: `/api/blogs/:blogId/comments?page=1&limit=10`
- **Method**: `GET`
- **Response**:

```json
{
  "comments": [
    {
      "id": "comment-uuid",
      "content": "Great article! Very informative.",
      "createdAt": "2024-01-20T12:00:00Z",
      "author": {
        "id": "user-uuid",
        "name": "John Doe",
        "avatar": "https://example.com/avatar.jpg"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "pages": 3,
    "current": 1
  }
}
```

## Setup and Installation

1. **Clone the repository**

```bash
git clone https://github.com/kyyril/backend-blogs.git
cd backend-blogs
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file with the following variables:

```
# Server
PORT=5000
NODE_ENV=development

# Supabase
DATABASE_URL=your_supabase_postgres_connection_string
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Google Auth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
```

4. **Set up the database**

```bash
npx prisma migrate dev
```

5. **Start the development server**

```bash
npm run dev
```

## Project Structure

```
/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Middleware functions
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── types/          # TypeScript type definitions
│   └── index.ts        # Application entry point
├── prisma/
│   └── schema.prisma   # Prisma database schema
├── .env                # Environment variables
├── tsconfig.json       # TypeScript configuration
└── package.json       # Project dependencies
```
