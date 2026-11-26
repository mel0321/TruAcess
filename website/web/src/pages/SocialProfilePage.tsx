import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { SocialPostViewer } from '../components/SocialPostViewer';
import { isSocialVideo, type SocialMediaItem } from '../utils/socialMedia';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

type PublicProfile = {
  id: number;
  full_name: string;
  profile_picture?: string | null;
  bio: string;
  social_links: string[];
  is_demo?: boolean;
  is_following: boolean;
  is_follow_requested: boolean;
  is_followed_by: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
};

type SocialPost = {
  id: number;
  caption?: string;
  location?: string;
  hashtags: string[];
  photos: SocialMediaItem[];
  like_count: number;
  comment_count: number;
  liked: boolean;
};

type Relationship = { id: number; full_name: string; profile_picture?: string | null };

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function SocialProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [followers, setFollowers] = useState<Relationship[]>([]);
  const [following, setFollowing] = useState<Relationship[]>([]);
  const [relationshipList, setRelationshipList] = useState<'followers' | 'following' | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState(false);
  const [error, setError] = useState('');
  const [viewer, setViewer] = useState<{ postId: number; mediaIndex: number } | null>(null);
  const isOwnProfile = Number(userId) === user?.id;
  const viewerPost = viewer ? posts.find((post) => post.id === viewer.postId) : undefined;
  const closeViewer = useCallback(() => setViewer(null), []);

  const loadProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const [profileResponse, postsResponse, relationshipsResponse] = await Promise.all([
        api.get<{ user: PublicProfile }>(`/social/users/${userId}`),
        api.get<{ posts: SocialPost[] }>(`/social/users/${userId}/posts`),
        api.get<{ followers: Relationship[]; following: Relationship[] }>(`/social/users/${userId}/relationships`),
      ]);
      setProfile(profileResponse.data.user);
      setPosts(postsResponse.data.posts);
      setFollowers(relationshipsResponse.data.followers);
      setFollowing(relationshipsResponse.data.following);
    } catch (loadError) {
      console.error('Erro ao carregar perfil social:', loadError);
      setError('Este perfil não está disponível. Ele pode ter sido removido ou bloqueado você.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProfile(), 0);
    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  const toggleFollow = async () => {
    if (!profile) return;
    setSavingAction(true);
    setError('');
    try {
      await api.post(`/social/users/${profile.id}/follow`);
      await loadProfile();
    } catch (actionError) {
      console.error('Erro ao seguir perfil:', actionError);
      setError('Não foi possível atualizar o vínculo com este perfil.');
    } finally {
      setSavingAction(false);
    }
  };

  const togglePostLike = async (postId: number): Promise<boolean> => {
    try {
      const response = await api.post<{ liked: boolean }>(`/social/posts/${postId}/like`);
      setPosts((current) => current.map((post) => post.id === postId
        ? { ...post, liked: response.data.liked, like_count: Math.max(0, post.like_count + (response.data.liked ? 1 : -1)) }
        : post));
      return true;
    } catch (actionError) {
      console.error('Erro ao atualizar curtida da publicação:', actionError);
      setError('Não foi possível atualizar a curtida.');
      return false;
    }
  };

  const updatePostCommentCount = (postId: number) => {
    setPosts((current) => current.map((post) => post.id === postId
      ? { ...post, comment_count: post.comment_count + 1 }
      : post));
  };

  const toggleBlock = async () => {
    if (!profile) return;
    const confirmation = window.confirm('Bloquear esta pessoa? Ela não poderá ver seu perfil nem suas publicações.');
    if (!confirmation) return;
    setSavingAction(true);
    setError('');
    try {
      const response = await api.post<{ blocked: boolean }>(`/social/users/${profile.id}/block`);
      if (response.data.blocked) {
        navigate('/comunidade', { replace: true });
        return;
      }
      await loadProfile();
    } catch (actionError) {
      console.error('Erro ao atualizar bloqueio:', actionError);
      setError('Não foi possível atualizar o bloqueio.');
    } finally {
      setSavingAction(false);
    }
  };

  const displayedRelations = relationshipList === 'followers' ? followers : following;

  return (
    <div className="social-page">
      <Header />
      <main className="social-shell social-profile-page">
        <Link to="/comunidade" className="social-back-link">Voltar à comunidade</Link>
        {loading ? <p role="status">Carregando perfil...</p> : error && !profile ? <p role="alert" className="social-error">{error}</p> : profile && (
          <>
            <section className="social-profile">
              {profile.profile_picture
                ? <img className="social-avatar social-avatar-image" src={profile.profile_picture} alt="" />
                : <div className="social-avatar">{initials(profile.full_name)}</div>}
              <div className="social-profile-copy">
                <p className="social-eyebrow">PERFIL DA COMUNIDADE</p>
                <h1>{profile.full_name}</h1>
                {profile.is_demo && <span className="social-demo-label">Perfil demonstrativo</span>}
                {profile.bio && <p className="social-profile-bio">{profile.bio}</p>}
                <div className="social-profile-links">
                  {profile.social_links.map((link) => {
                    const url = safeExternalUrl(link);
                    return url ? <a href={url} key={url} target="_blank" rel="noreferrer">{url}</a> : null;
                  })}
                </div>
                <div className="social-stats">
                  <span><strong>{profile.post_count}</strong> publicações</span>
                  <button type="button" onClick={() => setRelationshipList('followers')}><strong>{profile.follower_count}</strong> seguidores</button>
                  <button type="button" onClick={() => setRelationshipList('following')}><strong>{profile.following_count}</strong> seguindo</button>
                </div>
                {!isOwnProfile && (
                  <div className="social-profile-actions">
                    <button type="button" className="social-publish" disabled={savingAction} onClick={() => void toggleFollow()}>
                      {profile.is_following ? 'Deixar de seguir' : profile.is_follow_requested ? 'Cancelar solicitação' : 'Solicitar para seguir'}
                    </button>
                    <button type="button" className="social-secondary-button" disabled={savingAction} onClick={() => void toggleBlock()}>
                      Bloquear pessoa
                    </button>
                  </div>
                )}
              </div>
            </section>
            {error && <p role="alert" className="social-error">{error}</p>}
            <section className="social-profile-posts">
              <div className="social-section-heading"><p>GALERIA</p><h2>Publicações de {profile.full_name}</h2></div>
              {posts.length ? (
                <div className="social-photo-grid">
                  {posts.flatMap((post) => post.photos.map((photo, mediaIndex) => (
                    <button type="button" className="social-profile-photo" key={`${post.id}-${photo.id}`} aria-label={isSocialVideo(photo) ? 'Expandir vídeo da publicação' : 'Expandir foto da publicação'} onClick={() => setViewer({ postId: post.id, mediaIndex })}>
                      {isSocialVideo(photo)
                        ? <><video src={photo.photo_url} muted playsInline preload="metadata" /><i aria-hidden="true">▶</i></>
                        : <img src={photo.photo_url} alt={post.caption || `Foto de ${profile.full_name}`} loading="lazy" />}
                      {post.caption && <span>{post.caption}</span>}
                    </button>
                  )))}
                </div>
              ) : <p className="social-empty">Este perfil ainda não tem publicações visíveis.</p>}
            </section>
          </>
        )}
      </main>
      {relationshipList && (
        <div className="social-dialog-backdrop" role="presentation" onClick={() => setRelationshipList(null)}>
          <section className="social-dialog" role="dialog" aria-modal="true" aria-labelledby="social-dialog-title" onClick={(event) => event.stopPropagation()}>
            <header><h2 id="social-dialog-title">{relationshipList === 'followers' ? 'Seguidores' : 'Seguindo'}</h2><button type="button" aria-label="Fechar" onClick={() => setRelationshipList(null)}>×</button></header>
            {displayedRelations.length ? displayedRelations.map((person) => (
              <div className="social-relationship-row" key={person.id}>
                <Link to={`/comunidade/perfil/${person.id}`} onClick={() => setRelationshipList(null)}>
                  {person.profile_picture ? <img src={person.profile_picture} alt="" /> : <span>{initials(person.full_name)}</span>}
                  <strong>{person.full_name}</strong>
                </Link>
              </div>
            )) : <p>Nenhuma pessoa nesta lista ainda.</p>}
          </section>
        </div>
      )}
      {viewer && viewerPost && profile && (
        <SocialPostViewer
          key={viewerPost.id}
          postId={viewerPost.id}
          media={viewerPost.photos}
          initialMediaIndex={viewer.mediaIndex}
          authorName={profile.full_name}
          authorAvatar={profile.profile_picture}
          caption={viewerPost.caption}
          location={viewerPost.location}
          hashtags={viewerPost.hashtags}
          likeCount={viewerPost.like_count}
          commentCount={viewerPost.comment_count}
          liked={viewerPost.liked}
          onToggleLike={() => togglePostLike(viewerPost.id)}
          onCommentAdded={() => updatePostCommentCount(viewerPost.id)}
          onHashtagClick={(tag) => navigate(`/comunidade?hashtag=${encodeURIComponent(tag.replace(/^#+/, ''))}`)}
          onClose={closeViewer}
        />
      )}
    </div>
  );
}
