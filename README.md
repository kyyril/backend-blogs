# Blog API Backend

A RESTful API backend for a blog application built with TypeScript, Express.js, Supabase, and Prisma ORM.

## Features

- **User Authentication & Profiles**

  - Google OAuth authentication
  - View user profiles with stats
  - Follow/unfollow other users

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

---

## Authentication

### Google Authentication

This section details the Google authentication flow, allowing users to sign in using their Google accounts.

- **URL**: `/api/auth/google`
- **Method**: `POST`
- **Body**:

  ```json
  {
    "token": "google-id-token"
  }
  ```

  The `token` field should contain the ID token obtained from the Google Sign-In client.

- **Response**:

  ```json
  {
    "message": "Google authentication successful",
    "user": {
      "id": "user-id",
      "name": "User Name",
      "email": "user@example.com",
      "bio": "User bio (if available)",
      "avatar": "URL to user's avatar"
    }
  }
  ```

  Upon successful authentication, the server sets `access_token` and `refresh_token` as HTTP-only cookies and returns the authenticated user object.

### Get Authenticated User

This endpoint allows a client to retrieve information about the currently authenticated user.

- **URL**: `/api/auth/me`
- **Method**: `GET`
- **Authentication**: Requires a valid `access_token` cookie.
- **Response**:

  ```json
  {
    "user": {
      "id": "user-id",
      "name": "User Name",
      "email": "user@example.com",
      "bio": "User bio (if available)",
      "avatar": "URL to user's avatar"
    }
  }
  ```

  Returns the user object if authenticated, otherwise a `401 Unauthorized` error.

### Refresh Access Token

This endpoint allows clients to obtain a new access token using a valid refresh token when the current access token expires.

- **URL**: `/api/auth/refresh-token`
- **Method**: `POST`
- **Authentication**: Requires a valid `refresh_token` cookie.
- **Response**:

  ```json
  {
    "message": "Token refreshed successfully",
    "user": {
      "id": "user-id",
      "name": "User Name",
      "email": "user@example.com",
      "bio": "User bio (if available)",
      "avatar": "URL to user's avatar"
    }
  }
  ```

  Upon successful token refresh, a new `access_token` cookie is set, and the user object is returned. If the refresh token is invalid or expired, both `access_token` and `refresh_token` cookies are cleared, and a `401 Unauthorized` error is returned.

### Logout

This endpoint logs out the user by clearing the authentication cookies.

- **URL**: `/api/auth/logout`
- **Method**: `POST`
- **Response**:

  ```json
  {
    "message": "Logout successful"
  }
  ```

  Clears both `access_token` and `refresh_token` HTTP-only cookies.

---

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

- **URL**: `/api/blogs/blog/:id`
- **Method**: `PUT`
- **Auth**: Required
- **Body**: Same as Create Blog

#### Delete Blog

- **URL**: `/api/blogs/blog/:id`
- **Method**: `DELETE`
- **Auth**: Required

#### Get All Blogs

- **URL**: `/api/blogs?page=1&limit=10`
- **Method**: `GET`

#### Get Blog by ID

- **URL**: `/api/blogs/blog/:id`
- **Method**: `GET`
- **Response**:

```json
{
  "id": "blog-uuid",
  "title": "Getting Started with Next.js 15",
  "slug": "getting-started-with-nextjs-15",
  "description": "Learn how to build modern web applications...",
  "content": "# Getting Started with Next.js 15...",
  "image": "https://example.com/blog-image.jpg",
  "date": "2024-01-20T12:00:00Z",
  "readingTime": 5,
  "featured": true,
  "viewCount": 1250,
  "likeCount": 42,
  "bookmarkCount": 15,
  "author": {
    "id": "user-uuid",
    "name": "Jane Smith",
    "bio": "Frontend Developer",
    "avatar": "https://example.com/avatar.jpg"
  },
  "categories": ["Web Development", "React"],
  "tags": ["nextjs", "react", "typescript"]
}
```

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

- **URL**: `/api/blogs/blog/:id/view`
- **Method**: `POST`
- **Auth**: Required

#### Like Blog

Toggles the like status of a blog for the authenticated user.

- **URL**: `/api/blogs/blog/:id/like`
- **Method**: `POST`
- **Auth**: Required
- **Response**:

```json
{
  "message": "Blog liked successfully",
  "liked": true,
  "likeCount": 42
}
```

Or when unliking:

```json
{
  "message": "Blog unliked successfully",
  "liked": false,
  "likeCount": 41
}
```

#### Bookmark Blog

Toggles the bookmark status of a blog for the authenticated user.

