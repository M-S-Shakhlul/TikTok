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

// 🧹 Decrease replies count when reply deleted
replySchema.post('findOneAndDelete', async function(doc) {
    try {
        if (!doc) return;
        const Comment = mongoose.model('Comment');
        await Comment.findByIdAndUpdate(doc.commentId, { $inc: { repliesCount: -1 } });
    } catch (err) {
        console.error('Error updating comment repliesCount on reply delete:', err);
    }
});

export default mongoose.model('Reply', replySchema);