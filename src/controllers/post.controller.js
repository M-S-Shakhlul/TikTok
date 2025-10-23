import Post from "../models/post.model.js";
import User from "../models/user.model.js";

// 🆕 إنشاء بوست جديد
export const createPost = async (req, res) => {
  try {
    const { ownerId, title, videoUrl } = req.body;

    if (!ownerId || !title || !videoUrl) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const post = await Post.create(req.body);

    // ✅ زيادة عدد البوستات للمستخدم
    await User.findByIdAndUpdate(ownerId, { $inc: { postsCount: 1 } });

    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 📋 جلب كل البوستات (المعتمدة فقط)
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({ approved: true }).populate("ownerId", "name email");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔍 جلب بوست واحد
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("ownerId", "name email");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 🧩 جلب كل البوستات الخاصة بمستخدم معين
export const getPostsByUser = async (req, res) => {
  try {
    const posts = await Post.find({ ownerId: req.params.userId }).populate("ownerId", "name email");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ الموافقة على بوست (للأدمن)
export const approvePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json({ message: "Post approved successfully", post });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
