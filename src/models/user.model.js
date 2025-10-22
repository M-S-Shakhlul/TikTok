import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    bio: String,
    avatarUrl: String,

    // Counters
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },

    // Email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },

    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('User', userSchema);