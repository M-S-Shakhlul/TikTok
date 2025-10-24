import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
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

    // Email verification / account state
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    isBanned: { type: Boolean, default: false },

    // Misc
    settings: { type: Object, default: {} },
  },
  { timestamps: true }
);

// Index commonly queried fields
userSchema.index({ email: 1 });

export default mongoose.model('User', userSchema);
