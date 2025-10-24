import mongoose from 'mongoose';
import Comment from '../models/comment.model.js';
import Reply from '../models/reply.model.js';
import Post from '../models/post.model.js';
import Notification from '../models/notification.model.js';

// Contract / behavior summary:
// - POST /api/posts/:postId/comments -> create a top-level comment
//   inputs: { text }
//   outputs: created Comment (201)
//   side-effects: increment Post.commentsCount, create notification for post owner
// - POST /api/comments/:commentId/replies -> create a reply to a comment
//   side-effects: increment Comment.repliesCount, notify comment owner
// - GET /api/posts/:postId/comments -> return comments for a post with their replies (paginated)
// - GET /api/comments/:commentId/replies -> return replies for a comment (paginated)

const normalizeId = (raw) => {
  if (!raw) return raw;
  const s = raw.toString().trim();
  return s.startsWith(':') ? s.slice(1) : s;
};

export const addComment = async (req, res) => {
  try {
  // support routes that use either :postId or :id (posts.routes uses :id)
  const postId = normalizeId(req.params.postId || req.params.id);
    const userId = req.user && req.user.id;
    const { text } = req.body;

  if (!mongoose.isValidObjectId(postId)) return res.status(400).json({ error: 'Invalid post id' });
    if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text is required' });

    const post = await Post.findById(postId).select('userId');
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = await Comment.create({ postId, userId, text: text.trim() });

    // increment post comments counter
    await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    // create notification for post owner (don't notify self)
    // guard against missing userIds to avoid runtime errors
    if (post.userId && userId && post.userId.toString() !== userId.toString()) {
      await Notification.create({
        userId: post.userId,
        senderId: userId,
        type: 'comment',
        message: 'Someone commented on your post',
        relatedPost: postId,
      });
    }

    const populated = await Comment.findById(comment._id).populate('userId', 'name avatarUrl');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const addReply = async (req, res) => {
  try {
  // support routes that use either :commentId or :id
  const commentId = normalizeId(req.params.commentId || req.params.id);
    const userId = req.user && req.user.id;
    const { text } = req.body;

    if (!mongoose.isValidObjectId(commentId)) return res.status(400).json({ error: 'Invalid comment id' });
    if (!text || !text.trim()) return res.status(400).json({ error: 'Reply text is required' });

    const comment = await Comment.findById(commentId).select('userId postId');
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const reply = await Reply.create({ commentId, userId, text: text.trim() });

    // increment comment replies counter
    await Comment.findByIdAndUpdate(commentId, { $inc: { repliesCount: 1 } });

    // notify comment owner (don't notify self)
    // guard against missing userIds to avoid runtime errors
    if (comment.userId && userId && comment.userId.toString() !== userId.toString()) {
      await Notification.create({
        userId: comment.userId,
        senderId: userId,
        type: 'comment',
        message: 'Someone replied to your comment',
        relatedPost: comment.postId,
      });
    }

    const populated = await Reply.findById(reply._id).populate('userId', 'name avatarUrl');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getRepliesByComment = async (req, res) => {
  try {
  const commentId = normalizeId(req.params.commentId || req.params.id);
  if (!mongoose.isValidObjectId(commentId)) return res.status(400).json({ error: 'Invalid comment id' });

    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const skip = (page - 1) * limit;

    const replies = await Reply.find({ commentId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name avatarUrl')
      .lean();

    res.json({ page, limit, data: replies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCommentsByPost = async (req, res) => {
  try {
  const postId = normalizeId(req.params.postId || req.params.id);
  if (!mongoose.isValidObjectId(postId)) return res.status(400).json({ error: 'Invalid post id' });

    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const skip = (page - 1) * limit;

    // fetch comments
    const comments = await Comment.find({ postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name avatarUrl')
      .lean();

    const commentIds = comments.map((c) => c._id);

    // fetch replies for these comments
    const replies = await Reply.find({ commentId: { $in: commentIds } })
      .sort({ createdAt: 1 })
      .populate('userId', 'name avatarUrl')
      .lean();

    // group replies by commentId
    const repliesByComment = replies.reduce((acc, r) => {
      const key = r.commentId.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {});

    // attach replies to comments
    const results = comments.map((c) => ({ ...c, replies: repliesByComment[c._id.toString()] || [] }));

    res.json({ page, limit, data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
