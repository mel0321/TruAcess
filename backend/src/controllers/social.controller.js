import db from '../../database/connection.js';
import { AppError } from '../middlewares/error.middleware.js';

export async function listPosts(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 12));
    const offset = (page - 1) * limit;
    const posts = await db('social_posts as p')
      .leftJoin('users as u', 'u.id', 'p.user_id')
      .leftJoin('places as pl', 'pl.id', 'p.place_id')
      .select('p.*', 'u.full_name as author_name', 'u.profile_picture as author_avatar', 'pl.establishment_name as place_name')
      .orderBy('p.created_at', 'desc').limit(limit).offset(offset);
    for (const post of posts) {
      post.photos = await db('social_post_photos').where({ post_id: post.id }).select('id', 'photo_url');
      post.like_count = await db('social_likes').where({ post_id: post.id }).count('* as count').first().then(r => Number(r.count));
      post.comment_count = await db('social_comments').where({ post_id: post.id }).count('* as count').first().then(r => Number(r.count));
      post.liked = req.user ? Boolean(await db('social_likes').where({ post_id: post.id, user_id: req.user.id }).first()) : false;
      post.hashtags = post.hashtags ? JSON.parse(post.hashtags) : [];
    }
    res.json({ posts, page, limit });
  } catch (error) { next(error); }
}

export async function createPost(req, res, next) {
  try {
    const { caption, place_id, location, hashtags, privacy } = req.body;
    const photos = (req.files || []).map((file) => `/uploads/places/${file.filename}`);
    if (!photos.length) throw new AppError('Adicione pelo menos uma fotografia.', 400);
    if (photos.length > 10) throw new AppError('Você pode adicionar até 10 fotografias por publicação.', 400);
    const parsedHashtags = typeof hashtags === 'string'
      ? hashtags.split(/[\s,#]+/).map((tag) => tag.trim()).filter(Boolean)
      : (Array.isArray(hashtags) ? hashtags : []);
    const [postId] = await db('social_posts').insert({
      user_id: req.user.id, place_id: place_id || null, caption: caption?.trim() || null,
      location: location?.trim() || null, hashtags: JSON.stringify(parsedHashtags),
      privacy: ['PUBLIC', 'FOLLOWERS', 'PRIVATE'].includes(privacy) ? privacy : 'PUBLIC'
    });
    await db('social_post_photos').insert(photos.map((photo_url) => ({ post_id: postId, photo_url })));
    res.status(201).json({ message: 'Publicação criada!', post_id: postId });
  } catch (error) { next(error); }
}

export async function toggleLike(req, res, next) {
  try {
    const postId = Number(req.params.postId);
    const existing = await db('social_likes').where({ post_id: postId, user_id: req.user.id }).first();
    if (existing) await db('social_likes').where({ id: existing.id }).del();
    else await db('social_likes').insert({ post_id: postId, user_id: req.user.id });
    res.json({ liked: !existing });
  } catch (error) { next(error); }
}

export async function addComment(req, res, next) {
  try {
    const comment = req.body.comment?.trim();
    if (!comment) throw new AppError('Escreva um comentário.', 400);
    await db('social_comments').insert({ post_id: Number(req.params.postId), user_id: req.user.id, comment });
    res.status(201).json({ message: 'Comentário publicado!' });
  } catch (error) { next(error); }
}

export async function deletePost(req, res, next) {
  try {
    const postId = Number(req.params.postId);
    const post = await db('social_posts').where({ id: postId }).first();
    if (!post) throw new AppError('Publicação não encontrada.', 404);
    if (post.user_id !== req.user.id) throw new AppError('Você só pode excluir suas próprias publicações.', 403);
    await db('social_posts').where({ id: postId }).del();
    res.json({ message: 'Publicação excluída.' });
  } catch (error) { next(error); }
}

export async function toggleFollow(req, res, next) {
  try {
    const followingId = Number(req.params.userId);
    if (followingId === req.user.id) throw new AppError('Você não pode seguir a própria conta.', 400);
    const existing = await db('social_follows').where({ follower_id: req.user.id, following_id: followingId }).first();
    if (existing) await db('social_follows').where({ id: existing.id }).del();
    else await db('social_follows').insert({ follower_id: req.user.id, following_id: followingId });
    res.json({ following: !existing });
  } catch (error) { next(error); }
}
