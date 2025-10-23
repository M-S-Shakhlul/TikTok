// src/middlewares/upload.middleware.js
import multer from "multer";
import path from "path";
import fs from "fs";

const tmpDir = path.join(process.cwd(), "tmp");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => {
    const safe = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, safe);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 150 * 1024 * 1024 }, // 150MB limit
  fileFilter: (req, file, cb) => {
    // قبول الفيديوهات فقط (يمكن تعديل حسب الحاجة)
    const allowed = /mp4|mov|webm|mkv/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error("Only video files are allowed"));
  },
});

