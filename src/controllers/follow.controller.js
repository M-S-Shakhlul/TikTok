import Follow from "../models/follow.model.js";
import User from "../models/user.model.js";

// ✅ لما يوزر يتابع يوزر تاني
export const followUser = async (req, res) => {
  try {
    const { followerId, followingId } = req.body;

    // لو بيحاول يتابع نفسه
    if (followerId === followingId) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    // اتأكد إن المتابعة مش موجودة أصلاً
    const existing = await Follow.findOne({ followerId, followingId });
    if (existing) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // إنشاء المتابعة
    const follow = await Follow.create({ followerId, followingId });

    // تحديث العدادات في الـ Users (اختياري حاليًا)
    await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });

    res.status(201).json({
      message: "Followed successfully",
      data: follow,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ جلب كل المتابعين لمستخدم معين
export const getFollowers = async (req, res) => {
  try {
    const followers = await Follow.find({ followingId: req.params.userId })
      .populate("followerId", "name email");
    res.json(followers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ جلب كل الناس اللي بيتابعهم المستخدم
export const getFollowing = async (req, res) => {
  try {
    const following = await Follow.find({ followerId: req.params.userId })
      .populate("followingId", "name email");
    res.json(following);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
