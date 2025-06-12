import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

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
    folder: (req: any, file: any) => {
      return file.fieldname === "avatar" ? "user_avatars" : "blog_images";
    },
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1000, crop: "limit" }],
    public_id: (req: any, file: any) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      return `${file.fieldname}_${uniqueSuffix}`;
    },
  } as any,
});

// Create multer instance
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!") as any);
    }
  },
});

// Export middleware functions
export const uploadBlogImage = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const uploadSingle = upload.single("image");

  uploadSingle(req, res, (err: any) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({
        message:
          err instanceof multer.MulterError
            ? `Upload error: ${err.message}`
            : err.message,
      });
    }

    // If no file was uploaded but image URL is provided in body, continue
    if (!req.file && req.body.image && req.body.image.startsWith("http")) {
      return next();
    }

    next();
  });
};

export const uploadAvatar = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const uploadSingle = upload.single("avatar");

  uploadSingle(req, res, (err: any) => {
    if (err) {
      console.error("Avatar upload error:", err);
      return res.status(400).json({
        message:
          err instanceof multer.MulterError
            ? `Upload error: ${err.message}`
            : err.message,
      });
    }
    next();
  });
};
