import multer from "multer";
import path from "path";
import fs from "fs";

const tmpDir = path.join(process.cwd(), "tmp");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tmpDir),
    filename: (req, file, cb) => {
        const safe = Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
        cb(null, safe);
    },
});

// Image upload config for avatars and photos
export const uploadImage = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image files are allowed'), false);
            return;
        }
        const allowed = /jpeg|jpg|png|webp/;
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.test(ext.substring(1))) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG, PNG and WebP images are allowed'), false);
        }
    },
});