import mongoose from 'mongoose';
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
import ModerationLog from "../models/moderation.model.js";
import User from "../models/user.model.js";
import Comment from "../models/comment.model.js";
import Reply from "../models/reply.model.js";
import Like from "../models/like.model.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET,
});

export const uploadVideoAndCreatePost = async(req, res) => {
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

export const createPost = async(req, res) => {
    try {
        const userId = req.user && req.user.id;
        const { title, description, videoUrl, thumbnailUrl, tags } = req.body;

        if (!videoUrl) return res.status(400).json({ message: 'videoUrl is required' });

        const newPost = await Post.create({
            title,
            description,
            ownerId: userId || req.body.ownerId,
            videoUrl,
            thumbnailUrl,
            durationSec: req.body.durationSec || 0,
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
            approved: false,
        });

        res.status(201).json({ message: 'Post created (pending approval)', post: newPost });
    } catch (err) {
        console.error('createPost error', err);
        res.status(500).json({ error: err.message });
    }
};

export const getAllPosts = async(req, res) => {
    try {
        const posts = await Post.find({ approved: true }).populate("ownerId", "name email");
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getPostById = async(req, res) => {
    try {
        const rawId = (req.params.id || '').toString().trim();
        const id = rawId.startsWith(":") ? rawId.slice(1) : rawId;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid post id' });

        const post = await Post.findById(id).populate("ownerId", "name email");
        if (!post) return res.status(404).json({ message: "Post not found" });
        res.json(post);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getUnapprovedPosts = async(req, res) => {
    try {
        const pendingPosts = await Post.find({ approved: false }).populate("ownerId", "name email");
        res.json(pendingPosts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const approvePost = async(req, res) => {
    try {
        const rawId = (req.params.id || '').toString().trim();
        const id = rawId.startsWith(":") ? rawId.slice(1) : rawId;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid post id' });

        // Atomically approve the post only if it is currently unapproved
        const post = await Post.findOneAndUpdate({ _id: id, approved: false }, { approved: true }, { new: true });

        if (!post) {
            // Either post not found or already approved
            const existingPost = await Post.findById(id);
            if (!existingPost) return res.status(404).json({ message: 'Post not found' });
            return res.status(409).json({ message: 'Post already approved' });
        }

        // create notification
        try {
            await Notification.create({
                userId: post.ownerId,
                type: "approve",
                message: `✅ تم اعتماد الفيديو الخاص بك بعنوان "${post.title}"`,
                relatedPost: post._id,
            });
        } catch (notifErr) {
            console.error('post.approvePost: failed to create notification', notifErr);
        }

        // create moderation log (if admin info provided)
        try {
            const adminId = req.user && req.user.id ? req.user.id : req.body.adminId;
            await
            import ("../models/moderation.model.js").then(m => m.default.create({ postId: post._id, adminId, action: 'approve' }));
        } catch (logErr) {
            console.error('post.approvePost: failed to create moderation log', logErr);
        }

        res.json({ message: "✅ Post approved successfully and user notified", post });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const deletePost = async(req, res) => {
    try {
        // require authentication middleware to populate req.user
        if (!req.user) return res.status(401).json({ message: "Not authenticated" });

        const rawId = (req.params.id || '').toString().trim();
        const id = rawId.startsWith(":") ? rawId.slice(1) : rawId;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid post id' });
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const isAdmin = req.user && req.user.role === 'admin';
        const isOwner = req.user && post.ownerId && post.ownerId.toString() === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ message: 'Forbidden: only owner or admin can delete this post' });
        }

        // try to remove video from cloud storage (best-effort)
        try {
            if (post.videoUrl) {
                const publicId = post.videoUrl.split("/").slice(-2).join("/").split(".")[0];
                await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
            }
        } catch (cloudErr) {
            console.error('deletePost: cloudinary destroy failed', cloudErr);
        }

        // delete the post document using findByIdAndDelete so mongoose 'findOneAndDelete' hooks run
        await Post.findByIdAndDelete(id);

        // Cascade-delete related data: delete comments and likes one-by-one so model hooks run
        try {
            const comments = await Comment.find({ postId: id }).select('_id').lean();
            for (const c of comments) {
                try {
                    // this will trigger commentSchema.post('findOneAndDelete') which also removes replies and notifications
                    await Comment.findByIdAndDelete(c._id);
                } catch (e) {
                    console.error('deletePost: failed to delete comment', c._id, e);
                }
            }

            // delete likes one-by-one so like model hooks run and decrement post.likesCount
            const likes = await Like.find({ postId: id }).select('_id').lean();
            for (const l of likes) {
                try {
                    await Like.findByIdAndDelete(l._id);
                } catch (e) {
                    console.error('deletePost: failed to delete like', l._id, e);
                }
            }

            // finally remove any notifications directly tied to the post (notifications tied to comments/replies removed by comment hooks)
            await Notification.deleteMany({ relatedPost: id });
        } catch (cascadeErr) {
            console.error('deletePost: cascade cleanup failed', cascadeErr);
        }

        // postsCount is handled centrally in the Post model 'findOneAndDelete' hook

        // create moderation log if admin deleted
        try {
            if (isAdmin) {
                await ModerationLog.create({ postId: post._id, adminId: req.user.id, action: 'delete' });
                // notify owner
                try {
                    await Notification.create({
                        userId: post.ownerId,
                        type: 'delete',
                        message: `🗑️ تم حذف الفيديو الخاص بك بعنوان "${post.title}" بواسطة المشرف`
                    });
                } catch (notifErr) {
                    console.error('deletePost: failed to create notification', notifErr);
                }
            }
        } catch (logErr) {
            console.error('deletePost: failed to create moderation log', logErr);
        }

        res.json({ message: "🗑️ Post deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};