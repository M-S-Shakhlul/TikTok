import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
	{
		email: { type: String, required: true, unique: true },
		passwordHash: { type: String, required: true },
		name: { type: String, required: true },
		age: { type: Number, required: true },
		gender: { type: String, enum: ['male', 'female', 'other'] },
		role: { type: String, enum: ['user', 'admin'], default: 'user' },
		bio: String,
		avatarUrl: String,
		followersCount: { type: Number, default: 0 },
		followingCount: { type: Number, default: 0 },
		postsCount: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

export default mongoose.model('User', userSchema);
