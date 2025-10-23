import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    dob: { type: Date }, // بديل أدق من age
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    providers: {
      googleId: String,
      facebookId: String,
    },
    bio: String,
    avatarUrl: String,
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },
    emailVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    settings: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
