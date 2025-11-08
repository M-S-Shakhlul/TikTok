import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    repliesCount: { type: Number, default: 0 },
}, { timestamps: true });

// 🧹 When a comment is deleted: remove replies, notifications and decrement post commentsCount
commentSchema.post('findOneAndDelete', async function(doc) {
    try {
        if (!doc) return;
        const mongooseInstance = mongoose;
        const Reply = mongooseInstance.model('Reply');
        const Post = mongooseInstance.model('Post');
        const Notification = mongooseInstance.model('Notification');

        // Get all replies to delete their notifications too
        const replies = await Reply.find({ commentId: doc._id }).select('_id userId');
        const replyIds = replies.map(r => r._id);

        await Promise.all([
            // Delete all replies
            Reply.deleteMany({ commentId: doc._id }),
            // Update post comment count
            Post.findByIdAndUpdate(doc.postId, { $inc: { commentsCount: -1 } }),
            // Delete notifications for this comment and its replies
            Notification.deleteMany({
                $or: [
                    { type: 'comment', relatedComment: doc._id },
                    { type: 'reply', relatedReply: { $in: replyIds } }
                ]
            })
        ]);

        console.log(`Cascaded delete for comment ${doc._id} including ${replyIds.length} replies`);
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