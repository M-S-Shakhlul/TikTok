import mongoose from 'mongoose';
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Follow from "../models/follow.model.js";
import Comment from "../models/comment.model.js";
import Reply from "../models/reply.model.js";
import Like from "../models/like.model.js";
import Notification from "../models/notification.model.js";
import { v2 as cloudinary } from "cloudinary";

// 🧩 إنشاء مستخدم جديد
export const createUser = async(req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// 📋 جلب جميع المستخدمين
export const getAllUsers = async(req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 👤 عرض بروفايل مستخدم
export const getUserProfile = async(req, res) => {
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

// � Update user profile
export const updateUserProfile = async(req, res) => {
    try {
        const rawId = (req.params.id || '').toString().trim();
        const id = rawId.startsWith(":") ? rawId.slice(1) : rawId;

        // Validate user ID
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid user id' });
        }

        // Ensure user is authenticated and authorized
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const isAdmin = req.user && req.user.role === 'admin';
        const isSelf = req.user.id === id;

        if (!isAdmin && !isSelf) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        // Get the current user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Extract allowed update fields
        const updates = {};
        const allowedUpdates = ['username', 'email', 'bio', 'avatar'];

        for (const field of allowedUpdates) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        // Handle avatar update if there's a file
        if (req.file) {
            try {
                // Delete old avatar if it exists
                if (user.avatar && user.avatar.includes('cloudinary')) {
                    try {
                        const publicId = user.avatar.split("/").slice(-2).join("/").split(".")[0];
                        await cloudinary.uploader.destroy(publicId);
                    } catch (e) {
                        console.error('Failed to delete old avatar:', e);
                    }
                }

                // Upload new avatar
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'avatars',
                    transformation: [
                        { width: 500, height: 500, crop: 'fill' },
                        { quality: 'auto' }
                    ]
                });

                updates.avatar = result.secure_url;
            } catch (error) {
                console.error('Avatar upload failed:', error);
                return res.status(500).json({ message: 'Failed to upload avatar' });
            }
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            id, { $set: updates }, { new: true, runValidators: true }
        ).select('-passwordHash');

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (err) {
        console.error('updateUserProfile error:', err);
        res.status(500).json({ error: err.message });
    }
};

// �🗑️ Delete a user and cascade-delete their related data (posts, comments, replies, likes, follows, notifications)
export const deleteUser = async(req, res) => {
    try {
        const rawId = (req.params.id || '').toString().trim();
        const id = rawId.startsWith(":") ? rawId.slice(1) : rawId;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid user id' });

        // auth: only the user themself or admin can delete
        if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
        const isAdmin = req.user && req.user.role === 'admin';
        const isSelf = req.user.id === id;
        if (!isAdmin && !isSelf) return res.status(403).json({ message: 'Forbidden' });

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 1) Delete user's posts (and cascade their related data)
        try {
            const posts = await Post.find({ ownerId: id }).select('_id videoUrl title approved ownerId').lean();
            for (const p of posts) {
                try {
                    // attempt cloudinary removal (best-effort)
                    if (p.videoUrl) {
                        try {
                            const publicId = p.videoUrl.split("/").slice(-2).join("/").split(".")[0];
                            await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
                        } catch (e) {
                            console.error('deleteUser: cloudinary destroy failed for post', p._id, e.message);
                        }
                    }

                    // delete post document
                    await Post.findByIdAndDelete(p._id);

                    // cascade-cleanup: delete comments, replies, likes, notifications related to this post
                    const comments = await Comment.find({ postId: p._id }).select('_id').lean();
                    for (const c of comments) {
                        try {
                            // triggers comment post-delete hook (removes replies & notifications)
                            await Comment.findByIdAndDelete(c._id);
                        } catch (e) {
                            console.error('deleteUser: failed to delete comment', c._id, e);
                        }
                    }

                    // delete likes one-by-one so like hooks update post counts
                    const likes = await Like.find({ postId: p._id }).select('_id').lean();
                    for (const l of likes) {
                        try {
                            await Like.findByIdAndDelete(l._id);
                        } catch (e) {
                            console.error('deleteUser: failed to delete like', l._id, e);
                        }
                    }

                    // remove notifications directly tied to the post
                    await Notification.deleteMany({ relatedPost: p._id });

                    // postsCount decrements are handled in Post model hooks (findOneAndDelete)
                } catch (postErr) {
                    console.error('deleteUser: failed to delete post', p._id, postErr);
                }
            }
        } catch (postsErr) {
            console.error('deleteUser: failed fetching/cleaning posts', postsErr);
        }

        // 2) Delete comments authored by user (use findByIdAndDelete per comment to trigger model hooks)
        try {
            const userComments = await Comment.find({ userId: id }).select('_id').lean();
            for (const c of userComments) {
                try {
                    await Comment.findByIdAndDelete(c._id);
                } catch (e) {
                    console.error('deleteUser: failed to delete comment', c._id, e);
                }
            }
        } catch (cErr) {
            console.error('deleteUser: failed deleting user comments', cErr);
        }

        // 3) Delete replies authored by user
        try {
            const userReplies = await Reply.find({ userId: id }).select('_id').lean();
            for (const r of userReplies) {
                try {
                    await Reply.findByIdAndDelete(r._id);
                } catch (e) {
                    console.error('deleteUser: failed to delete reply', r._id, e);
                }
            }
        } catch (rErr) {
            console.error('deleteUser: failed deleting user replies', rErr);
        }

        // 4) Delete likes by user (per-document to trigger hooks)
        try {
            const likes = await Like.find({ userId: id }).select('_id').lean();
            for (const l of likes) {
                try {
                    await Like.findByIdAndDelete(l._id);
                } catch (e) {
                    console.error('deleteUser: failed to delete like', l._id, e);
                }
            }
        } catch (lErr) {
            console.error('deleteUser: failed deleting likes', lErr);
        }

        // 5) Remove follow relations (iterate to trigger model hooks)
        try {
            const outs = await Follow.find({ followerId: id }).select('_id followerId followingId').lean();
            for (const f of outs) {
                try { await Follow.findByIdAndDelete(f._id); } catch (e) { console.error('deleteUser: failed to delete follow', f._id, e); }
            }
            const ins = await Follow.find({ followingId: id }).select('_id followerId followingId').lean();
            for (const f of ins) {
                try { await Follow.findByIdAndDelete(f._id); } catch (e) { console.error('deleteUser: failed to delete follow', f._id, e); }
            }
        } catch (fErr) {
            console.error('deleteUser: failed deleting follow relations', fErr);
        }

        // 6) Delete notifications where user is owner or sender
        try {
            await Notification.deleteMany({ $or: [{ userId: id }, { senderId: id }] });
        } catch (nErr) {
            console.error('deleteUser: failed deleting notifications', nErr);
        }

        // 7) Finally delete the user
        try {
            await User.findByIdAndDelete(id);
        } catch (uErr) {
            console.error('deleteUser: failed deleting user record', uErr);
            return res.status(500).json({ message: 'Failed to delete user' });
        }

        res.json({ message: 'User and related data deleted successfully' });
    } catch (err) {
        console.error('deleteUser: unexpected error', err);
        res.status(500).json({ error: err.message });
    }
};