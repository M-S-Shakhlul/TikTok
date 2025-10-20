import Like from '../models/like.model.js';

export const likePost = async (req, res) => {
  try {
    const like = await Like.create(req.body);
    res.status(201).json(like);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getLikesByPost = async (req, res) => {
  try {
    const likes = await Like.find({ postId: req.params.postId });
    res.json(likes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
