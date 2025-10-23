// src/services/cloudinary.service.js
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (filePath, folder = "tiktok_videos") => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "video",
      folder,
      use_filename: true,
      unique_filename: false,
      chunk_size: 6000000, // for large uploads
    });
    return result; // كامل الكائن مفيد (secure_url, public_id, etc.)
  } catch (err) {
    throw err;
  }
};

