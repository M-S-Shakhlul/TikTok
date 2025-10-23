import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

export const uploadVideoAndCreatePost = async (req, res) => {
  try {
    const { title, description, ownerId, tags } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No video uploaded" });
    if (!file.mimetype.startsWith("video/"))
      return res.status(400).json({ message: "Only video files are allowed" });

    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "video",
      folder: "tiktok_videos",
    });

    fs.unlinkSync(file.path);

    const newPost = await Post.create({
      title,
      description,
      ownerId,
      videoUrl: result.secure_url,
      thumbnailUrl: result.secure_url + "#t=0.5", 
      durationSec: Math.round(result.duration),
      tags: tags ? tags.split(",") : [],
      approved: false,
    });

    res.status(201).json({
      message: "🎥 Video uploaded successfully. Pending admin approval.",
      post: newPost,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({ approved: true }).populate("ownerId", "name email");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("ownerId", "name email");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getUnapprovedPosts = async (req, res) => {
  try {
    const pendingPosts = await Post.find({ approved: false }).populate("ownerId", "name email");
    res.json(pendingPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approvePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );

    if (!post) return res.status(404).json({ message: "Post not found" });

    await Notification.create({
      userId: post.ownerId,
      type: "approve",
      message: `✅ تم اعتماد الفيديو الخاص بك بعنوان "${post.title}"`,
      relatedPost: post._id,
    });

    res.json({ message: "✅ Post approved successfully and user notified", post });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const publicId = post.videoUrl.split("/").slice(-2).join("/").split(".")[0];
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });

    await post.deleteOne();
    res.json({ message: "🗑️ Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
