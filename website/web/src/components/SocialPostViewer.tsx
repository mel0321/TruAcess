import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { IconHeart, IconMessageCircle } from './Icons';
import { isSocialVideo, type SocialMediaItem } from '../utils/socialMedia';

export type SocialPostComment = {
  id: number;
  user_id: number;
  comment: string;
  created_at: string;
  author_name: string;
  author_avatar?: string | null;
};

type SocialPostViewerProps = {
  postId: number;
  media: SocialMediaItem[];
  initialMediaIndex: number;
  authorName: string;
  authorAvatar?: string | null;
  caption?: string;
  location?: string;
  hashtags?: string[];
  likeCount: number;
  commentCount: number;
  liked: boolean;
  onToggleLike: () => Promise<boolean>;
  onCommentAdded: () => void;
  onHashtagClick: (tag: string) => void;
  onClose: () => void;
};

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function SocialPostViewer({
  postId,
  media,
  initialMediaIndex,
  authorName,
  authorAvatar,
  caption,
  location,
  hashtags = [],
  likeCount,
  commentCount,
  liked,
  onToggleLike,
  onCommentAdded,
  onHashtagClick,
  onClose,
}: SocialPostViewerProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(initialMediaIndex);
  const [comments, setComments] = useState<SocialPostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [likeCountValue, setLikeCountValue] = useState(likeCount);
  const [likedValue, setLikedValue] = useState(liked);
  const [likeSubmitting, setLikeSubmitting] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  useEffect(() => {
    let active = true;
    api.get<{ comments: SocialPostComment[] }>(`/social/posts/${postId}/comments`)
      .then((response) => {
        if (active) setComments(response.data.comments);
      })
      .catch((error: unknown) => {
        console.error('Erro ao carregar comentários da publicação:', error);
        if (active) setCommentError('Não foi possível carregar os comentários.');
      })
      .finally(() => {
        if (active) setCommentsLoading(false);
      });
    return () => { active = false; };
  }, [postId]);

  const activeMedia = media[activeMediaIndex];
  if (!activeMedia) return null;

  const changeMedia = (direction: -1 | 1) => {
    setActiveMediaIndex((current) => (current + direction + media.length) % media.length);
  };

  const toggleLike = async () => {
    if (likeSubmitting) return;
    setLikeSubmitting(true);
    try {
      const updated = await onToggleLike();
      if (updated) {
        setLikedValue((current) => !current);
        setLikeCountValue((current) => Math.max(0, current + (likedValue ? -1 : 1)));
      }
    } finally {
      setLikeSubmitting(false);
    }
  };

  const submitComment = async () => {
    const comment = commentText.trim();
    if (!comment || commentSubmitting) return;
    setCommentSubmitting(true);
    setCommentError('');
    try {
      const response = await api.post<{ comment: SocialPostComment }>(`/social/posts/${postId}/comments`, { comment });
      setComments((current) => [...current, response.data.comment]);
      setCommentText('');
      onCommentAdded();
    } catch (error) {
      console.error('Erro ao publicar comentário:', error);
      setCommentError('Não foi possível publicar o comentário. Tente novamente.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <div className="social-viewer-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="social-viewer" role="dialog" aria-modal="true" aria-label={`Publicação de ${authorName}`}>
        <div className={`social-viewer-media${isSocialVideo(activeMedia) ? ' is-video' : ''}`}>
          {isSocialVideo(activeMedia)
            ? <video key={activeMedia.photo_url} src={activeMedia.photo_url} controls autoPlay playsInline />
            : <img src={activeMedia.photo_url} alt={caption || `Publicação de ${authorName}`} />}
          {media.length > 1 && (
            <>
              <button type="button" className="social-viewer-arrow is-previous" aria-label="Mídia anterior" onClick={() => changeMedia(-1)}>‹</button>
              <button type="button" className="social-viewer-arrow is-next" aria-label="Próxima mídia" onClick={() => changeMedia(1)}>›</button>
              <span className="social-viewer-counter">{activeMediaIndex + 1} / {media.length}</span>
            </>
          )}
        </div>
        <aside className="social-viewer-details">
          <header className="social-viewer-author">
            {authorAvatar
              ? <img src={authorAvatar} alt="" />
              : <span>{initials(authorName || 'Pessoa')}</span>}
            <div><strong>{authorName}</strong>{location && <small>{location}</small>}</div>
            <button type="button" aria-label="Fechar publicação" onClick={onClose}>×</button>
          </header>
          <div className="social-viewer-copy">
            {caption && <p>{caption}</p>}
            {hashtags.length > 0 && (
              <div className="social-viewer-hashtags">
                {hashtags.map((tag) => <button type="button" key={tag} onClick={() => onHashtagClick(tag)}>#{tag}</button>)}
              </div>
            )}
          </div>
          <div className="social-viewer-comments" aria-live="polite">
            {commentsLoading ? <p className="social-viewer-status">Carregando comentários...</p> : comments.length ? comments.map((comment) => (
              <article className="social-viewer-comment" key={comment.id}>
                {comment.author_avatar
                  ? <img src={comment.author_avatar} alt="" />
                  : <span>{initials(comment.author_name || 'Pessoa')}</span>}
                <p><Link to={`/comunidade/perfil/${comment.user_id}`}>{comment.author_name}</Link> {comment.comment}</p>
              </article>
            )) : <p className="social-viewer-status">Ainda não há comentários. Comece a conversa.</p>}
          </div>
          <div className="social-viewer-actions">
            <button type="button" className={likedValue ? 'is-liked' : ''} aria-pressed={likedValue} disabled={likeSubmitting} onClick={() => void toggleLike()}>
              <IconHeart aria-hidden="true" /> <strong>{likeCountValue}</strong> curtidas
            </button>
            <span><IconMessageCircle aria-hidden="true" /> <strong>{commentCount + (comments.length > commentCount ? comments.length - commentCount : 0)}</strong> comentários</span>
          </div>
          <form className="social-viewer-form" onSubmit={(event) => { event.preventDefault(); void submitComment(); }}>
            <input value={commentText} onChange={(event) => setCommentText(event.target.value)} aria-label="Escreva um comentário" placeholder="Adicione um comentário..." maxLength={1000} />
            <button type="submit" disabled={!commentText.trim() || commentSubmitting}>{commentSubmitting ? 'Enviando...' : 'Publicar'}</button>
          </form>
          {commentError && <p className="social-viewer-error" role="alert">{commentError}</p>}
        </aside>
      </section>
    </div>
  );
}
