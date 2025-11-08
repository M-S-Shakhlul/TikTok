import express from 'express';
import { addReply, getRepliesByComment, getCommentsByPost, deleteComment } from '../controllers/comment.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createReplyValidation } from '../validation/replyValidate.js';

const router = express.Router();

// Backwards-compatible routes:
// - POST /api/comments/:commentId  -> create a reply to comment (used to be under /comments)
// - GET  /api/comments/:postId     -> get comments for a post (also available under /api/posts/:id/comments)

// support legacy path that included /replies suffix
router.post('/:commentId/replies', authenticate, validate(createReplyValidation), addReply);
router.get('/:commentId/replies', getRepliesByComment);
// also support POST /api/comments/:commentId (no suffix) and GET /api/comments/:postId
router.post('/:commentId', authenticate, validate(createReplyValidation), addReply);
router.get('/:postId', getCommentsByPost);
// Delete comment route
router.delete('/:commentId', authenticate, deleteComment);

export default router;