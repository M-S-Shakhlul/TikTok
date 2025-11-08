// Admin controller
import mongoose from 'mongoose';
import Post from "../models/post.model.js";
import ModerationLog from "../models/moderation.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const getPendingPosts = async(req, res) => {
    try {
        const posts = await Post.find({ approved: false }).populate("ownerId", "name email");
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const approvePost = async(req, res) => {
    try {
        const rawId = (req.params.id || '').toString().trim();
        const id = rawId.startsWith(":") ? rawId.slice(1) : rawId;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid post id' });

        // Guarded update: only approve if not already approved
        const post = await Post.findOneAndUpdate({ _id: id, approved: false }, { approved: true }, { new: true });

        if (!post) {
            // Either not found or already approved
            const existing = await Post.findById(id);
            if (!existing) return res.status(404).json({ message: "Post not found" });
            return res.status(409).json({ message: "Post already approved" });
        }

        const adminId = req.user && req.user.id ? req.user.id : req.body.adminId;

        const log = await ModerationLog.create({
            postId: post._id,
            adminId,
            action: "approve",
        });

        // Notify owner
        try {
            await Notification.create({
                userId: post.ownerId,
                type: "approve",
                message: `✅ تم اعتماد الفيديو الخاص بك بعنوان "${post.title}"`,
                relatedPost: post._id,
            });
        } catch (notifErr) {
            console.error('approvePost: failed to create notification', notifErr);
        }

        // postsCount is handled centrally in the Post model hooks (avoid double increments)

        res.json({ message: "Post approved successfully", post, moderationLogId: log._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const rejectPost = async(req, res) => {
    try {
        const { reason, adminId } = req.body;
        const rawId = (req.params.id || '').toString().trim();
        const id = rawId.startsWith(":") ? rawId.slice(1) : rawId;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid post id' });
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const usedAdminId = req.user && req.user.id ? req.user.id : adminId;

        // Mark flagged / moderation reason
        post.isFlagged = true;
        post.moderationReason = reason || "Rejected by admin";
        post.approved = false; // ensure not approved
        await post.save();

        const log = await ModerationLog.create({
            postId: post._id,
            adminId: usedAdminId,
            action: "reject",
            reason,
        });

        // Optionally notify owner
        try {
            await Notification.create({
                userId: post.ownerId,
                type: "reject",
                message: `⛔ تم رفض الفيديو الخاص بك بعنوان "${post.title}"` + (reason ? ` — السبب: ${reason}` : ""),
                relatedPost: post._id,
            });
        } catch (notifErr) {
            console.error('rejectPost: failed to create notification', notifErr);
        }

        res.json({ message: "Post rejected", reason, moderationLogId: log._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getModerationLogs = async(req, res) => {
    try {
        const logs = await ModerationLog.find()
            .populate("postId", "title")
            .populate("adminId", "name email");
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};