import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
    url: String,
    resolution: String, // مثال: "720p"
    bitrate: Number,
    sizeBytes: Number,
});

const thumbnailSchema = new mongoose.Schema({
    url: String,
    width: Number,
    height: Number,
    timeSec: Number, // الوقت اللي اتاخدت فيه الصورة من الفيديو
});

const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    videoUrl: { type: String, required: true },
    storageKey: { type: String },
    mimeType: { type: String },
    sizeBytes: { type: Number },
    variants: [variantSchema],
    thumbnails: [thumbnailSchema],
    posterUrl: { type: String },
    durationSec: { type: Number },
    format: { type: String },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    approved: { type: Boolean, default: false },
    processingStatus: {
        type: String,
        enum: ["pending", "processing", "ready", "failed"],
        default: "ready",
    },
    isFlagged: { type: Boolean, default: false },
    reportsCount: { type: Number, default: 0 },
    moderationReason: { type: String },
    tags: [String],
    category: { type: String },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
}, { timestamps: true });

// 🧹 Cascade delete: when a post is removed, clean comments, replies, likes, moderation logs and notifications
postSchema.post('findOneAndDelete', async function(doc) {
    try {
        if (!doc) return;
        const mongooseInstance = mongoose;
        const Comment = mongooseInstance.model('Comment');
        const Reply = mongooseInstance.model('Reply');
        const Like = mongooseInstance.model('Like');
        const ModerationLog = mongooseInstance.model('ModerationLog');
        const Notification = mongooseInstance.model('Notification');
        const User = mongooseInstance.model('User');

        // Get all comments to delete their replies and notifications
        const comments = await Comment.find({ postId: doc._id }).select('_id');
        const commentIds = comments.map(c => c._id);

        // Get all replies to delete their notifications
        const replies = await Reply.find({ commentId: { $in: commentIds } }).select('_id');
        const replyIds = replies.map(r => r._id);

        // Get all likes to delete their notifications
        const likes = await Like.find({ postId: doc._id }).select('_id');
        const likeIds = likes.map(l => l._id);

        await Promise.all([
            // Delete all replies for all comments
            Reply.deleteMany({ commentId: { $in: commentIds } }),
            // Delete all comments
            Comment.deleteMany({ postId: doc._id }),
            // Delete all likes
            Like.deleteMany({ postId: doc._id }),
            // Delete moderation logs
            ModerationLog.deleteMany({ postId: doc._id }),
            // Delete ALL related notifications (post, comments, replies, likes)
            Notification.deleteMany({
                $or: [
                    { type: 'post', relatedPost: doc._id },
                    { type: 'comment', relatedComment: { $in: commentIds } },
                    { type: 'reply', relatedReply: { $in: replyIds } },
                    { type: 'like', relatedLike: { $in: likeIds } }
                ]
            }),
        ]);

        // Decrement user's postsCount only if the post was previously approved
        try {
            if (doc.approved && doc.ownerId) {
                await User.findByIdAndUpdate(doc.ownerId, { $inc: { postsCount: -1 } });
            }
        } catch (incErr) {
            console.error('post.model: failed to decrement postsCount on delete', incErr);
        }

        console.log(`Cascaded delete for post ${doc._id} including:
            - ${commentIds.length} comments
            - ${replyIds.length} replies
            - ${likeIds.length} likes`);
    } catch (err) {
        console.error('Error in post post-delete hook:', err);
    }
});

// When a post is updated via findOneAndUpdate (used by approval flows),
// detect transition approved: false -> approved: true and increment user's postsCount.
postSchema.pre('findOneAndUpdate', async function() {
    try {
        // store previous approved state on the query for use in post hook
        const query = this.getQuery();
        const doc = await this.model.findOne(query).select('approved ownerId').lean();
        this._previousApproved = doc ? !!doc.approved : null;
        this._previousOwnerId = doc ? doc.ownerId : null;
    } catch (err) {
        console.error('post pre findOneAndUpdate hook error:', err);
        this._previousApproved = null;
        this._previousOwnerId = null;
    }
});

postSchema.post('findOneAndUpdate', async function(doc) {
    try {
        // this is the query; _previousApproved and _previousOwnerId were set in pre hook
        const wasApproved = this._previousApproved;
        const prevOwner = this._previousOwnerId ? this._previousOwnerId.toString() : null;
        if (wasApproved === null || !doc) return;

        const nowApproved = !!doc.approved;
        const newOwner = doc.ownerId ? doc.ownerId.toString() : null;

        const User = mongoose.model('User');

        // false -> true : increment new owner
        if (!wasApproved && nowApproved && newOwner) {
            await User.findByIdAndUpdate(newOwner, { $inc: { postsCount: 1 } });
            console.log(`post.model: incremented postsCount for user ${newOwner}`);

            // if owner changed at the same time, decrement previous owner
            if (prevOwner && prevOwner !== newOwner) {
                try {
                    await User.findByIdAndUpdate(prevOwner, { $inc: { postsCount: -1 } });
                    console.log(`post.model: decremented postsCount for previous owner ${prevOwner}`);
                } catch (e) {
                    console.error('post.model: failed to decrement previous owner postsCount', e);
                }
            }
        }

        // true -> false : decrement previous owner (or current owner)
        if (wasApproved && !nowApproved) {
            const targetOwner = prevOwner || newOwner;
            if (targetOwner) {
                try {
                    await User.findByIdAndUpdate(targetOwner, { $inc: { postsCount: -1 } });
                    console.log(`post.model: decremented postsCount for user ${targetOwner} (unapproved)`);
                } catch (e) {
                    console.error('post.model: failed to decrement postsCount on unapprove', e);
                }
            }
        }

        // approved && owner changed (move count)
        if (wasApproved && nowApproved && prevOwner && newOwner && prevOwner !== newOwner) {
            try {
                await Promise.all([
                    User.findByIdAndUpdate(prevOwner, { $inc: { postsCount: -1 } }),
                    User.findByIdAndUpdate(newOwner, { $inc: { postsCount: 1 } })
                ]);
                console.log(`post.model: moved postsCount from ${prevOwner} -> ${newOwner}`);
            } catch (e) {
                console.error('post.model: failed to move postsCount between owners', e);
            }
        }
    } catch (err) {
        console.error('post post findOneAndUpdate hook error:', err);
    }
});

// 📈 Increase user post count when new post added
postSchema.post('save', async function(doc) {
    try {
        // Only increment when the saved document is an approved post created as new.
        // Previously this ran on every save (including initial create when approved=false)
        // which caused double increments when the controller also increments on approval.
        if (!doc.approved) return; // ignore unapproved posts
        if (!doc.isNew) return; // only count when created as approved

        const User = mongoose.model('User');
        await User.findByIdAndUpdate(doc.ownerId, { $inc: { postsCount: 1 } });
    } catch (err) {
        console.error('Error updating user postsCount on post save:', err);
    }
});

export default mongoose.model("Post", postSchema);