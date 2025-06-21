import { PrismaClient } from "@prisma/client";
import { generateUniqueUsername } from "../src/utils/userHelpers";

const prisma = new PrismaClient();

async function updateExistingUsers() {
  try {
    console.log("Starting to update existing users with usernames...");

    // Get all users (since username field is new, all existing users will need username)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    console.log(`Found ${users.length} users without username`);

    for (const user of users) {
      try {
        // Skip if user already has username
        if (user.username) {
          console.log(
            `User ${user.email} already has username: ${user.username}`
          );
          continue;
        }

        const username = await generateUniqueUsername(user.email);

        await prisma.user.update({
          where: { id: user.id },
          data: { username },
        });

        console.log(`Updated user ${user.email} with username: ${username}`);
      } catch (error) {
        console.error(`Failed to update user ${user.email}:`, error);
      }
    }

    console.log("Finished updating existing users");
  } catch (error) {
    console.error("Error updating existing users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingUsers();
