// Admin routes
import express from "express";
import {
  getPendingPosts,
  approvePost,
  rejectPost,
  getModerationLogs,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/pending-posts", getPendingPosts);
router.patch("/approve/:id", approvePost);
router.patch("/reject/:id", rejectPost);
router.get("/moderation-log", getModerationLogs);

export default router;
