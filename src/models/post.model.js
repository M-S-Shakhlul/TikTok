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

        const comments = await Comment.find({ postId: doc._id }).select('_id');
        const commentIds = comments.map(c => c._id);

        await Promise.all([
            Reply.deleteMany({ commentId: { $in: commentIds } }),
            Comment.deleteMany({ postId: doc._id }),
            Like.deleteMany({ postId: doc._id }),
            ModerationLog.deleteMany({ postId: doc._id }),
            Notification.deleteMany({ relatedPost: doc._id }),
            // decrement user's postsCount
            User.findByIdAndUpdate(doc.ownerId, { $inc: { postsCount: -1 } }),
        ]);
        console.log(`Cascaded delete for post ${doc._id}`);
    } catch (err) {
        console.error('Error in post post-delete hook:', err);
    }
});

// 📈 Increase user post count when new post added
postSchema.post('save', async function(doc) {
    try {
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(doc.ownerId, { $inc: { postsCount: 1 } });
    } catch (err) {
        console.error('Error updating user postsCount on post save:', err);
    }
});

export default mongoose.model("Post", postSchema);