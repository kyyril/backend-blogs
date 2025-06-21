import { FormattedBlog } from "./blog";

export {};

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  name: string;
  bio: string;
  avatar: string | null;
  country: string;
  twitterAcc: string;
  githubAcc: string;
  linkedinAcc: string;
  anotherAcc: string;
  createdAt: Date;
  updatedAt: Date;
  profileViews: number;
  blogs: FormattedBlog[];
  followers: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  }[];
  following: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  }[];
}
