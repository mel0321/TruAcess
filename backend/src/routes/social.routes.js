import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middlewares/auth.middleware.js';
import { listPosts, createPost, toggleLike, addComment, toggleFollow, deletePost } from '../controllers/social.controller.js';
import { socialPhotoUpload } from '../config/upload.js';

const router = Router();
router.get('/posts', optionalAuth, listPosts);
router.post('/posts', authenticateToken, socialPhotoUpload, createPost);
router.delete('/posts/:postId', authenticateToken, deletePost);
router.post('/posts/:postId/like', authenticateToken, toggleLike);
router.post('/posts/:postId/comments', authenticateToken, addComment);
router.post('/users/:userId/follow', authenticateToken, toggleFollow);
export default router;
