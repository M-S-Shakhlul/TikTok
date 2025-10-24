import express from 'express';
import { addReply, getRepliesByComment } from '../controllers/comment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Create a reply for a comment
// POST /api/replies/:commentId
router.post('/:commentId', authenticate, addReply);

// Get replies for a comment (paginated)
// GET /api/replies/:commentId
router.get('/:commentId', getRepliesByComment);

export default router;
