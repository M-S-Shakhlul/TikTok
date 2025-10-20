import Comment from '../models/comment.model.js';

export const addComment = async (req, res) => {
  try {
    const comment = await Comment.create(req.body);
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getCommentsByPost = async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).populate('userId', 'name');
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
