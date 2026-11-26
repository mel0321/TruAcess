import db from '../../database/connection.js';
import { AppError } from '../middlewares/error.middleware.js';

function parseProfile(profileData) {
  if (!profileData) return {};
  try {
    const profile = JSON.parse(profileData);
    return profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : {};
  } catch {
    throw new AppError('Não foi possível ler os dados do perfil.', 500);
  }
}

async function getBlockedUserIds(userId) {
  if (!userId) return [];
  const rows = await db('social_blocks')
    .where('blocker_id', userId)
    .orWhere('blocked_id', userId)
    .select('blocker_id', 'blocked_id');
  return [...new Set(rows.map((row) => row.blocker_id === userId ? row.blocked_id : row.blocker_id))];
}

async function isBlockedEitherWay(firstId, secondId) {
  return Boolean(await db('social_blocks')
    .where({ blocker_id: firstId, blocked_id: secondId })
    .orWhere({ blocker_id: secondId, blocked_id: firstId })
    .first());
}

async function canViewPost(post, viewerId) {
  if (!post) return false;
  if (viewerId && viewerId === post.user_id) return true;
  if (viewerId && await isBlockedEitherWay(viewerId, post.user_id)) return false;
  if (post.privacy === 'PUBLIC') return true;
  if (post.privacy !== 'FOLLOWERS' || !viewerId) return false;
  return Boolean(await db('social_follows')
    .where({ follower_id: viewerId, following_id: post.user_id })
    .first());
}

async function hydratePosts(posts, viewerId) {
  for (const post of posts) {
    post.is_demo = parseProfile(post.author_profile_data).isDemo === true;
    delete post.author_profile_data;
    post.photos = await db('social_post_photos')
      .where({ post_id: post.id })
      .select('id', 'photo_url', 'media_type');
    post.like_count = await db('social_likes').where({ post_id: post.id }).count('* as count').first()
      .then((result) => Number(result.count));
    post.comment_count = await db('social_comments').where({ post_id: post.id }).count('* as count').first()
      .then((result) => Number(result.count));
    post.liked = viewerId
      ? Boolean(await db('social_likes').where({ post_id: post.id, user_id: viewerId }).first())
      : false;
    post.hashtags = post.hashtags ? JSON.parse(post.hashtags) : [];
  }
  return posts;
}

function visiblePostsQuery(query, viewerId) {
  if (!viewerId) return query.where('p.privacy', 'PUBLIC');
  return query.where((builder) => {
    builder.where('p.privacy', 'PUBLIC')
      .orWhere('p.user_id', viewerId)
      .orWhere((followersQuery) => {
        followersQuery.where('p.privacy', 'FOLLOWERS')
          .whereIn('p.user_id', db('social_follows')
            .select('following_id')
            .where('follower_id', viewerId));
      });
  });
}

export async function listPosts(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 12));
    const offset = (page - 1) * limit;
    let query = db('social_posts as p')
      .leftJoin('users as u', 'u.id', 'p.user_id')
      .leftJoin('places as pl', 'pl.id', 'p.place_id')
      .select('p.*', 'u.full_name as author_name', 'u.profile_picture as author_avatar', 'u.profile_data as author_profile_data', 'pl.establishment_name as place_name');
    query = visiblePostsQuery(query, req.user?.id);
    const blockedIds = await getBlockedUserIds(req.user?.id);
    if (blockedIds.length) query = query.whereNotIn('p.user_id', blockedIds);
    const posts = await query.orderBy('p.created_at', 'desc').limit(limit).offset(offset);
    res.json({ posts: await hydratePosts(posts, req.user?.id), page, limit });
  } catch (error) {
    next(error);
  }
}

export async function listUsers(req, res, next) {
  try {
    const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 12));
    let query = db('users as u')
      .where('u.email_verified', 1)
      .select('u.id', 'u.full_name', 'u.profile_picture', 'u.user_type', 'u.profile_data')
      .orderBy('u.created_at', 'desc')
      .limit(limit);
    if (req.user) {
      query = query.whereNot('u.id', req.user.id);
      const blockedIds = await getBlockedUserIds(req.user.id);
      if (blockedIds.length) query = query.whereNotIn('u.id', blockedIds);
    }
    const users = await query;
    const accounts = await Promise.all(users.map(async (user) => {
      const profile = parseProfile(user.profile_data);
      const followerCount = await db('social_follows').where({ following_id: user.id }).count('* as count').first();
      const following = req.user
        ? Boolean(await db('social_follows').where({ follower_id: req.user.id, following_id: user.id }).first())
        : false;
      return {
        id: user.id,
        full_name: user.full_name,
        profile_picture: user.profile_picture,
        user_type: user.user_type,
        bio: profile.bio || '',
        is_demo: profile.isDemo === true,
        follower_count: Number(followerCount.count),
        following,
      };
    }));
    res.json({ users: accounts });
  } catch (error) {
    next(error);
  }
}

