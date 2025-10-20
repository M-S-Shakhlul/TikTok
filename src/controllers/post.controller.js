import Post from "../models/post.model.js";

// 🆕 إنشاء بوست جديد
export const createPost = async (req, res) => {
  try {
    const post = await Post.create(req.body);
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 📋 جلب كل البوستات
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("ownerId", "name email");
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

export const approvePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

