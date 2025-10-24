// Admin routes
import express from "express";
import {
  getPendingPosts,
  approvePost,
  rejectPost,
  getModerationLogs,
} from "../controllers/admin.controller.js";
import { authenticate, checkRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Protect all admin routes
router.use(authenticate);
router.use(checkRole(["admin"]));

router.get("/pending-posts", getPendingPosts);
router.patch("/approve/:id", approvePost);
router.patch("/reject/:id", rejectPost);
router.get("/moderation-log", getModerationLogs);

export default router;
