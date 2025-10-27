import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Like from '../models/like.model.js';
import Post from '../models/post.model.js';
import Notification from '../models/notification.model.js';


export const likePost = async(req, res) => {
    try {
        // require authentication (token must have been validated by authenticate middleware)
        if (!req.user || !req.user.id) return res.status(401).json({ message: 'Not authenticated' });
        const userId = req.user.id;

        const rawPostId = (req.params.postId || req.body.postId || '').toString().trim();
        const postId = rawPostId.startsWith(":") ? rawPostId.slice(1) : rawPostId;
        if (!mongoose.isValidObjectId(postId)) return res.status(400).json({ message: 'Invalid postId' });

        // Toggle like: if exists -> unlike, else -> like
        const existing = await Like.findOne({ userId, postId });
        if (existing) {
            // unlike
            await Like.deleteOne({ _id: existing._id });
            const updatedPost = await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } }, { new: true });

            // remove corresponding notification (best-effort)
            try {
                const post = await Post.findById(postId).select('ownerId');
                if (post && post.ownerId) {
                    await Notification.findOneAndDelete({ userId: post.ownerId, senderId: userId, type: 'like', relatedPost: postId });
                }
            } catch (e) {
                console.error('likePost: failed to remove notification on unlike', e);
            }

            return res.json({ liked: false, likesCount: updatedPost ? updatedPost.likesCount : undefined });
        }

        // create like
        const like = await Like.create({ userId, postId });

        const updated = await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } }, { new: true });

        // notify owner (best-effort)
        try {
            const post = await Post.findById(postId).select('ownerId title');
            if (post && post.ownerId && post.ownerId.toString() !== userId) {
                await Notification.create({
                    userId: post.ownerId,
                    senderId: userId,
                    type: 'like',
                    message: `❤️ ${req.user.name || 'Someone'} liked your post: "${post.title || ''}"`,
                    relatedPost: postId,
                });
            }
        } catch (notifErr) {
            console.error('likePost: failed to create notification', notifErr);
        }

        res.status(201).json({ liked: true, likesCount: updated ? updated.likesCount : undefined, like });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getLikesByPost = async(req, res) => {
    try {
        const rawPostId = (req.params.postId || '').toString().trim();
        const postId = rawPostId.startsWith(":") ? rawPostId.slice(1) : rawPostId;
        if (!mongoose.isValidObjectId(postId)) return res.status(400).json({ message: 'Invalid postId' });

        const post = await Post.findById(postId).select('likesCount');
        const likesCount = post ? post.likesCount : 0;

        // detect current user (optional) — if Authorization header present, try decode
        let liked = false;
        try {
            const auth = req.header('Authorization') || req.header('authorization');
            if (auth && auth.startsWith('Bearer ')) {
                const token = auth.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded && decoded.id) {
                    const exists = await Like.findOne({ userId: decoded.id, postId });
                    liked = !!exists;
                }
            }
        } catch (e) {
            // ignore token errors; just return likesCount
        }

        res.json({ likesCount, liked });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};