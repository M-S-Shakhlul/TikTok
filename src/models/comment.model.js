import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
	{
		postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		text: { type: String, required: true },
		repliesCount: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

export default mongoose.model('Comment', commentSchema);
