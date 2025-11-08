import mongoose from 'mongoose';
import Follow from "../models/follow.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

// ✅ Follow a user (auth required). targetUserId in URL, follower comes from req.user.id
export const followUser = async(req, res) => {
    try {
        const followerId = req.user && req.user.id;
        const followingId = (req.params.targetUserId || '').toString().trim();

        if (!followerId) return res.status(401).json({ message: 'Not authenticated' });
        if (!mongoose.isValidObjectId(followingId)) return res.status(400).json({ message: 'Invalid target user id' });

        if (followerId === followingId) return res.status(400).json({ message: "You can't follow yourself" });

        // check existing
        const existing = await Follow.findOne({ followerId, followingId });
        if (existing) return res.status(409).json({ message: 'Already following this user' });

        // create follow (model middleware will update user counts)
        const follow = await Follow.create({ followerId, followingId });

        // create notification for target user (best-effort)
        try {
            await Notification.create({
                userId: followingId,
                senderId: followerId,
                type: 'follow',
                message: `👥 ${req.user.name || 'Someone'} started following you.`,
            });
        } catch (e) {
            console.error('followUser: notification failed', e);
        }

        res.status(201).json({ message: 'Followed successfully', data: follow });
    } catch (err) {
        // handle duplicate key due to race (unique index)
        if (err && err.code === 11000) return res.status(409).json({ message: 'Already following this user' });
        res.status(500).json({ error: err.message });
    }
};

// ✅ Unfollow a user (auth required)
export const unfollowUser = async(req, res) => {
    try {
        const followerId = req.user && req.user.id;
        const followingId = (req.params.targetUserId || '').toString().trim();

        if (!followerId) return res.status(401).json({ message: 'Not authenticated' });
        if (!mongoose.isValidObjectId(followingId)) return res.status(400).json({ message: 'Invalid target user id' });

        const result = await Follow.findOneAndDelete({ followerId, followingId });
        if (!result) return res.status(404).json({ message: 'Follow relation not found' });

        // model middleware (followSchema.post('findOneAndDelete')) will decrement counts

        // remove follow notification (best-effort)
        try {
            await Notification.findOneAndDelete({ userId: followingId, senderId: followerId, type: 'follow' });
        } catch (e) {
            console.error('unfollowUser: failed to remove notification', e);
        }

        res.json({ message: 'Unfollowed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Get followers of a user (with basic pagination)
export const getFollowers = async(req, res) => {
    try {
        const userId = (req.params.userId || '').toString().trim();
        if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: 'Invalid user id' });

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;

        const followers = await Follow.find({ followingId: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('followerId', 'name email avatarUrl');

        const total = await Follow.countDocuments({ followingId: userId });
        res.json({ total, page, limit, data: followers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅ Get users that a given user is following (with pagination)
export const getFollowing = async(req, res) => {
    try {
        const userId = (req.params.userId || '').toString().trim();
        if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: 'Invalid user id' });

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;

        const following = await Follow.find({ followerId: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('followingId', 'name email avatarUrl');

        const total = await Follow.countDocuments({ followerId: userId });
        res.json({ total, page, limit, data: following });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};