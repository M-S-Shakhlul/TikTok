import mongoose from 'mongoose';
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Follow from "../models/follow.model.js";

// 🧩 إنشاء مستخدم جديد
export const createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 📋 جلب جميع المستخدمين
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 👤 عرض بروفايل مستخدم
export const getUserProfile = async (req, res) => {
  try {
  const rawId = (req.params.id || '').toString().trim();
  const id = rawId.startsWith(":") ? rawId.slice(1) : rawId;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid user id' });
  const user = await User.findById(id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🧮 إحصائيات
    const posts = await Post.find({ ownerId: user._id });
    const followers = await Follow.countDocuments({ followingId: user._id });
    const following = await Follow.countDocuments({ followerId: user._id });

    res.json({
      user,
      stats: {
        followers,
        following,
        postsCount: posts.length,
      },
      posts,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
