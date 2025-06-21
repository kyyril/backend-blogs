import { prisma } from "../index";

/**
 * Generate a unique username from email
 * @param email - User's email address
 * @returns Promise<string> - Unique username
 */
export const generateUniqueUsername = async (email: string): Promise<string> => {
  // Extract the part before @ from email
  const baseUsername = email.split('@')[0].toLowerCase();
  
  // Remove any non-alphanumeric characters and replace with underscore
  const cleanUsername = baseUsername.replace(/[^a-z0-9]/g, '_');
  
  let username = cleanUsername;
  let counter = 1;

  // Check if username already exists and generate unique one
  while (true) {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!existingUser) {
      return username;
    }

    // If username exists, append counter
    username = `${cleanUsername}_${counter}`;
    counter++;
  }
};

/**
 * Validate username format
 * @param username - Username to validate
 * @returns boolean - True if valid
 */
export const isValidUsername = (username: string): boolean => {
  // Username should be 3-30 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-z0-9_]{3,30}$/;
  return usernameRegex.test(username);
};
