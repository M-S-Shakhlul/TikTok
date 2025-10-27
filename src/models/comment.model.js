import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    repliesCount: { type: Number, default: 0 },
}, { timestamps: true });

// 🧹 When a comment is deleted: remove replies and decrement post commentsCount
commentSchema.post('findOneAndDelete', async function(doc) {
    try {
        if (!doc) return;
        const mongooseInstance = mongoose;
        const Reply = mongooseInstance.model('Reply');
        const Post = mongooseInstance.model('Post');

        await Promise.all([
            Reply.deleteMany({ commentId: doc._id }),
            Post.findByIdAndUpdate(doc.postId, { $inc: { commentsCount: -1 } }),
        ]);
    } catch (err) {
        console.error('Error in comment post-delete hook:', err);
    }
});

// 📈 Increase post commentsCount when comment is created
commentSchema.post('save', async function(doc) {
    try {
        const Post = mongoose.model('Post');
        await Post.findByIdAndUpdate(doc.postId, { $inc: { commentsCount: 1 } });
    } catch (err) {
        console.error('Error updating post commentsCount on comment save:', err);
    }
});

export default mongoose.model('Comment', commentSchema);