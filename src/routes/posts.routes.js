import express from "express";
import multer from "multer";
import {
  uploadVideoAndCreatePost,
  getAllPosts,
  getPostById,
  getUnapprovedPosts,
  approvePost,
  deletePost,
} from "../controllers/post.controller.js";

const router = express.Router();


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.post("/upload", upload.single("video"), uploadVideoAndCreatePost);
router.get("/", getAllPosts);
router.get("/:id", getPostById);
router.get("/admin/unapproved", getUnapprovedPosts);
router.patch("/:id/approve", approvePost);
router.delete("/:id", deletePost);

export default router;
