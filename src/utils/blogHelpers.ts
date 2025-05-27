import { prisma } from '../index';

/**
 * Handle categories for a blog post
 */
export const handleCategories = async (blogId: string, categories: string[]) => {
  // Process each category
  for (const categoryName of categories) {
    // Find or create the category
    let category = await prisma.category.findUnique({
      where: { name: categoryName }
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: categoryName }
      });
    }

    // Create the relation
    await prisma.categoryOnBlog.create({
      data: {
        blogId,
        categoryId: category.id
      }
    });
  }
};

/**
 * Handle tags for a blog post
 */
export const handleTags = async (blogId: string, tags: string[]) => {
  // Process each tag
  for (const tagName of tags) {
    // Find or create the tag
    let tag = await prisma.tag.findUnique({
      where: { name: tagName }
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: { name: tagName }
      });
    }

    // Create the relation
    await prisma.tagOnBlog.create({
      data: {
        blogId,
        tagId: tag.id
      }
    });
  }
};