export async function getUserProfile(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isSafeInteger(userId) || userId < 1) throw new AppError('Perfil não encontrado.', 404);
    const user = await db('users')
      .where({ id: userId })
      .select('id', 'full_name', 'profile_picture', 'user_type', 'profile_data', 'created_at')
      .first();
    if (!user) throw new AppError('Perfil não encontrado.', 404);
    if (req.user && req.user.id !== userId && await isBlockedEitherWay(req.user.id, userId)) {
      throw new AppError('Perfil não encontrado.', 404);
    }

    const profile = parseProfile(user.profile_data);
    const visiblePostCountQuery = visiblePostsQuery(db('social_posts as p').where('p.user_id', userId), req.user?.id);
    const [followerCount, followingCount, postCount, following, followedBy] = await Promise.all([
      db('social_follows').where({ following_id: userId }).count('* as count').first(),
      db('social_follows').where({ follower_id: userId }).count('* as count').first(),
      visiblePostCountQuery.count('* as count').first(),
      req.user && req.user.id !== userId
        ? db('social_follows').where({ follower_id: req.user.id, following_id: userId }).first()
        : null,
      req.user && req.user.id !== userId
        ? db('social_follows').where({ follower_id: userId, following_id: req.user.id }).first()
        : null,
    ]);

    res.json({
      user: {
        id: user.id,
        full_name: user.full_name,
        profile_picture: user.profile_picture,
        user_type: user.user_type,
        created_at: user.created_at,
        bio: profile.bio || '',
        social_links: Array.isArray(profile.socialLinks) ? profile.socialLinks : [],
        is_demo: profile.isDemo === true,
        is_following: Boolean(following),
        is_followed_by: Boolean(followedBy),
        follower_count: Number(followerCount.count),
        following_count: Number(followingCount.count),
        post_count: Number(postCount.count),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createPost(req, res, next) {
  try {
    const { caption, place_id, location, hashtags, privacy } = req.body;
    const media = (req.files || []).map((file) => ({
      photo_url: `${req.protocol}://${req.get('host')}/uploads/places/${file.filename}`,
      media_type: file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE',
    }));
    if (!media.length) throw new AppError('Adicione pelo menos uma foto ou vídeo.', 400);
    if (media.length > 10) throw new AppError('Você pode adicionar até 10 arquivos por publicação.', 400);
    const parsedHashtags = typeof hashtags === 'string'
      ? hashtags.split(/[\s,#]+/).map((tag) => tag.trim()).filter(Boolean)
      : (Array.isArray(hashtags) ? hashtags : []);
    const [postId] = await db('social_posts').insert({
      user_id: req.user.id,
      place_id: place_id || null,
      caption: caption?.trim() || null,
      location: location?.trim() || null,
      hashtags: JSON.stringify(parsedHashtags),
      privacy: ['PUBLIC', 'FOLLOWERS', 'PRIVATE'].includes(privacy) ? privacy : 'PUBLIC',
    });
    await db('social_post_photos').insert(media.map((item) => ({ post_id: postId, ...item })));
    res.status(201).json({ message: 'Publicação criada!', post_id: postId });
  } catch (error) {
    next(error);
  }
}

export async function listPostComments(req, res, next) {
  try {
    const post = await db('social_posts').where({ id: Number(req.params.postId) }).first();
    if (!await canViewPost(post, req.user?.id)) throw new AppError('Publicação não encontrada.', 404);
    const comments = await db('social_comments as c')
      .leftJoin('users as u', 'u.id', 'c.user_id')
      .select('c.id', 'c.user_id', 'c.comment', 'c.created_at', 'u.full_name as author_name', 'u.profile_picture as author_avatar')
      .where('c.post_id', Number(req.params.postId))
      .orderBy('c.created_at', 'asc');
    res.json({ comments });
  } catch (error) {
    next(error);
  }
}

export async function listRelationships(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    if (!await db('users').where({ id: userId }).first('id')) throw new AppError('Perfil não encontrado.', 404);
    if (req.user && req.user.id !== userId && await isBlockedEitherWay(req.user.id, userId)) {
      throw new AppError('Perfil não encontrado.', 404);
    }
    const followers = await db('social_follows as f')
      .join('users as u', 'u.id', 'f.follower_id')
      .select('u.id', 'u.full_name', 'u.profile_picture')
      .where('f.following_id', userId);
    const following = await db('social_follows as f')
      .join('users as u', 'u.id', 'f.following_id')
      .select('u.id', 'u.full_name', 'u.profile_picture')
      .where('f.follower_id', userId);
    res.json({ followers, following });
  } catch (error) {
    next(error);
  }
}

export async function listUserPosts(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    if (!await db('users').where({ id: userId }).first('id')) throw new AppError('Perfil não encontrado.', 404);
    if (req.user && req.user.id !== userId && await isBlockedEitherWay(req.user.id, userId)) {
      throw new AppError('Perfil não encontrado.', 404);
    }
    let query = db('social_posts as p')
      .leftJoin('users as u', 'u.id', 'p.user_id')
      .select('p.*', 'u.full_name as author_name', 'u.profile_picture as author_avatar')
      .where('p.user_id', userId);
    query = visiblePostsQuery(query, req.user?.id);
    const posts = await query.orderBy('p.created_at', 'desc');
    res.json({ posts: await hydratePosts(posts, req.user?.id) });
  } catch (error) {
    next(error);
  }
}

export async function toggleLike(req, res, next) {
  try {
    const postId = Number(req.params.postId);
    const post = await db('social_posts').where({ id: postId }).first();
    if (!await canViewPost(post, req.user.id)) throw new AppError('Publicação não encontrada.', 404);
    const existing = await db('social_likes').where({ post_id: postId, user_id: req.user.id }).first();
    if (existing) await db('social_likes').where({ id: existing.id }).del();
    else await db('social_likes').insert({ post_id: postId, user_id: req.user.id });
    res.json({ liked: !existing });
  } catch (error) {
    next(error);
  }
}

export async function addComment(req, res, next) {
  try {
    const comment = req.body.comment?.trim();
    if (!comment) throw new AppError('Escreva um comentário.', 400);
    const post = await db('social_posts').where({ id: Number(req.params.postId) }).first();
    if (!await canViewPost(post, req.user.id)) throw new AppError('Publicação não encontrada.', 404);
    const [commentId] = await db('social_comments').insert({
      post_id: Number(req.params.postId),
      user_id: req.user.id,
      comment,
    });
    const createdComment = await db('social_comments as c')
      .join('users as u', 'u.id', 'c.user_id')
      .where('c.id', commentId)
      .select('c.id', 'c.user_id', 'c.comment', 'c.created_at', 'u.full_name as author_name', 'u.profile_picture as author_avatar')
      .first();
    res.status(201).json({ message: 'Comentário publicado!', comment: createdComment });
  } catch (error) {
    next(error);
  }
}

export async function deletePost(req, res, next) {
  try {
    const postId = Number(req.params.postId);
    const post = await db('social_posts').where({ id: postId }).first();
    if (!post) throw new AppError('Publicação não encontrada.', 404);
    if (post.user_id !== req.user.id) throw new AppError('Você só pode excluir suas próprias publicações.', 403);
    await db('social_posts').where({ id: postId }).del();
    res.json({ message: 'Publicação excluída.' });
  } catch (error) {
    next(error);
  }
}

export async function toggleFollow(req, res, next) {
  try {
    const followingId = Number(req.params.userId);
    if (followingId === req.user.id) throw new AppError('Você não pode seguir a própria conta.', 400);
    if (!await db('users').where({ id: followingId }).first('id')) throw new AppError('Perfil não encontrado.', 404);
    if (await isBlockedEitherWay(req.user.id, followingId)) throw new AppError('Você não pode seguir este perfil.', 403);
    const existing = await db('social_follows').where({ follower_id: req.user.id, following_id: followingId }).first();
    if (existing) await db('social_follows').where({ id: existing.id }).del();
    else await db('social_follows').insert({ follower_id: req.user.id, following_id: followingId });
    res.json({ following: !existing });
  } catch (error) {
    next(error);
  }
}

export async function removeFollower(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    const followerId = Number(req.params.followerId);
    if (userId !== req.user.id) throw new AppError('Você só pode remover seguidores da sua própria conta.', 403);
    await db('social_follows').where({ follower_id: followerId, following_id: userId }).del();
    res.json({ message: 'Seguidor removido.' });
  } catch (error) {
    next(error);
  }
}

export async function toggleBlock(req, res, next) {
  try {
    const blockedId = Number(req.params.userId);
    if (blockedId === req.user.id) throw new AppError('Você não pode bloquear a própria conta.', 400);
    if (!await db('users').where({ id: blockedId }).first('id')) throw new AppError('Perfil não encontrado.', 404);
    const existing = await db('social_blocks').where({ blocker_id: req.user.id, blocked_id: blockedId }).first();
    if (existing) {
      await db('social_blocks').where({ id: existing.id }).del();
      return res.json({ blocked: false });
    }

    await db.transaction(async (transaction) => {
      await transaction('social_follows')
        .where({ follower_id: req.user.id, following_id: blockedId })
        .orWhere({ follower_id: blockedId, following_id: req.user.id })
        .del();
      await transaction('social_blocks').insert({ blocker_id: req.user.id, blocked_id: blockedId });
    });
    return res.json({ blocked: true });
  } catch (error) {
    next(error);
  }
}

export async function listBlockedUsers(req, res, next) {
  try {
    if (Number(req.params.userId) !== req.user.id) {
      throw new AppError('Você só pode ver a lista de bloqueios da sua conta.', 403);
    }
    const users = await db('social_blocks as b')
      .join('users as u', 'u.id', 'b.blocked_id')
      .select('u.id', 'u.full_name', 'u.profile_picture')
      .where('b.blocker_id', req.user.id)
      .orderBy('u.full_name', 'asc');
    res.json({ users });
  } catch (error) {
    next(error);
  }
}
