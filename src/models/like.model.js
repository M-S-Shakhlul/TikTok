import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
}, { timestamps: true });

likeSchema.index({ userId: 1, postId: 1 }, { unique: true });

// 📈 Increase likes count
likeSchema.post('save', async function(doc) {
    try {
        const Post = mongoose.model('Post');
        await Post.findByIdAndUpdate(doc.postId, { $inc: { likesCount: 1 } });
    } catch (err) {
        console.error('Error updating post likesCount on like save:', err);
    }
});

// 🧹 Decrease likes count when unlike or deleted
likeSchema.post('findOneAndDelete', async function(doc) {
    try {
        if (!doc) return;
        const Post = mongoose.model('Post');
        await Post.findByIdAndUpdate(doc.postId, { $inc: { likesCount: -1 } });
    } catch (err) {
        console.error('Error updating post likesCount on like delete:', err);
    }
});

export default mongoose.model('Like', likeSchema);