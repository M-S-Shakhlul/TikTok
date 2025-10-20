import express from 'express';
import { likePost, getLikesByPost } from '../controllers/like.controller.js';

const router = express.Router();

router.post('/', likePost);
router.get('/:postId', getLikesByPost);

export default router;
