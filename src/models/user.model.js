import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },

    // optional demographic fields
    dob: { type: Date },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'] },

    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // Social login providers ids
    providers: {
        googleId: { type: String },
        facebookId: { type: String },
    },

    bio: { type: String },
    avatarUrl: { type: String },

    // Counters
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },

    // Account state
    isBanned: { type: Boolean, default: false },

    // Refresh token management (hashed for security)
    refreshTokenHash: { type: String }, // SHA256 hash of current refresh token
    refreshTokenIssuedAt: { type: Date }, // When current refresh token was issued

    // Password reset
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },

    // Misc
    settings: { type: Object, default: {} },
}, { timestamps: true });

// Index commonly queried fields
userSchema.index({ email: 1 });

// 🧹 Cascade delete when a user is removed: posts, comments, replies, likes, follows, notifications, moderation logs
userSchema.post('findOneAndDelete', async function(doc) {
    try {
        if (!doc) return;
        const mongooseInstance = mongoose;
        const Post = mongooseInstance.model('Post');
        const Comment = mongooseInstance.model('Comment');
        const Reply = mongooseInstance.model('Reply');
        const Like = mongooseInstance.model('Like');
        const Follow = mongooseInstance.model('Follow');
        const ModerationLog = mongooseInstance.model('ModerationLog');
        const Notification = mongooseInstance.model('Notification');

        // Deleting posts will trigger post model hooks to remove their comments/likes/notifications
        await Post.deleteMany({ ownerId: doc._id });

        // Delete user's comments, replies, likes, follow relations, moderation logs and notifications
        await Promise.all([
            Comment.deleteMany({ userId: doc._id }),
            Reply.deleteMany({ userId: doc._id }),
            Like.deleteMany({ userId: doc._id }),
            Follow.deleteMany({ $or: [{ followerId: doc._id }, { followingId: doc._id }] }),
            ModerationLog.deleteMany({ adminId: doc._id }),
            Notification.deleteMany({ $or: [{ userId: doc._id }, { senderId: doc._id }] }),
        ]);

        console.log(`Cascaded delete for user ${doc._id}`);
    } catch (err) {
        console.error('Error in user post-delete hook:', err);
    }
});

export default mongoose.model('User', userSchema);