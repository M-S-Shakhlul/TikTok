import mongoose from 'mongoose';

const followSchema = new mongoose.Schema({
    followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    followingId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// prevent duplicate follow records
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// 📈 Update counts when follow
followSchema.post('save', async function(doc) {
    try {
        const User = mongoose.model('User');
        await Promise.all([
            User.findByIdAndUpdate(doc.followerId, { $inc: { followingCount: 1 } }),
            User.findByIdAndUpdate(doc.followingId, { $inc: { followersCount: 1 } }),
        ]);
    } catch (err) {
        console.error('Error updating user follow counts on follow save:', err);
    }
});

// 🧹 Update counts when unfollow
followSchema.post('findOneAndDelete', async function(doc) {
    try {
        if (!doc) return;
        const User = mongoose.model('User');
        await Promise.all([
            User.findByIdAndUpdate(doc.followerId, { $inc: { followingCount: -1 } }),
            User.findByIdAndUpdate(doc.followingId, { $inc: { followersCount: -1 } }),
        ]);
    } catch (err) {
        console.error('Error updating user follow counts on follow delete:', err);
    }
});

export default mongoose.model('Follow', followSchema);