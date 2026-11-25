import { useEffect, useRef, useState } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

type SocialPost = {
  id: number; user_id: number; author_name: string; author_avatar?: string;
  location?: string; place_name?: string; caption?: string; hashtags: string[];
  photos: Array<{ id: number; photo_url: string }>; like_count: number; comment_count: number; liked: boolean;
};

export function SocialPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [following, setFollowing] = useState<number[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');
  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const loadPosts = async () => {
    setLoading(true);
    try { const response = await api.get<{ posts: SocialPost[] }>('/social/posts', { params: { limit: 30 } }); setPosts(response.data.posts); }
    catch { setMessage('Não foi possível carregar as publicações.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadPosts(); }, []);

  const chooseFiles = (files: FileList | null) => {
    const next = Array.from(files || []).slice(0, 10);
    setSelectedFiles(next);
    setPreviews(next.map((file) => URL.createObjectURL(file)));
  };

  const publish = async () => {
    if (!selectedFiles.length) { setMessage('Escolha pelo menos uma fotografia.'); return; }
    setPublishing(true); setMessage('');
    try {
      const data = new FormData();
      data.append('caption', caption); data.append('location', location);
      data.append('hashtags', hashtags);
      selectedFiles.forEach((file) => data.append('photos', file));
      await api.post('/social/posts', data);
      setCaption(''); setLocation(''); setHashtags(''); setSelectedFiles([]); previews.forEach(URL.revokeObjectURL); setPreviews([]); setMessage('Publicação realizada!');
      await loadPosts();
    } catch { setMessage('Não foi possível publicar. Verifique as fotografias e tente novamente.'); }
    finally { setPublishing(false); }
  };

  const toggleLike = async (postId: number) => {
    try {
      await api.post(`/social/posts/${postId}/like`);
      setPosts((current) => current.map((post) => post.id === postId ? { ...post, liked: !post.liked, like_count: post.like_count + (post.liked ? -1 : 1) } : post));
    } catch { setMessage('Não foi possível atualizar a curtida.'); }
  };

  const submitComment = async (postId: number) => {
    if (!commentText.trim()) return;
    try {
      await api.post(`/social/posts/${postId}/comments`, { comment: commentText.trim() });
      setCommentText(''); setCommentPostId(null);
      setPosts((current) => current.map((post) => post.id === postId ? { ...post, comment_count: post.comment_count + 1 } : post));
    } catch { setMessage('Não foi possível publicar o comentário.'); }
  };

  const accounts = [
    { id: 2, name: 'Gabriel Turista', handle: '@gabrielrota', initials: 'GT', tone: '#052659' },
    { id: 3, name: 'Viajar com Acessibilidade', handle: '@viajaracessivel', initials: 'VA', tone: '#087F8C' },
    { id: 4, name: 'Pousadas Inclusivas', handle: '@pousadasin', initials: 'PI', tone: '#0F766E' },
  ].filter((account) => account.id !== user?.id);

  return (
    <div className="social-page"><Header /><main className="social-shell social-full-width">
      <section className="social-profile"><div className="social-avatar">{user?.full_name?.split(' ').slice(0,2).map((part) => part[0]).join('').toUpperCase() || 'TU'}</div><div className="social-profile-copy"><p className="social-eyebrow">COMUNIDADE TRUACESS</p><h1>{user?.full_name || 'Sua comunidade'}</h1><div className="social-stats"><span><strong>{posts.filter((post) => post.user_id === user?.id).length}</strong> publicações</span><span><strong>{following.length}</strong> seguindo</span><span><strong>{posts.length}</strong> no feed</span></div></div></section>

      <section className="social-composer"><div className="social-composer-heading"><div><p>NOVA PUBLICAÇÃO</p><strong>Compartilhe sua experiência</strong></div><button type="button" onClick={() => fileInput.current?.click()}>Adicionar fotos</button></div>
        <textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Escreva uma legenda sobre o local..." rows={3} />
        <div className="social-composer-fields"><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Localização" /><input value={hashtags} onChange={(event) => setHashtags(event.target.value)} placeholder="#turismo #acessibilidade" /></div>
        <input ref={fileInput} className="social-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={(event) => chooseFiles(event.target.files)} />
        {previews.length > 0 && <div className="social-preview-grid">{previews.map((preview, index) => <div key={preview}><img src={preview} alt={`Prévia ${index + 1}`} /><button type="button" aria-label="Remover foto" onClick={() => { URL.revokeObjectURL(preview); setPreviews((current) => current.filter((_, item) => item !== index)); setSelectedFiles((current) => current.filter((_, item) => item !== index)); }}>×</button></div>)}</div>}
        {message && <p role="status" className="social-message">{message}</p>}<button type="button" className="social-publish" disabled={publishing || !selectedFiles.length} onClick={() => void publish()}>{publishing ? 'Publicando...' : 'Publicar fotos'}</button>
      </section>

      <section className="social-featured"><div className="social-section-heading"><p>DESCUBRA</p><h2>Contas em destaque</h2></div><div className="social-accounts">{accounts.map((account) => <article className="social-account" key={account.id}><div className="social-account-avatar" style={{background:account.tone}}>{account.initials}</div><div><strong>{account.name}</strong><span>{account.handle}</span></div><button type="button" onClick={() => { setFollowing((current) => current.includes(account.id) ? current.filter((id) => id !== account.id) : [...current, account.id]); void api.post(`/social/users/${account.id}/follow`).catch(() => undefined); }}>{following.includes(account.id) ? 'Seguindo' : 'Seguir'}</button></article>)}</div></section>

      <section className="social-feed"><div className="social-section-heading"><p>FEED</p><h2>Publicações da comunidade</h2></div>{loading ? <p role="status">Carregando publicações...</p> : posts.length ? posts.map((post) => <article className="social-post" key={post.id}><header><div className="social-post-avatar">{post.author_name?.slice(0,2).toUpperCase()}</div><div><strong>{post.author_name}</strong>{post.location && <span>📍 {post.location}</span>}</div>{post.user_id === user?.id && <button type="button" onClick={async () => { if (!window.confirm('Excluir esta publicação?')) return; await api.delete(`/social/posts/${post.id}`).catch(() => undefined); await loadPosts(); }} className="social-post-delete">Excluir</button>}</header>
        <div className="social-post-images">{post.photos?.map((photo) => <img className="social-post-image" key={photo.id} src={photo.photo_url} alt={post.caption || 'Publicação da comunidade'} />)}</div>{post.caption && <p className="social-post-caption">{post.caption}</p>}<p className="social-hashtags">{post.hashtags?.map((tag) => `#${tag}`).join(' ')}</p><div className="social-post-actions"><button type="button" aria-pressed={post.liked} onClick={() => void toggleLike(post.id)}>♡ {post.like_count}</button><button type="button" onClick={() => setCommentPostId(commentPostId === post.id ? null : post.id)}>💬 {post.comment_count}</button></div>{commentPostId === post.id && <div className="social-comment-box"><input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Escreva um comentário" /><button type="button" onClick={() => void submitComment(post.id)}>Enviar</button></div>}</article>) : <div className="social-empty"><strong>O feed está pronto para a primeira história</strong><p>Publique uma fotografia acima para começar.</p></div>}</section>
    </main></div>
  );
}
