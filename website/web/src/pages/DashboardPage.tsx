import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { LinkedAccountPanel } from '../components/LinkedAccountPanel';
import { IconStar, IconUsers, IconMapPin, IconMessageCircle, IconBell } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getPlaceCategoryDetailLabel, getPlaceCategoryLabel } from '../utils/placeCategories';
import { reviewAccessibilityAnswerLabel, reviewAccessibilityQuestions } from '../utils/reviewQuestionnaire';
import type { Place, Review } from '../types';

interface DashboardStats {
  total_places: number;
  total_reviews: number;
  average_rating: number | null;
  pending_replies_count: number;
  recent_reviews: Array<{
    id: number;
    place_id: number;
    establishment_name: string;
    traveler_name: string;
    experience_rating: number;
    accessibility_level: string;
    accessibility_details: Review['accessibility_details'];
    comment_text: string | null;
    owner_reply_text: string | null;
    created_at: string;
  }>;
}

const cardStyle = { background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(5, 38, 89, 0.05)' };
const headingStyle = { color: '#64748B', fontSize: 'calc(14px * var(--a11y-font-scale, 1))', margin: 0 };

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeTab, setActiveTab] = useState<'places' | 'reviews'>('places');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [placesResponse, statsResponse] = await Promise.all([
        api.get<{ places: Place[] }>('/business/places'),
        api.get<DashboardStats>('/business/stats'),
      ]);
      setPlaces(placesResponse.data.places);
      setStats(statsResponse.data);
    } catch (loadError) {
      console.error('Erro ao carregar painel do estabelecimento:', loadError);
      setError('Não foi possível carregar os dados do painel. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.user_type === 'BUSINESS') void loadDashboard();
    else setLoading(false);
  }, [loadDashboard, user?.user_type]);

  const deletePlace = async (place: Place) => {
    if (!window.confirm(`Excluir "${place.establishment_name}"? Essa ação também remove as avaliações associadas.`)) return;
    try {
      await api.delete(`/places/${place.id}`);
      await loadDashboard();
    } catch (deleteError) {
      console.error('Erro ao excluir estabelecimento:', deleteError);
      setError('Não foi possível excluir o estabelecimento. Tente novamente.');
    }
  };

  const placeMissingFields = (place: Place) => [
    !place.establishment_name?.trim() && 'Nome do estabelecimento',
    !place.category?.trim() && 'Categoria',
    !place.full_address?.trim() && 'Endereço completo',
    !place.city?.trim() && 'Cidade',
    !place.country?.trim() && 'País',
  ].filter((field): field is string => Boolean(field));

  if (user?.user_type !== 'BUSINESS') {
    return (
      <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
        <Header />
        <main className="container" style={{ padding: '64px 24px' }}>
          <h1 style={{ color: '#052659' }}>Painel de estabelecimentos</h1>
          <p>Entre com uma conta de estabelecimento para gerenciar locais e avaliações.</p>
          <LinkedAccountPanel manage={false} />
          <Link to="/login">Entrar</Link>
        </main>
      </div>
    );
  }

  if (loading) return <div role="status" style={{ padding: '100px', textAlign: 'center' }}>Carregando painel...</div>;

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <Header />
      <main className="container business-dashboard" style={{ paddingBlock: 40 }}>
        <div className="business-dashboard-heading">
          <div>
            <p style={{ color: '#0B8794', fontWeight: 700, letterSpacing: '.12em', fontSize: 'calc(12px * var(--a11y-font-scale, 1))' }}>ÁREA DO ESTABELECIMENTO</p>
            <h1 style={{ fontFamily: 'Poppins', fontSize: 'calc(32px * var(--a11y-font-scale, 1))', fontWeight: 800, color: '#052659', margin: 0 }}>Olá, {user.full_name.split(' ')[0]}</h1>
          </div>
          <Link to="/register-place" className="btn-plan" style={{ background: '#087F8C', padding: '13px 22px', borderRadius: '10px', textDecoration: 'none', color: 'white', fontWeight: 700 }}>+ Novo estabelecimento</Link>
        </div>

        <LinkedAccountPanel manage={false} />

        {error && <div role="alert" style={{ background: '#FEF2F2', color: '#991B1B', padding: 16, borderRadius: 12, marginBottom: 24 }}>{error} <button onClick={() => void loadDashboard()}>Tentar novamente</button></div>}

        {places.length === 0 ? (
          <section style={{ ...cardStyle, marginBottom: 24, border: '1px solid #FDE68A', background: '#FFFBEB' }}>
            <h2 style={{ margin: '0 0 8px', color: '#92400E', fontSize: 'calc(18px * var(--a11y-font-scale, 1))' }}>Perfil do estabelecimento incompleto</h2>
            <p style={{ margin: '0 0 16px', color: '#78350F' }}>Cadastre seu primeiro estabelecimento para adicionar as informações comerciais e de acessibilidade.</p>
            <Link to="/register-place" className="btn-plan" style={{ display: 'inline-block', background: '#087F8C' }}>Completar perfil do estabelecimento</Link>
          </section>
        ) : places.some((place) => placeMissingFields(place).length > 0) ? (
          <section style={{ ...cardStyle, marginBottom: 24, border: '1px solid #FDE68A', background: '#FFFBEB' }}>
            <h2 style={{ margin: '0 0 12px', color: '#92400E', fontSize: 'calc(18px * var(--a11y-font-scale, 1))' }}>Há informações incompletas</h2>
            {places.filter((place) => placeMissingFields(place).length > 0).map((place) => (
              <div key={place.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid #FDE68A', flexWrap: 'wrap' }}>
                <p style={{ margin: 0, color: '#78350F' }}><strong>{place.establishment_name || 'Estabelecimento'}</strong>: faltam {placeMissingFields(place).join(', ')}.</p>
                <Link to={`/edit-place/${place.id}`} style={{ color: '#052659', fontWeight: 700 }}>Completar informações</Link>
              </div>
            ))}
          </section>
        ) : null}

        <div className="business-dashboard-stats">
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><IconMapPin width={24} height={24} color="#052659" /><p style={headingStyle}>Meus locais</p></div>
            <p style={{ fontSize: 'calc(36px * var(--a11y-font-scale, 1))', fontWeight: 800, color: '#052659', margin: 0 }}>{stats?.total_places ?? places.length}</p>
          </div>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><IconStar width={24} height={24} color="#F59E0B" /><p style={headingStyle}>Nota de experiência</p></div>
            <p style={{ fontSize: 'calc(36px * var(--a11y-font-scale, 1))', fontWeight: 800, color: '#052659', margin: 0 }}>{stats?.average_rating?.toFixed(1) ?? '—'}<small style={{ fontSize: 'calc(16px * var(--a11y-font-scale, 1))' }}> / 5</small></p>
          </div>
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><IconUsers width={24} height={24} color="#087F8C" /><p style={headingStyle}>Avaliações</p></div>
            <p style={{ fontSize: 'calc(36px * var(--a11y-font-scale, 1))', fontWeight: 800, color: '#052659', margin: 0 }}>{stats?.total_reviews ?? 0}</p>
          </div>
          <div style={{ ...cardStyle, background: '#FEF3C7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><IconBell width={24} height={24} color="#D97706" /><p style={{ ...headingStyle, color: '#92400E' }}>Sem resposta</p></div>
            <p style={{ fontSize: 'calc(36px * var(--a11y-font-scale, 1))', fontWeight: 800, color: '#92400E', margin: 0 }}>{stats?.pending_replies_count ?? 0}</p>
          </div>
        </div>

        <div className="business-dashboard-tabs">
          <button onClick={() => setActiveTab('places')} aria-pressed={activeTab === 'places'}><IconMapPin width={18} height={18} /> Meus locais</button>
          <button onClick={() => setActiveTab('reviews')} aria-pressed={activeTab === 'reviews'}><IconMessageCircle width={18} height={18} /> Avaliações recebidas</button>
        </div>

        <section className="business-dashboard-panel">
          {activeTab === 'places' ? (
            <>
              <h2>Seus estabelecimentos</h2>
              {places.length === 0 ? (
                <div className="business-empty-state">
                  <IconMapPin width={32} height={32} />
                  <h3>Seu primeiro local começa aqui</h3>
                  <p>Cadastre endereço, informações de visita e recursos de acessibilidade para aparecer na busca de viajantes.</p>
                  <Link to="/register-place">Cadastrar estabelecimento</Link>
                </div>
              ) : (
                <div className="business-place-list">
                  {places.map((place) => (
                    <article className="business-place-card" key={place.id}>
                      {place.main_image ? <img src={place.main_image} alt="" /> : <div className="business-place-placeholder"><IconMapPin width={28} height={28} /></div>}
                      <div className="business-place-info">
                        <span>{getPlaceCategoryLabel(place.category)}{place.category_detail ? ` · ${getPlaceCategoryDetailLabel(place.category_detail)}` : ''}</span>
                        <h3>{place.establishment_name}</h3>
                        <p>{place.full_address || `${place.city}, ${place.state}`}</p>
                        <small>{place.total_reviews || 0} avaliações · {place.accessibility_score === null || place.accessibility_score === undefined ? 'Acessibilidade sem dados' : `${place.accessibility_score}% · ${place.accessibility_level}`}</small>
                      </div>
                      <div className="business-place-actions">
                        <Link to={`/edit-place/${place.id}`}>Editar</Link>
                        <button onClick={() => void deletePlace(place)}>Excluir</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h2>Avaliações de viajantes</h2>
              {!stats?.recent_reviews.length ? (
                <div className="business-empty-state">
                  <IconMessageCircle width={32} height={32} />
                  <h3>As avaliações aparecerão aqui</h3>
                  <p>Quando viajantes avaliarem seus locais, você poderá acompanhar as experiências compartilhadas.</p>
                </div>
              ) : stats.recent_reviews.map((review) => (
                <article className="business-review-card" key={review.id}>
                  <div><strong>{review.traveler_name}</strong><span>{review.establishment_name} · {new Date(review.created_at).toLocaleDateString('pt-BR')}</span></div>
                  <p aria-label={`Nota de experiência ${review.experience_rating} de 5`}>★ {review.experience_rating}/5 · Acessibilidade: {review.accessibility_level}</p>
                  <p>{review.comment_text || 'Sem comentário escrito.'}</p>
                  {review.accessibility_details && reviewAccessibilityQuestions.some((question) => review.accessibility_details?.[question.key]) && (
                    <div style={{marginTop: 12, padding: 14, borderRadius: 10, background: '#F0F9FA'}}>
                      <strong style={{display: 'block', marginBottom: 8, color: '#052659'}}>Detalhes de acessibilidade relatados</strong>
                      {reviewAccessibilityQuestions.map((question) => {
                        const answer = review.accessibility_details?.[question.key];
                        if (!answer) return null;
                        return <p key={question.key} style={{margin: '6px 0', color: '#475569', fontSize: 'calc(13px * var(--a11y-font-scale, 1))', lineHeight: 1.5}}>{question.label} — {reviewAccessibilityAnswerLabel(answer)}</p>;
                      })}
                    </div>
                  )}
                  {review.owner_reply_text && <blockquote>Sua resposta: {review.owner_reply_text}</blockquote>}
                </article>
              ))}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
