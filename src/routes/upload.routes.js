// src/routes/upload.routes.js
import express from "express";
import { testUpload } from "../controllers/upload.controller.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// key field للملف: "file"
router.post("/test", upload.single("file"), testUpload);

export default router;
