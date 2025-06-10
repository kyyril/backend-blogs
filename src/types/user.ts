export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  avatar: string | null;
  country: string | null;
  twitterAcc?: string;
  githubAcc?: string;
  linkedinAcc?: string;
  anotherAcc?: string;
  createdAt: Date;
  updatedAt: Date;
  blogs: {
    id: string;
    title: string;
    slug: string;
    description: string;
    categories: string[];
    tags: string[];
  }[];
  _count: {
    followers: number;
    following: number;
    blogs: number;
  };
}

export interface UpdateUserInput {
  name?: string;
  bio?: string;
  country?: string;
  twitterAcc?: string;
  githubAcc?: string;
  linkedinAcc?: string;
  anotherAcc?: string;
}
