import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

/**
 * Handle validation errors
 */
const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation error",
      errors: errors.array(),
    });
  }

  return next();
};

/**
 * Validate user registration
 */
export const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address"),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),

  handleValidationErrors,
];

/**
 * Validate user login
 */
export const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Must be a valid email address"),

  body("password").trim().notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

/**
 * Validate blog creation
 */
export const validateBlogCreation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ min: 50 })
    .withMessage("Content must be at least 50 characters"),

  body("categories")
    .custom((value) => {
      if (typeof value === "string") {
        // If it's a string, try to parse it as array
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error("Categories must be an array");
          }
          return true;
        } catch (error) {
          // If it's a comma-separated string, convert to array
          if (value.includes(",")) {
            return true;
          }
          throw new Error(
            "Categories must be an array or comma-separated string"
          );
        }
      }
      // If it's already an array
      if (Array.isArray(value)) {
        return true;
      }
      throw new Error("Categories must be an array or comma-separated string");
    })
    .notEmpty()
    .withMessage("At least one category is required"),

  body("tags").custom((value) => {
    if (typeof value === "string") {
      // If it's a string, try to parse it as array
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) {
          throw new Error("Tags must be an array");
        }
        return true;
      } catch (error) {
        // If it's a comma-separated string, convert to array
        if (value.includes(",")) {
          return true;
        }
        throw new Error("Tags must be an array or comma-separated string");
      }
    }
    // If it's already an array
    if (Array.isArray(value)) {
      return true;
    }
    throw new Error("Tags must be an array or comma-separated string");
  }),

  body("readingTime")
    .isInt({ min: 1 })
    .withMessage("Reading time must be a positive integer"),

  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be a boolean"),

  handleValidationErrors,
];

/**
 * Validate blog update
 */
export const validateBlogUpdate = [
  // Only validate fields if they are present in the request
  body("title")
    .if(body("title").exists())
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),

  body("description")
    .if(body("description").exists())
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),

  body("content")
    .if(body("content").exists())
    .trim()
    .isLength({ min: 50 })
    .withMessage("Content must be at least 50 characters"),

  body("categories")
    .if(body("categories").exists())
    .custom((value) => {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error("Categories must be an array");
          }
          return true;
        } catch (error) {
          if (value.includes(",")) {
            return true;
          }
          throw new Error(
            "Categories must be an array or comma-separated string"
          );
        }
      }
      if (Array.isArray(value)) {
        return true;
      }
      throw new Error("Categories must be an array or comma-separated string");
    }),

  body("tags")
    .if(body("tags").exists())
    .custom((value) => {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error("Tags must be an array");
          }
          return true;
        } catch (error) {
          if (value.includes(",")) {
            return true;
          }
          throw new Error("Tags must be an array or comma-separated string");
        }
      }
      if (Array.isArray(value)) {
        return true;
      }
      throw new Error("Tags must be an array or comma-separated string");
    }),

  body("readingTime")
    .if(body("readingTime").exists())
    .isInt({ min: 1 })
    .withMessage("Reading time must be a positive integer"),

  body("featured")
    .if(body("featured").exists())
    .isBoolean()
    .withMessage("Featured must be a boolean"),

  handleValidationErrors,
];
