import express from "express";
import multer from "multer";
import {
  uploadVideoAndCreatePost,
  createPost,
  getAllPosts,
  getPostById,
  getUnapprovedPosts,
  approvePost,
  deletePost,
} from "../controllers/post.controller.js";
import { addComment, getCommentsByPost } from '../controllers/comment.controller.js';
import { authenticate, checkRole } from "../middlewares/auth.middleware.js";

const router = express.Router();


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.post("/upload", upload.single("video"), uploadVideoAndCreatePost);
// Create a post without uploading file (client can provide videoUrl)
router.post('/', authenticate, createPost);
router.get("/", getAllPosts);
router.get("/:id", getPostById);

// Comments on a post
router.post('/:id/comments', authenticate, addComment);
router.get('/:id/comments', getCommentsByPost);

// Admin-only endpoints for moderation
router.get("/admin/unapproved", authenticate, checkRole(["admin"]), getUnapprovedPosts);
router.patch("/:id/approve", authenticate, checkRole(["admin"]), approvePost);

router.delete("/:id", authenticate, deletePost);

export default router;
