import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
}, { timestamps: true });

// 📈 Update replies count
replySchema.post('save', async function(doc) {
    try {
        const Comment = mongoose.model('Comment');
        await Comment.findByIdAndUpdate(doc.commentId, { $inc: { repliesCount: 1 } });
    } catch (err) {
        console.error('Error updating comment repliesCount on reply save:', err);
    }
});

// 🧹 Decrease replies count and remove notifications when reply deleted
replySchema.post('findOneAndDelete', async function(doc) {
    try {
        if (!doc) return;
        const Comment = mongoose.model('Comment');
        const Notification = mongoose.model('Notification');

        await Promise.all([
            // Update comment's reply count
            Comment.findByIdAndUpdate(doc.commentId, { $inc: { repliesCount: -1 } }),
            // Delete notifications for this reply
            Notification.deleteMany({ type: 'reply', relatedReply: doc._id })
        ]);

        console.log(`Cascaded delete for reply ${doc._id}`);
    } catch (err) {
        console.error('Error in reply post-delete hook:', err);
    }
});

export default mongoose.model('Reply', replySchema);