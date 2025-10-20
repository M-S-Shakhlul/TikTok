import express from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  approvePost,
} from "../controllers/post.controller.js";

const router = express.Router();

router.post("/", createPost);
router.get("/", getAllPosts);
router.get("/:id", getPostById);
router.patch("/:id/approve", approvePost);

export default router;
