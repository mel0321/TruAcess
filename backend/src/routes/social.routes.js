import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middlewares/auth.middleware.js';
import { listPosts, createPost, toggleLike, addComment, toggleFollow } from '../controllers/social.controller.js';

const router = Router();
router.get('/posts', optionalAuth, listPosts);
router.post('/posts', authenticateToken, createPost);
router.post('/posts/:postId/like', authenticateToken, toggleLike);
router.post('/posts/:postId/comments', authenticateToken, addComment);
router.post('/users/:userId/follow', authenticateToken, toggleFollow);
export default router;
