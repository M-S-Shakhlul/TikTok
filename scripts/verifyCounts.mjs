import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

// models
import Post from '../src/models/post.model.js';
import Comment from '../src/models/comment.model.js';
import Reply from '../src/models/reply.model.js';
import Like from '../src/models/like.model.js';
import User from '../src/models/user.model.js';
import Follow from '../src/models/follow.model.js';

// Usage: node scripts/verifyCounts.mjs [--fix]
const argv = process.argv.slice(2);
const doFix = argv.includes('--fix');

(async function main() {
    await connectDB();

    try {
        console.log('Verifying post comment/like counts...');
        const posts = await Post.find({}).select('_id ownerId approved commentsCount likesCount');
        for (const p of posts) {
            const realComments = await Comment.countDocuments({ postId: p._id });
            const realLikes = await Like.countDocuments({ postId: p._id });
            const updates = {};
            if (p.commentsCount !== realComments) updates.commentsCount = realComments;
            if (p.likesCount !== realLikes) updates.likesCount = realLikes;
            if (Object.keys(updates).length) {
                console.log(`post ${p._id}: stored comments=${p.commentsCount} real=${realComments}, likes stored=${p.likesCount} real=${realLikes}`);
                if (doFix) {
                    await Post.findByIdAndUpdate(p._id, { $set: updates });
                    console.log('  -> fixed');
                }
            }
        }

        console.log('\nVerifying comment replies counts...');
        const comments = await Comment.find({}).select('_id repliesCount');
        for (const c of comments) {
            const realReplies = await Reply.countDocuments({ commentId: c._id });
            if (c.repliesCount !== realReplies) {
                console.log(`comment ${c._id}: stored repliesCount=${c.repliesCount} real=${realReplies}`);
                if (doFix) {
                    await Comment.findByIdAndUpdate(c._id, { $set: { repliesCount: realReplies } });
                    console.log('  -> fixed');
                }
            }
        }

        console.log('\nVerifying user follow counts...');
        const users = await User.find({}).select('_id followersCount followingCount postsCount');
        for (const u of users) {
            const realFollowers = await Follow.countDocuments({ followingId: u._id });
            const realFollowing = await Follow.countDocuments({ followerId: u._id });
            const realPosts = await Post.countDocuments({ ownerId: u._id, approved: true });
            const upd = {};
            if (u.followersCount !== realFollowers) upd.followersCount = realFollowers;
            if (u.followingCount !== realFollowing) upd.followingCount = realFollowing;
            if (u.postsCount !== realPosts) upd.postsCount = realPosts;
            if (Object.keys(upd).length) {
                console.log(`user ${u._id}: stored followers=${u.followersCount} real=${realFollowers}, following stored=${u.followingCount} real=${realFollowing}, posts stored=${u.postsCount} real=${realPosts}`);
                if (doFix) {
                    await User.findByIdAndUpdate(u._id, { $set: upd });
                    console.log('  -> fixed');
                }
            }
        }

        console.log('\nVerification complete.');
        if (!doFix) console.log('Run with --fix to apply fixes where mismatches were found.');
    } catch (err) {
        console.error('verifyCounts: failed', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
})();