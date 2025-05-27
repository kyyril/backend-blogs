import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "blog_images",
    format: async (req: any, file: any) => {
      // Convert the image to webp format for better compression
      return "webp";

      // Alternatively, you can determine format based on original file:
      // const ext = file.originalname.split('.').pop()?.toLowerCase();
      // return ext === 'png' ? 'png' : 'webp';
    },
    public_id: (req: any, file: any) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = file.originalname.split(".")[0];
      return filename + "-" + uniqueSuffix;
    },
  },
});

// Configure multer upload
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed") as any);
    }
  },
});

/**
 * Middleware to handle image upload
 */
export const uploadImage = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip upload if image URL is provided directly
  if (req.body.image && req.body.image.startsWith("http")) {
    return next();
  }

  // Process single file upload
  const uploadSingle = upload.single("image");

  uploadSingle(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // Multer error (file size, etc.)
        return res
          .status(400)
          .json({ message: `Upload error: ${err.message}` });
      } else {
        // Other errors
        return res.status(400).json({ message: err.message });
      }
    }

    // Continue to next middleware
    next();
  });
};
