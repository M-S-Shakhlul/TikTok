import express from 'express';
import { likePost, getLikesByPost } from '../controllers/like.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// require authentication to like
// Like by sending postId in body or as a URL param
router.post('/', authenticate, likePost);
router.post('/:postId', authenticate, likePost);
router.get('/:postId', getLikesByPost);

export default router;
