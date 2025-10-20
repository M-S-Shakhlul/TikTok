import express from "express";
import {
  followUser,
  getFollowers,
  getFollowing,
} from "../controllers/follow.controller.js";

const router = express.Router();

// ✅ POST: Create a new follow
router.post("/", followUser);

// ✅ GET: Get all followers of a user
router.get("/followers/:userId", getFollowers);

// ✅ GET: Get all users that a user follows
router.get("/following/:userId", getFollowing);

export default router;