- **URL**: `/api/blogs/blog/:id/bookmark`
- **Method**: `POST`
- **Auth**: Required
- **Response**:

```json
{
  "message": "Blog bookmarked successfully",
  "bookmarked": true,
  "bookmarkCount": 15
}
```

Or when removing bookmark:

```json
{
  "message": "Blog bookmark removed successfully",
  "bookmarked": false,
  "bookmarkCount": 14
}
```

#### Get Blog Interaction Status

Returns the current user's interaction status with a blog (likes and bookmarks).

- **URL**: `/api/blogs/blog/:id/interaction`
- **Method**: `GET`
- **Auth**: Required
- **Response**:

```json
{
  "liked": true,
  "bookmarked": false,
  "likeCount": 42,
  "bookmarkCount": 15
}
```

### Users

#### Get User Profile

- **URL**: `/api/users/:userId`
- **Method**: `GET`
- **Auth**: Optional
- **Response**:

```json
{
  "id": "user-uuid",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "bio": "Frontend Developer and Next.js enthusiast",
  "avatar": "https://example.com/avatar.jpg",
  "country": "United States",
  "twitterAcc": "https://twitter.com/janesmith",
  "githubAcc": "https://github.com/janesmith",
  "linkedinAcc": "https://linkedin.com/in/janesmith",
  "anotherAcc": "",
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T12:00:00Z",
  "_count": {
    "followers": 150,
    "following": 89,
    "blogs": 25
  },
  "blogs": []
}
```

#### Update User Profile

Updates the authenticated user's profile information.

- **URL**: `/api/users/profile`
- **Method**: `PUT`
- **Auth**: Required
- **Body**:
  - Multipart form data that can include:

```json
{
  "name": "Jane Smith",
  "bio": "Frontend Developer and Next.js enthusiast",
  "country": "United States",
  "twitterAcc": "https://twitter.com/janesmith",
  "githubAcc": "https://github.com/janesmith",
  "linkedinAcc": "https://linkedin.com/in/janesmith",
  "anotherAcc": "",
  "avatar": "[File Upload]" // Optional profile image
}
```

- **Response**:

```json
{
  "id": "user-uuid",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "bio": "Frontend Developer and Next.js enthusiast",
  "avatar": "https://example.com/new-avatar.jpg",
  "country": "United States",
  "twitterAcc": "https://twitter.com/janesmith",
  "githubAcc": "https://github.com/janesmith",
  "linkedinAcc": "https://linkedin.com/in/janesmith",
  "anotherAcc": "",
  "createdAt": "2024-01-20T12:00:00Z",
  "updatedAt": "2024-01-20T13:00:00Z"
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
  "content": "Great article! Very informative.",
  "parentId": "optional-parent-comment-id" // Include for replies
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
      "authorId": "user-uuid",
      "parentId": null,
      "author": {
        "id": "user-uuid",
        "name": "John Doe",
        "avatar": "https://example.com/avatar.jpg"
      },
      "replies": [
        {
          "id": "reply-uuid",
          "content": "Thanks for your feedback!",
          "createdAt": "2024-01-20T12:30:00Z",
          "authorId": "author-uuid",
          "parentId": "comment-uuid",
          "author": {
            "id": "author-uuid",
            "name": "Jane Smith",
            "avatar": "https://example.com/jane-avatar.jpg"
          }
        }
      ]
    }
  ],
  "pagination": {
    "total": 25,
    "pages": 3,
    "current": 1
  }
}
```

#### Update Comment

- **URL**: `/api/comments/:id`
- **Method**: `PATCH`
- **Auth**: Required (only comment owner)
- **Body**:

```json
{
  "content": "Updated comment content"
}
```

#### Delete Comment

- **URL**: `/api/comments/:id`
- **Method**: `DELETE`
- **Auth**: Required (only comment owner)
- **Response**: Status 204 (No Content)

```

```

### TODO

## notification

Flow Notifikasi Komentar/like blog (Tanpa Real-Time)
1️⃣ User A menulis komentar di artikel blog/like blog milik User B melalui frontend.
➡️ frontend kirim request ke Express.js (POST /api/comments).
2️⃣ Express.js menyimpan komentar ke database.
➡️ Setelah komentar disimpan, Express.js juga menyimpan notifikasi untuk User B (post owner).
3️⃣ User B membuka halaman notifikasi di frontend.
➡️ frontend melakukan GET request ke Express.js (GET /api/notifications?userId=userB) untuk mengambil notifikasi.
4️⃣ User B membaca notifikasi (misalnya klik).
➡️ frontend kirim PATCH request ke Express.js (PATCH /api/notifications/:id) untuk menandai notifikasi sudah dibaca.

```

```
