// Admin controller
import Post from "../models/post.model.js";
import ModerationLog from "../models/moderation.model.js";

export const getPendingPosts = async (req, res) => {
  try {
    const posts = await Post.find({ approved: false }).populate("ownerId", "name email");
    res.json(posts);
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

    await ModerationLog.create({
      postId: post._id,
      adminId: req.body.adminId,
      action: "approve",
    });

    res.json({ message: "Post approved successfully", post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const rejectPost = async (req, res) => {
  try {
    const { reason, adminId } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    await ModerationLog.create({
      postId: post._id,
      adminId,
      action: "reject",
      reason,
    });

    

    res.json({ message: "Post rejected", reason });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getModerationLogs = async (req, res) => {
  try {
    const logs = await ModerationLog.find()
      .populate("postId", "title")
      .populate("adminId", "name email");
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
