import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { SocialPostViewer } from '../components/SocialPostViewer';
import { isSocialVideo, type SocialMediaItem } from '../utils/socialMedia';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

type SocialUser = {
  id: number;
  full_name: string;
  profile_picture?: string | null;
  bio?: string;
  is_demo?: boolean;
  follower_count?: number;
  following?: boolean;
};

type SocialPost = {
  id: number;
  user_id: number;
  author_name: string;
  author_avatar?: string | null;
  location?: string;
  place_name?: string;
  caption?: string;
  hashtags: string[];
  privacy: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
  is_demo?: boolean;
  photos: SocialMediaItem[];
  like_count: number;
  comment_count: number;
  liked: boolean;
};

type RelationshipResponse = { followers: SocialUser[]; following: SocialUser[] };

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function SocialPage() {
  const { user, updateUserProfile } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [followers, setFollowers] = useState<SocialUser[]>([]);
  const [following, setFollowing] = useState<SocialUser[]>([]);
  const [suggestions, setSuggestions] = useState<SocialUser[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<SocialUser[]>([]);
  const [myPostCount, setMyPostCount] = useState(0);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [privacy, setPrivacy] = useState<SocialPost['privacy']>('PUBLIC');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [message, setMessage] = useState('');
  const [viewer, setViewer] = useState<{ post: SocialPost; mediaIndex: number } | null>(null);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'trips'>('posts');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [socialLinks, setSocialLinks] = useState((user?.profile?.socialLinks || []).join('\n'));
  const [relationshipList, setRelationshipList] = useState<'followers' | 'following' | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const currentUserId = user?.id;

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<{ posts: SocialPost[] }>('/social/posts', { params: { limit: 30 } });
      setPosts(response.data.posts);
    } catch (error) {
      console.error('Erro ao carregar publicações:', error);
      setMessage('Não foi possível carregar as publicações.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCommunity = useCallback(async () => {
    const userId = currentUserId;
    if (!userId) return;
    try {
      const [relationshipResponse, suggestionsResponse, blockedResponse, profileResponse] = await Promise.all([
        api.get<RelationshipResponse>(`/social/users/${userId}/relationships`),
        api.get<{ users: SocialUser[] }>('/social/users', { params: { limit: 8 } }),
        api.get<{ users: SocialUser[] }>(`/social/users/${userId}/blocked`),
        api.get<{ user: { post_count: number } }>(`/social/users/${userId}`),
      ]);
      setFollowers(relationshipResponse.data.followers);
      setFollowing(relationshipResponse.data.following);
      setSuggestions(suggestionsResponse.data.users);
      setBlockedUsers(blockedResponse.data.users);
      setMyPostCount(profileResponse.data.user.post_count);
    } catch (error) {
      console.error('Erro ao carregar dados da comunidade:', error);
      setMessage('Não foi possível carregar os dados de perfis e seguidores.');
    }
  }, [currentUserId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPosts(), 0);
    return () => window.clearTimeout(timer);
  }, [loadPosts]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCommunity(), 0);
    return () => window.clearTimeout(timer);
  }, [loadCommunity]);

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview)), [previews]);

  const chooseFiles = (files: FileList | null) => {
    previews.forEach((preview) => URL.revokeObjectURL(preview));
    const next = Array.from(files || []).slice(0, 10);
    setSelectedFiles(next);
    setPreviews(next.map((file) => URL.createObjectURL(file)));
  };

  const publish = async () => {
    if (!selectedFiles.length) {
      setMessage('Escolha pelo menos uma fotografia.');
      return;
    }
    setPublishing(true);
    setMessage('');
    try {
      const data = new FormData();
      data.append('caption', caption);
      data.append('location', location);
      data.append('hashtags', hashtags);
      data.append('privacy', privacy);
      selectedFiles.forEach((file) => data.append('photos', file));
      await api.post('/social/posts', data);
      setCaption('');
      setLocation('');
      setHashtags('');
      setSelectedFiles([]);
      previews.forEach(URL.revokeObjectURL);
      setPreviews([]);
      setMessage('Publicação realizada!');
      await loadPosts();
    } catch (error) {
      console.error('Erro ao publicar:', error);
      setMessage('Não foi possível publicar. Verifique as fotografias e tente novamente.');
    } finally {
      setPublishing(false);
    }
  };

  const toggleLike = async (postId: number): Promise<boolean> => {
    try {
      const response = await api.post<{ liked: boolean }>(`/social/posts/${postId}/like`);
      setPosts((current) => current.map((post) => post.id === postId
        ? { ...post, liked: response.data.liked, like_count: post.like_count + (response.data.liked ? 1 : -1) }
        : post));
      return true;
    } catch (error) {
      console.error('Erro ao atualizar curtida:', error);
      setMessage('Não foi possível atualizar a curtida.');
      return false;
    }
  };

  const toggleFollow = async (accountId: number) => {
    try {
      const response = await api.post<{ following: boolean }>(`/social/users/${accountId}/follow`);
      setSuggestions((current) => current.map((account) => account.id === accountId
        ? { ...account, following: response.data.following, follower_count: Math.max(0, (account.follower_count || 0) + (response.data.following ? 1 : -1)) }
        : account));
      await loadCommunity();
    } catch (error) {
      console.error('Erro ao seguir perfil:', error);
      setMessage('Não foi possível atualizar o perfil seguido.');
    }
  };

  const removeFollower = async (follower: SocialUser) => {
    try {
      await api.delete(`/social/users/${user?.id}/followers/${follower.id}`);
      setFollowers((current) => current.filter((item) => item.id !== follower.id));
    } catch (error) {
      console.error('Erro ao remover seguidor:', error);
      setMessage('Não foi possível remover este seguidor.');
    }
  };

  const toggleBlock = async (account: SocialUser) => {
    if (!window.confirm(`Bloquear ${account.full_name}? Essa pessoa não poderá ver seu perfil nem suas publicações.`)) return;
    try {
      const response = await api.post<{ blocked: boolean }>(`/social/users/${account.id}/block`);
      setBlockedUsers((current) => response.data.blocked
        ? [...current, account]
        : current.filter((item) => item.id !== account.id));
      setMessage(response.data.blocked ? `${account.full_name} foi bloqueado.` : `${account.full_name} foi desbloqueado.`);
      await loadCommunity();
      await loadPosts();
    } catch (error) {
      console.error('Erro ao bloquear perfil:', error);
      setMessage('Não foi possível atualizar o bloqueio.');
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setMessage('');
    try {
      const links = socialLinks.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
      await updateUserProfile({ bio: bio.trim(), socialLinks: links });
      setProfileEditorOpen(false);
      setMessage('Perfil atualizado.');
    } catch (error) {
      console.error('Erro ao salvar perfil social:', error);
      setMessage('Não foi possível salvar seu perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const displayedFollowers = relationshipList === 'followers' ? followers : following;
  const tripPhotos = Array.from(new Map(posts.flatMap((post) => (
    [...new Map(post.photos.map((photo) => [photo.photo_url, photo])).values()]
      .map((photo) => [photo.photo_url, { post, photo }] as const)
  ))).values());

  const closeViewer = useCallback(() => setViewer(null), []);

  const updateViewerCommentCount = () => {
    if (!viewer) return;
    setPosts((current) => current.map((post) => post.id === viewer.post.id
      ? { ...post, comment_count: post.comment_count + 1 }
      : post));
  };

  return (
    <div className="social-page">
      <Header />
      <main className="social-shell social-full-width">
        <section className="social-profile social-own-profile">
          {user?.profile_picture
            ? <img className="social-avatar social-avatar-image" src={user.profile_picture} alt="" />
            : <div className="social-avatar">{initials(user?.full_name || 'Sua comunidade')}</div>}
          <div className="social-profile-copy">
            <p className="social-eyebrow">COMUNIDADE TRUACESS</p>
            <h1>{user?.full_name || 'Sua comunidade'}</h1>
            {user?.profile?.bio && <p className="social-profile-bio">{user.profile.bio}</p>}
            <div className="social-profile-links">
              {(user?.profile?.socialLinks || []).map((link) => {
                const url = safeExternalUrl(link);
                return url ? <a href={url} key={url} target="_blank" rel="noreferrer">{url}</a> : null;
              })}
            </div>
            <div className="social-stats">
              <span><strong>{myPostCount}</strong> publicações</span>
              <button type="button" onClick={() => setRelationshipList('followers')}><strong>{followers.length}</strong> seguidores</button>
              <button type="button" onClick={() => setRelationshipList('following')}><strong>{following.length}</strong> seguindo</button>
            </div>
            <button type="button" className="social-secondary-button" onClick={() => setProfileEditorOpen((open) => !open)}>
              {profileEditorOpen ? 'Fechar edição' : 'Editar perfil'}
            </button>
          </div>
        </section>

        {profileEditorOpen && (
          <section className="social-profile-editor">
            <h2>Seu perfil público</h2>
            <label>Biografia
              <textarea value={bio} maxLength={500} onChange={(event) => setBio(event.target.value)} placeholder="Conte um pouco sobre você. Emojis são bem-vindos!" rows={4} />
              <small>{bio.length}/500 caracteres</small>
            </label>
            <label>Links (um por linha)
              <textarea value={socialLinks} onChange={(event) => setSocialLinks(event.target.value)} placeholder={'https://instagram.com/seu-perfil\\nhttps://seusite.com'} rows={3} />
            </label>
            <button type="button" className="social-publish" disabled={savingProfile} onClick={() => void saveProfile()}>
              {savingProfile ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </section>
        )}

        <div className="social-layout">
          <div className="social-main-column">
            <section className="social-composer">
              <div className="social-composer-heading">
                <div><p>COMPARTILHE</p><strong>Conte sua experiência</strong></div>
                <button type="button" aria-expanded={composerOpen} onClick={() => setComposerOpen((open) => !open)}>
                  {composerOpen ? 'Fechar' : 'Nova publicação'}
                </button>
              </div>
              {composerOpen && (
                <>
                  <button type="button" className="social-add-photos" onClick={() => fileInput.current?.click()}>Adicionar fotos ou vídeos</button>
                  <textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Escreva uma legenda sobre o local..." rows={3} />
                  <div className="social-composer-fields">
                    <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Localização" />
                    <input value={hashtags} onChange={(event) => setHashtags(event.target.value)} placeholder="#turismo #acessibilidade" />
                    <label className="social-privacy">Quem pode ver?
                      <select value={privacy} onChange={(event) => setPrivacy(event.target.value as SocialPost['privacy'])}>
                        <option value="PUBLIC">Todos</option>
                        <option value="FOLLOWERS">Seguidores</option>
                        <option value="PRIVATE">Somente eu</option>
                      </select>
                    </label>
                  </div>
                  <input ref={fileInput} className="social-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" multiple onChange={(event) => chooseFiles(event.target.files)} />
                  {previews.length > 0 && <div className="social-preview-grid">{previews.map((preview, index) => <div key={preview}>{selectedFiles[index]?.type.startsWith('video/') ? <video src={preview} aria-label={`Prévia do vídeo ${index + 1}`} muted playsInline /> : <img src={preview} alt={`Prévia ${index + 1}`} />}<button type="button" aria-label="Remover arquivo" onClick={() => { URL.revokeObjectURL(preview); setPreviews((current) => current.filter((_, item) => item !== index)); setSelectedFiles((current) => current.filter((_, item) => item !== index)); }}>×</button></div>)}</div>}
                  <button type="button" className="social-publish" disabled={publishing || !selectedFiles.length} onClick={() => void publish()}>
                    {publishing ? 'Publicando...' : 'Publicar'}
                  </button>
                </>
              )}
              {message && <p role="status" className="social-message">{message}</p>}
            </section>

            <div className="social-tabs" role="tablist" aria-label="Conteúdo da comunidade">
              <button type="button" role="tab" aria-selected={activeTab === 'posts'} className={activeTab === 'posts' ? 'is-active' : ''} onClick={() => setActiveTab('posts')}>Publicações</button>
              <button type="button" role="tab" aria-selected={activeTab === 'trips'} className={activeTab === 'trips' ? 'is-active' : ''} onClick={() => setActiveTab('trips')}>Viagens</button>
            </div>

            {activeTab === 'posts' ? (
              <section className="social-feed" role="tabpanel">
                <div className="social-section-heading"><p>FEED</p><h2>Publicações da comunidade</h2></div>
                {loading ? <p role="status">Carregando publicações...</p> : posts.length ? posts.map((post) => (
                <article className="social-post" key={post.id}>
                  <header>
                    <Link to={`/comunidade/perfil/${post.user_id}`} className="social-post-identity">
                      {post.author_avatar
                        ? <img className="social-post-avatar" src={post.author_avatar} alt="" />
                        : <span className="social-post-avatar">{initials(post.author_name || 'Pessoa')}</span>}
                      <span><strong>{post.author_name}</strong>{post.is_demo && <small className="social-demo-label">Perfil demonstrativo</small>}{post.location && <small>📍 {post.location}</small>}</span>
                    </Link>
                    {post.user_id === user?.id && <button type="button" onClick={async () => {
                      if (!window.confirm('Excluir esta publicação?')) return;
                      try {
                        await api.delete(`/social/posts/${post.id}`);
                        setPosts((current) => current.filter((item) => item.id !== post.id));
                      } catch (error) {
                        console.error('Erro ao excluir publicação:', error);
                        setMessage('Não foi possível excluir esta publicação.');
                      }
                    }} className="social-post-delete">Excluir</button>}
                  </header>
                  <div className={`social-post-images${post.photos.length === 1 ? ' is-single' : ''}`}>
                    {post.photos.map((photo, mediaIndex) => (
                      <button type="button" className="social-post-media" key={photo.id} aria-label={isSocialVideo(photo) ? 'Expandir vídeo da publicação' : 'Expandir foto da publicação'} onClick={() => setViewer({ post, mediaIndex })}>
                        {isSocialVideo(photo)
                          ? <><video className="social-post-image" src={photo.photo_url} muted playsInline preload="metadata" /><span className="social-video-play" aria-hidden="true">▶</span></>
                          : <img className="social-post-image" src={photo.photo_url} alt={post.caption || 'Publicação da comunidade'} loading="lazy" />}
                      </button>
                    ))}
                  </div>
                  {post.caption && <p className="social-post-caption">{post.caption}</p>}
                  <p className="social-hashtags">{post.hashtags?.map((tag) => `#${tag}`).join(' ')}</p>
                  <div className="social-post-actions">
                    <button type="button" aria-pressed={post.liked} onClick={() => void toggleLike(post.id)}>{post.liked ? '♥' : '♡'} {post.like_count}</button>
                    <button type="button" onClick={() => setViewer({ post, mediaIndex: 0 })}>💬 {post.comment_count}</button>
                  </div>
                </article>
                )) : <div className="social-empty"><strong>O feed está pronto para a primeira história</strong><p>Publique uma fotografia acima para começar.</p></div>}
              </section>
            ) : (
              <section className="social-trips" role="tabpanel">
                <div className="social-section-heading"><p>INSPIRAÇÃO</p><h2>Viagens da comunidade</h2></div>
                {loading ? <p role="status">Carregando viagens...</p> : tripPhotos.length ? (
                  <div className="social-trip-grid">
                    {tripPhotos.map(({ post, photo }) => (
                      <button type="button" className="social-trip-photo" key={photo.photo_url} onClick={() => setViewer({ post, mediaIndex: post.photos.findIndex((item) => item.photo_url === photo.photo_url) })}>
                        {isSocialVideo(photo)
                          ? <><video src={photo.photo_url} muted playsInline preload="metadata" /><i aria-hidden="true">▶</i></>
                          : <img src={photo.photo_url} alt={post.caption || `Viagem de ${post.author_name}`} loading="lazy" />}
                        <span><strong>{post.author_name}</strong><small>{post.location || post.caption}</small></span>
                      </button>
                    ))}
                  </div>
                ) : <div className="social-empty"><strong>Ainda não há fotos de viagens</strong><p>As fotos publicadas pela comunidade aparecerão aqui.</p></div>}
              </section>
            )}
          </div>

          <aside className="social-sidebar">
            <section className="social-featured">
              <div className="social-section-heading"><p>DESCUBRA</p><h2>Perfis para seguir</h2></div>
              <div className="social-accounts">
                {suggestions.map((account) => (
                  <article className="social-account" key={account.id}>
                    <Link to={`/comunidade/perfil/${account.id}`} className="social-account-identity">
                      {account.profile_picture
                        ? <img className="social-account-avatar" src={account.profile_picture} alt="" />
                        : <span className="social-account-avatar">{initials(account.full_name)}</span>}
                      <span><strong>{account.full_name}</strong>{account.is_demo && <small className="social-demo-label">Perfil demonstrativo</small>}<small>{account.follower_count || 0} seguidores</small></span>
                    </Link>
                    <div className="social-account-actions">
                      <button type="button" onClick={() => void toggleFollow(account.id)}>{account.following ? 'Seguindo' : 'Seguir'}</button>
                      <button type="button" className="social-icon-button" onClick={() => void toggleBlock(account)}>Bloquear</button>
                    </div>
                  </article>
                ))}
                {!suggestions.length && <p>Ainda não há outros perfis para sugerir.</p>}
              </div>
            </section>

            {blockedUsers.length > 0 && (
              <section className="social-featured social-blocked">
                <div className="social-section-heading"><p>PRIVACIDADE</p><h2>Perfis bloqueados</h2></div>
                <div className="social-accounts">
                  {blockedUsers.map((account) => (
                    <article className="social-account" key={account.id}>
                      <span className="social-account-identity"><span className="social-account-avatar">{initials(account.full_name)}</span><strong>{account.full_name}</strong></span>
                      <button type="button" onClick={() => void toggleBlock(account)}>Desbloquear</button>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>

      {relationshipList && (
        <div className="social-dialog-backdrop" role="presentation" onClick={() => setRelationshipList(null)}>
          <section className="social-dialog" role="dialog" aria-modal="true" aria-labelledby="social-dialog-title" onClick={(event) => event.stopPropagation()}>
            <header><h2 id="social-dialog-title">{relationshipList === 'followers' ? 'Seguidores' : 'Seguindo'}</h2><button type="button" aria-label="Fechar" onClick={() => setRelationshipList(null)}>×</button></header>
            {displayedFollowers.length ? displayedFollowers.map((person) => (
              <div className="social-relationship-row" key={person.id}>
                <Link to={`/comunidade/perfil/${person.id}`} onClick={() => setRelationshipList(null)}>
                  {person.profile_picture ? <img src={person.profile_picture} alt="" /> : <span>{initials(person.full_name)}</span>}
                  <strong>{person.full_name}</strong>
                </Link>
                {relationshipList === 'followers' && <button type="button" onClick={() => void removeFollower(person)}>Remover</button>}
              </div>
            )) : <p>Nenhuma pessoa nesta lista ainda.</p>}
          </section>
        </div>
      )}
      {viewer && (
        <SocialPostViewer
          postId={viewer.post.id}
          media={viewer.post.photos}
          initialMediaIndex={viewer.mediaIndex}
          authorName={viewer.post.author_name}
          authorAvatar={viewer.post.author_avatar}
          caption={viewer.post.caption}
          location={viewer.post.location}
          hashtags={viewer.post.hashtags}
          likeCount={viewer.post.like_count}
          commentCount={viewer.post.comment_count}
          liked={viewer.post.liked}
          onToggleLike={() => toggleLike(viewer.post.id)}
          onCommentAdded={updateViewerCommentCount}
          onClose={closeViewer}
        />
      )}
    </div>
  );
}
