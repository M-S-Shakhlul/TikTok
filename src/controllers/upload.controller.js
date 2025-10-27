// src/controllers/upload.controller.js
import fs from "fs";
import path from "path";
import { uploadToCloudinary } from "../services/cloudinary.service.js";

export const testUpload = async(req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const filePath = req.file.path;

        // ارفعيه لـ Cloudinary
        const result = await uploadToCloudinary(filePath, "tiktok_test");

        // امسحي الملف المؤقت بعد الرفع
        fs.unlink(filePath, (err) => {
            if (err) console.warn("Temp file remove failed:", err.message);
        });

        // رجعي كل بيانات الـ upload (حتفيدنا لاحقًا)
        res.status(201).json({
            message: "Uploaded to Cloudinary successfully",
            public_id: result.public_id,
            url: result.secure_url,
            raw: result,
        });
    } catch (err) {
        // لو فيه ملف مؤقت، حاول تمسحه أيضاً
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        res.status(500).json({ message: "Upload failed", error: err.message });
    }
};