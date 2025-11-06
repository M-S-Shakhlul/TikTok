import express from "express";
import {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
} from "../controllers/follow.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ✅ Follow a user (auth required) - target user id in URL
router.post("/:targetUserId", authenticate, followUser);

// ✅ Unfollow a user (auth required)
router.delete("/:targetUserId", authenticate, unfollowUser);

// ✅ GET: Get all followers of a user
router.get("/followers/:userId", getFollowers);

// ✅ GET: Get all users that a user follows
router.get("/following/:userId", getFollowing);

export default router;