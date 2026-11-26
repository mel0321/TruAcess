import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Header } from '../components/Header';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { IconRamp, IconBrain, IconLibras, IconBraille, IconMapPin, IconHeart, IconMessageCircle, IconDog, IconX, IconPlus } from '../components/Icons';
import { getPlaceCategoryLabel } from '../utils/placeCategories';
import { reviewAccessibilityAnswerLabel, reviewAccessibilityAnswerOptions, reviewAccessibilityQuestions } from '../utils/reviewQuestionnaire';
import type { Place, Review } from '../types';
import { getDistinctPlacePhotoUrls } from '../utils/placePhotos';

interface PlaceResponse {
  place: Place;
}

interface ReviewsResponse {
  reviews: Array<Omit<Review, 'accessibility_rating'> & {
    accessibility_rating?: number;
    accessibility_level?: 'POOR' | 'GOOD' | 'EXCELLENT';
  }>;
}

function normalizeReview(review: ReviewsResponse['reviews'][number]): Review {
  const accessibilityRating = review.accessibility_rating ?? (
    review.accessibility_level === 'EXCELLENT' ? 5 :
      review.accessibility_level === 'GOOD' ? 3 : 1
  );
  return { ...review, accessibility_rating: accessibilityRating };
}

function formatPrice(price: number | null): string {
  if (price === null || price === 0) return 'Gratuito';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price / 100);
}

export function PlaceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ experience_rating: 5, accessibility_rating: 5, comment_text: '', criteria_ratings: { atendimento: 5, limpeza: 5, estrutura: 5, custo_beneficio: 5, localizacao: 5, organizacao: 5, qualidade: 5 } as Record<string, number>, accessibility_details: {} as NonNullable<Review['accessibility_details']> });
  const [submitting, setSubmitting] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadPlace();
      loadReviews();
    }
  }, [id]);

  const loadPlace = async () => {
    try {
      const response = await api.get<PlaceResponse>(`/places/${id}`);
      setPlace(response.data.place);
    } catch (error) {
      console.error('Erro ao carregar local:', error);
      setLoadError('Não foi possível carregar os detalhes deste local.');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await api.get<ReviewsResponse>(`/places/${id}/reviews`);
      setReviews(response.data.reviews.map(normalizeReview));
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      setReviewError('Não foi possível carregar as avaliações deste local.');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReviewClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.user_type !== 'TRAVELER') {
      setReviewError('Somente contas de viajante podem avaliar locais.');
      return;
    }
    setReviewError('');
    setShowReviewForm((current) => !current);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.user_type !== 'TRAVELER') {
      setReviewError('Somente contas de viajante podem avaliar locais.');
      return;
    }
    
    setSubmitting(true);
    setReviewError('');
    try {
      const response = await api.post<{ review: ReviewsResponse['reviews'][number] }>(`/places/${id}/reviews`, {
        experience_rating: newReview.experience_rating,
        accessibility_level: newReview.accessibility_rating >= 5
          ? 'EXCELLENT'
          : newReview.accessibility_rating >= 3 ? 'GOOD' : 'POOR',
        comment_text: newReview.comment_text,
        accessibility_details: newReview.accessibility_details,
        criteria_ratings: newReview.criteria_ratings,
      });

      setReviews((current) => [normalizeReview(response.data.review), ...current]);
      setNewReview({ experience_rating: 5, accessibility_rating: 5, comment_text: '', criteria_ratings: { atendimento: 5, limpeza: 5, estrutura: 5, custo_beneficio: 5, localizacao: 5, organizacao: 5, qualidade: 5 }, accessibility_details: {} });
      setShowReviewForm(false);
      void loadPlace();
    } catch (error) {
      console.error('Erro ao publicar avaliação:', error);
      setReviewError('Não foi possível publicar sua avaliação. Entre na sua conta de viajante e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{padding: '100px', textAlign: 'center'}}>Carregando...</div>;
  if (!place) return (
    <div style={{ minHeight: '100vh', textAlign: 'center', padding: 48 }}>
      <Header />
      <p role="alert" style={{ margin: '48px 0 20px', color: '#991B1B' }}>{loadError || 'Local não encontrado.'}</p>
      <Link to="/destinos">Voltar para destinos</Link>
    </div>
  );

  const accessItems = [
    { show: place.has_access_ramp, label: 'Rampa de acesso', icon: <IconRamp width={24} height={24} /> },
    { show: place.has_adapted_bathroom, label: 'Banheiro adaptado', icon: <IconRamp width={24} height={24} /> },
    { show: place.allows_guide_dog, label: 'Permite cão-guia', icon: <IconDog width={24} height={24} /> },
    { show: place.has_braille_signage, label: 'Sinalização em Braille', icon: <IconBraille width={24} height={24} /> },
    { show: place.has_sign_language_interpreter, label: 'Intérprete de Libras', icon: <IconLibras width={24} height={24} /> },
    { show: place.has_asd_friendly_space, label: 'Espaço TEA-friendly', icon: <IconBrain width={24} height={24} /> },
  ].filter(x => x.show);
  const accessibilityPhotos = (place.photos || []).filter((photo) => photo.photo_type === 'ACCESSIBILITY');
  const displayedPlacePhotos = getDistinctPlacePhotoUrls(place);
  const evidenceLabels: Record<string, string> = {
    ACCESS_ROUTE: 'Rota acessível',
    RAMP: 'Rampa',
    ENTRANCE: 'Entrada',
    ADAPTED_BATHROOM: 'Banheiro adaptado',
    PARKING: 'Vaga acessível',
    BRAILLE: 'Braille',
    SIGN_LANGUAGE: 'Libras',
    GUIDE_DOG: 'Cão-guia',
    SENSORY_SPACE: 'Espaço sensorial',
    OTHER: 'Outro recurso',
  };

  const avgAccessibility = place.accessibility_score === null || place.accessibility_score === undefined
    ? '—'
    : `${place.accessibility_score}%`;
  const accessibilityLevelLabel = place.accessibility_level === 'INITIAL'
    ? 'Inicial'
    : place.accessibility_level === 'INTERMEDIATE'
      ? 'Intermediário'
      : place.accessibility_level === 'ADVANCED'
        ? 'Avançado'
        : 'Sem dados';

  const handleFavoriteToggle = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isFavorite(place.id)) {
      removeFavorite(place.id);
      return;
    }

    addFavorite(place.id);
  };

  return (
    <div style={{background: '#f8fafc', minHeight: '100vh'}}>
      <Header />

      <div style={{background: 'white', padding: '16px 0', borderBottom: '1px solid #E2E8F0'}}>
        <div className="container" style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <button onClick={() => navigate(-1)} style={{background: '#F1F5F9', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: 'calc(14px * var(--a11y-font-scale, 1))', color: '#052659'}}
            onMouseOver={e => (e.currentTarget.style.background = '#E2E8F0')}
            onMouseOut={e => (e.currentTarget.style.background = '#F1F5F9')}>
            Voltar
          </button>
          <div style={{color: '#64748B', fontSize: 'calc(14px * var(--a11y-font-scale, 1))'}}>
            <Link to="/" style={{color: '#64748B', textDecoration: 'none'}}>Início</Link>
            <span style={{margin: '0 8px'}}>/</span>
            <Link to="/destinos" style={{color: '#64748B', textDecoration: 'none'}}>Destinos</Link>
            <span style={{margin: '0 8px'}}>/</span>
            <span style={{color: '#052659', fontWeight: 600}}>{place.establishment_name}</span>
          </div>
        </div>
      </div>

      <div className="place-details-hero" style={{position: 'relative', height: '450px', overflow: 'hidden'}}>
        {place.main_image?.trim()
          ? <img src={place.main_image} alt={place.establishment_name} style={{width: '100%', height: '100%', objectFit: 'cover'}} onError={(event) => event.currentTarget.remove()} />
          : <div className="place-hero-no-image">Fotos deste local</div>}
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5, 38, 89, 0.85), rgba(5, 38, 89, 0.3))'}} />
        <div style={{position: 'absolute', bottom: '40px', left: '0', right: '0', color: 'white'}}>
          <div className="container">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px'}}>
              <div>
                <div style={{display: 'inline-block', background: '#2AC2D2', color: 'white', padding: '4px 12px', borderRadius: '100px', fontSize: 'calc(12px * var(--a11y-font-scale, 1))', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{getPlaceCategoryLabel(place.category)}</div>
                <h1 style={{fontSize: 'calc(48px * var(--a11y-font-scale, 1))', fontWeight: 800, marginBottom: '12px', lineHeight: 1.1}}>{place.establishment_name}</h1>
                <p style={{fontSize: 'calc(16px * var(--a11y-font-scale, 1))', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9}}>
                  <IconMapPin width={18} height={18} /> {place.full_address || [place.district, place.city, place.state, place.country].filter(Boolean).join(', ')}
                </p>
              </div>
              <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                <button 
                  onClick={handleFavoriteToggle}
                  style={{background: isFavorite(place.id) ? '#EF4444' : 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 20px', borderRadius: '100px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'calc(14px * var(--a11y-font-scale, 1))'}}
                >
                  <IconHeart width={18} height={18} fill={isFavorite(place.id) ? 'white' : 'none'} />
                  {isFavorite(place.id) ? 'Salvo' : 'Salvar'}
                </button>
                <div style={{background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 20px', borderRadius: '100px'}}>
                  <span style={{fontWeight: 700, fontSize: 'calc(18px * var(--a11y-font-scale, 1))', display: 'inline-flex', alignItems: 'center', gap: 6}}><IconRamp width={20} height={20} /> {avgAccessibility}</span>
                  <span style={{marginLeft: '8px', fontSize: 'calc(13px * var(--a11y-font-scale, 1))', opacity: 0.9}}>{accessibilityLevelLabel} · {place.stats?.total_reviews || 0} avaliações</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{margin: '-40px auto 0', paddingBottom: 80, position: 'relative', zIndex: 2}}>
        <div className="place-details-layout">
          <div>
            <div style={{background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)', marginBottom: '24px'}}>
              <h2 style={{fontFamily: 'Poppins', fontSize: 'calc(28px * var(--a11y-font-scale, 1))', fontWeight: 800, color: '#052659', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                <span style={{width: '4px', height: '28px', background: '#2AC2D2', borderRadius: '2px', display: 'inline-block'}}></span>
                Sobre o Local
              </h2>
              <p style={{lineHeight: '1.8', color: '#64748B', fontSize: 'calc(16px * var(--a11y-font-scale, 1))', marginBottom: '24px'}}>{place.description || 'Descrição não disponível.'}</p>
              <div className="place-contact-grid">
                {place.category_detail && <span><strong>Tipo:</strong> {place.category_detail.replaceAll('_', ' ')}</span>}
                {place.phone && <span><strong>Telefone:</strong> {place.phone}</span>}
                {place.website && <span><strong>Site:</strong> <a href={place.website} target="_blank" rel="noreferrer">{place.website}</a></span>}
                {place.opening_hours && <span><strong>Funcionamento:</strong> {place.opening_hours}</span>}
              </div>
              <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px'}}>
                <span style={{fontSize: 'calc(36px * var(--a11y-font-scale, 1))', fontWeight: 800, color: '#052659'}}>
                  {formatPrice(place.price)}
                </span>
                {place.price !== null && place.price > 0 && <span style={{fontSize: 'calc(14px * var(--a11y-font-scale, 1))', color: '#64748B'}}>/ pessoa</span>}
              </div>
            </div>

              <div style={{background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)', marginBottom: '24px'}}>
                <h2 style={{fontFamily: 'Poppins', fontSize: 'calc(28px * var(--a11y-font-scale, 1))', fontWeight: 800, color: '#052659', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <span style={{width: '4px', height: '28px', background: '#2AC2D2', borderRadius: '2px', display: 'inline-block'}}></span>
                  Recursos de Acessibilidade
                </h2>
                <div className="place-accessibility-score">
                  <strong>Questionário do estabelecimento: {place.questionnaire_score == null ? 'sem respostas suficientes' : `${place.questionnaire_score}%`}</strong>
                  {place.questionnaire_score != null && <progress max={100} value={place.questionnaire_score} aria-label="Pontuação do questionário do estabelecimento" />}
                  <p>Pontuação autodeclarada, calculada a partir das respostas “sim” e “não”. Não é uma certificação. O nível geral também considera as avaliações dos viajantes, quando disponíveis.</p>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px'}}>
                  {accessItems.map((item, i) => (
                    <div key={i} style={{display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', borderRadius: '12px', border: '1px solid #BAE6FD'}}>
                      <div style={{width: '44px', height: '44px', background: '#2AC2D2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0}}>
                        {item.icon}
                      </div>
                      <div style={{fontWeight: 600, color: '#052659', fontSize: 'calc(14px * var(--a11y-font-scale, 1))'}}>{item.label}</div>
                    </div>
                  ))}
                </div>
                  <div style={{ marginTop: 24 }}>
                    <h3 style={{ color: '#052659', marginBottom: 14 }}>Fotos de acessibilidade <span style={{ fontSize: 'calc(13px * var(--a11y-font-scale, 1))', fontWeight: 500, color: '#64748B' }}>— evidências enviadas pelo estabelecimento</span></h3>
                    {accessibilityPhotos.length === 0 && <p>Este estabelecimento ainda não enviou fotos de acessibilidade.</p>}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
                      {accessibilityPhotos.map((photo) => (
                        <figure key={photo.id} style={{ margin: 0, border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                          <img src={photo.photo_url} alt={`Evidência de ${evidenceLabels[photo.accessibility_category || ''] || 'acessibilidade'}`} style={{ width: '100%', height: 150, objectFit: 'cover' }} />
                          <figcaption style={{ padding: 10, fontSize: 'calc(13px * var(--a11y-font-scale, 1))', fontWeight: 600, color: '#052659' }}>{evidenceLabels[photo.accessibility_category || ''] || 'Acessibilidade'}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>
              </div>

            {displayedPlacePhotos.length > 0 && (
              <section className="place-gallery" style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)', marginBottom: 24 }}>
                <h2 style={{ color: '#052659', marginBottom: 18 }}>Fotos do local</h2>
                <div className="place-gallery-main">
                  <button type="button" aria-label="Foto anterior" onClick={() => setGalleryIndex((galleryIndex - 1 + displayedPlacePhotos.length) % displayedPlacePhotos.length)}>‹</button>
                  <img src={displayedPlacePhotos[galleryIndex % displayedPlacePhotos.length]} alt={`Foto ${galleryIndex + 1} de ${place.establishment_name}`} onError={(event) => { event.currentTarget.remove(); }} />
                  <button type="button" aria-label="Próxima foto" onClick={() => setGalleryIndex((galleryIndex + 1) % displayedPlacePhotos.length)}>›</button>
                </div>
                <div className="place-gallery-thumbs">
                  {displayedPlacePhotos.map((photoUrl, index) => (
                    <button type="button" key={photoUrl} className={galleryIndex === index ? 'is-active' : ''} onClick={() => setGalleryIndex(index)} aria-label={`Mostrar foto ${index + 1}`}>
                      <img src={photoUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.parentElement?.remove(); }} />
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div style={{background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px'}}>
                <h2 style={{fontFamily: 'Poppins', fontSize: 'calc(28px * var(--a11y-font-scale, 1))', fontWeight: 800, color: '#052659', display: 'flex', alignItems: 'center', gap: '12px', margin: 0}}>
                  <span style={{width: '4px', height: '28px', background: '#2AC2D2', borderRadius: '2px', display: 'inline-block'}}></span>
                  <IconMessageCircle width={28} height={28} style={{color: '#2AC2D2'}} />
                  Avaliações ({reviews.length})
                </h2>
                <button onClick={handleReviewClick} style={{background: showReviewForm ? '#E2E8F0' : '#052659', color: showReviewForm ? '#052659' : 'white', border: 'none', padding: '12px 24px', borderRadius: '100px', fontWeight: 600, cursor: 'pointer', fontSize: 'calc(14px * var(--a11y-font-scale, 1))', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  {showReviewForm ? <><IconX width={16} height={16} /> Cancelar</> : <><IconPlus width={16} height={16} /> {user ? 'Avaliar este local' : 'Entre para avaliar'}</>}
                </button>
              </div>

              {reviewError && <p role="alert" style={{ color: '#991B1B', marginBottom: 16 }}>{reviewError}</p>}

              {showReviewForm && (
                <form onSubmit={handleSubmitReview} style={{background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', padding: '28px', borderRadius: '16px', marginBottom: '32px', border: '1px solid #E2E8F0'}}>
                  <h3 style={{fontFamily:'Poppins',fontSize:'calc(20px * var(--a11y-font-scale, 1))',fontWeight:700,color:'#052659',marginBottom:'24px'}}>Sua avaliação por critérios</h3>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'12px',marginBottom:'24px'}}>
                    {Object.entries(newReview.criteria_ratings).map(([criterion, value]) => (
                      <label key={criterion} style={{display:'grid',gap:'7px',padding:'12px',border:'1px solid #dbe5ed',borderRadius:'10px',background:'white',color:'#334155',fontSize:'calc(13px * var(--a11y-font-scale, 1))',fontWeight:700,textTransform:'capitalize'}}>
                        {criterion.replaceAll('_',' ')} <span style={{color:'#087f8c'}}>{value}/5</span>
                        <input type="range" min="1" max="5" step="1" value={value} onChange={(event) => setNewReview((current) => ({...current, criteria_ratings:{...current.criteria_ratings,[criterion]:Number(event.target.value)}}))} />
                      </label>
                    ))}
                  </div>
                  <div style={{marginBottom:'20px',padding:'14px',borderRadius:'10px',background:'#eafafa'}}>
                    <strong style={{color:'#052659'}}>Experiência geral:</strong> {newReview.criteria_ratings.qualidade}/5
                    {' · '}<strong>Acessibilidade:</strong> {newReview.criteria_ratings.estrutura}/5
                  </div>

                  <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '6px', fontWeight: 600, color: '#0F172A', fontSize: 'calc(14px * var(--a11y-font-scale, 1))'}}>Acessibilidade na prática</label>
                    <p style={{margin: '0 0 12px', color: '#64748B', fontSize: 'calc(13px * var(--a11y-font-scale, 1))', lineHeight: 1.5}}>Este questionário é diferente da autodeclaração do estabelecimento: avalie somente o que você vivenciou nesta visita. Se não souber ou não se aplicar, deixe sem resposta.</p>
                    {reviewAccessibilityQuestions.map((question) => (
                      <fieldset key={question.key} style={{border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, margin: '0 0 10px'}}>
                        <legend style={{padding: '0 5px', color: '#334155', fontSize: 'calc(13px * var(--a11y-font-scale, 1))', fontWeight: 600}}>{question.label}</legend>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                          {reviewAccessibilityAnswerOptions.map((option) => (
                            <label key={option.value} style={{display: 'inline-flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: 'calc(13px * var(--a11y-font-scale, 1))'}}>
                              <input
                                type="radio"
                                name={`review-${question.key}`}
                                checked={newReview.accessibility_details[question.key] === option.value}
                                onChange={() => setNewReview((current) => ({
                                  ...current,
                                  accessibility_details: { ...current.accessibility_details, [question.key]: option.value },
                                }))}
                              />
                              {option.label}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                  </div>

                  <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '10px', fontWeight: 600, color: '#0F172A', fontSize: 'calc(14px * var(--a11y-font-scale, 1))'}}>Seu Comentário</label>
                    <textarea value={newReview.comment_text} onChange={e => setNewReview({...newReview, comment_text: e.target.value})} placeholder="Conte sobre sua experiência neste local..." required style={{width: '100%', padding: '14px', border: '2px solid #E2E8F0', borderRadius: '10px', minHeight: '110px', fontFamily: 'inherit', resize: 'vertical', fontSize: 'calc(14px * var(--a11y-font-scale, 1))', outline: 'none', boxSizing: 'border-box'}} />
                  </div>

                  <button type="submit" disabled={submitting} style={{background: 'linear-gradient(135deg, #052659 0%, #0a3d7a 100%)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '100px', fontWeight: 700, cursor: 'pointer', fontSize: 'calc(15px * var(--a11y-font-scale, 1))', boxShadow: '0 4px 15px rgba(5, 38, 89, 0.2)', opacity: submitting ? 0.7 : 1}}>
                    {submitting ? 'Publicando...' : 'Publicar Avaliação'}
                  </button>
                </form>
              )}

              {reviewsLoading ? (
                <p role="status" style={{ margin: 0, padding: '24px 12px', textAlign: 'center', color: '#64748B', fontSize: 'calc(14px * var(--a11y-font-scale, 1))' }}>
                  Carregando avaliações...
                </p>
              ) : reviews.length === 0 && !reviewError ? (
                <div style={{ display: 'grid', justifyItems: 'center', gap: 12, padding: '32px 20px', textAlign: 'center', background: 'linear-gradient(135deg, #F8FAFC 0%, #F0F9FA 100%)', border: '1px dashed #B8DDE2', borderRadius: 14 }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: 52, height: 52, borderRadius: '50%', color: '#087F8C', background: '#DDF5F5' }}>
                    <IconMessageCircle width={25} height={25} />
                  </span>
                  <div>
                    <h3 style={{ margin: '0 0 6px', color: '#052659', fontSize: 'calc(18px * var(--a11y-font-scale, 1))', fontWeight: 700 }}>
                      Este local ainda não tem avaliações
                    </h3>
                    <p style={{ maxWidth: 420, margin: 0, color: '#64748B', fontSize: 'calc(14px * var(--a11y-font-scale, 1))', lineHeight: 1.6 }}>
                      Sua experiência pode ajudar outras pessoas a planejar uma visita mais acessível.
                    </p>
                  </div>
                  <button type="button" onClick={handleReviewClick} style={{ marginTop: 4, padding: '11px 18px', border: 'none', borderRadius: 999, background: '#052659', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                    {user ? 'Escrever a primeira avaliação' : 'Entre para avaliar'}
                  </button>
                </div>
              ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                {reviews.map(review => (
                  <div key={review.id} style={{padding: '24px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0'}}>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px', alignItems: 'center'}}>
                      <img src={review.traveler_avatar || 'https://i.pravatar.cc/150?img=12'} alt={review.traveler_name} style={{width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #2AC2D2'}} />
                      <div style={{flex: 1}}>
                        <div style={{fontWeight: 700, color: '#0F172A', fontSize: 'calc(16px * var(--a11y-font-scale, 1))'}}>{review.traveler_name}</div>
                        <div style={{fontSize: 'calc(13px * var(--a11y-font-scale, 1))', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <span style={{width: '4px', height: '4px', background: '#64748B', borderRadius: '50%', display: 'inline-block'}}></span>
                          {review.created_at}
                        </div>
                      </div>
                      <div style={{display:'grid',gap:'6px',minWidth:'180px'}}>
                        <strong style={{color:'#052659',fontSize:'calc(14px * var(--a11y-font-scale, 1))'}}>Experiência: {review.experience_rating}/5</strong>
                        <progress max="5" value={review.experience_rating} aria-label="Nota de experiência" />
                        <strong style={{color:'#087f8c',fontSize:'calc(14px * var(--a11y-font-scale, 1))'}}>Acessibilidade: {review.accessibility_rating}/5</strong>
                        <progress max="5" value={review.accessibility_rating} aria-label="Nota de acessibilidade" />
                      </div>
                    </div>
                    {review.comment_text && <p style={{color: '#334155', lineHeight: '1.7', fontSize: 'calc(15px * var(--a11y-font-scale, 1))', margin: 0, paddingLeft: '68px'}}>{review.comment_text}</p>}
                    {review.accessibility_details && reviewAccessibilityQuestions.some((question) => review.accessibility_details?.[question.key]) && (
                      <div style={{marginTop: 16, padding: 16, borderRadius: 10, background: '#F0F9FA'}}>
                        <strong style={{display: 'block', color: '#052659', marginBottom: 8, fontSize: 'calc(14px * var(--a11y-font-scale, 1))'}}>Acessibilidade na prática</strong>
                        {reviewAccessibilityQuestions.map((question) => {
                          const answer = review.accessibility_details?.[question.key];
                          if (!answer) return null;
                          return <p key={question.key} style={{margin: '6px 0', color: '#475569', fontSize: 'calc(13px * var(--a11y-font-scale, 1))', lineHeight: 1.5}}>{question.label} — {reviewAccessibilityAnswerLabel(answer)}</p>;
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>

          <div>
            <div style={{background: 'white', padding: '28px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)', marginBottom: '24px', position: 'sticky', top: '100px'}}>
              <h3 style={{fontFamily: 'Poppins', fontSize: 'calc(20px * var(--a11y-font-scale, 1))', fontWeight: 700, color: '#052659', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <IconMapPin width={22} height={22} style={{color: '#2AC2D2'}} /> Localização
              </h3>
              <p style={{color: '#64748B', marginBottom: '16px', fontSize: 'calc(14px * var(--a11y-font-scale, 1))', lineHeight: '1.6'}}>{place.full_address || `${place.city}, ${place.state}`}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.full_address || `${place.city}, ${place.state}`)}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Abrir ${place.establishment_name} no Google Maps`}
                style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', minHeight: 180, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#052659', border: '1px solid #BAE6FD', textDecoration: 'none' }}
              >
                <div style={{textAlign: 'center'}}>
                  <IconMapPin width={32} height={32} style={{color: '#2AC2D2', marginBottom: '8px'}} />
                  <p style={{fontSize: 'calc(13px * var(--a11y-font-scale, 1))', margin: 0, fontWeight: 600}}>Abrir no Google Maps</p>
                </div>
              </a>
            </div>

            <div style={{background: 'white', padding: '28px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'}}>
              <h3 style={{fontFamily: 'Poppins', fontSize: 'calc(20px * var(--a11y-font-scale, 1))', fontWeight: 700, color: '#052659', marginBottom: '16px'}}>Resumo</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9'}}>
                  <span style={{color: '#64748B', fontSize: 'calc(14px * var(--a11y-font-scale, 1))'}}>Categoria</span>
                  <span style={{fontWeight: 600, color: '#052659', fontSize: 'calc(14px * var(--a11y-font-scale, 1))'}}>{getPlaceCategoryLabel(place.category)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9'}}>
                  <span style={{color: '#64748B', fontSize: 'calc(14px * var(--a11y-font-scale, 1))'}}>Preço</span>
                  <span style={{fontWeight: 700, color: '#052659', fontSize: 'calc(14px * var(--a11y-font-scale, 1))'}}>{formatPrice(place.price)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9'}}>
                  <span style={{color: '#64748B', fontSize: 'calc(14px * var(--a11y-font-scale, 1))'}}>Avaliações</span>
                  <span style={{fontWeight: 600, color: '#052659', fontSize: 'calc(14px * var(--a11y-font-scale, 1))'}}>{reviews.length}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0'}}>
                  <span style={{color: '#64748B', fontSize: 'calc(14px * var(--a11y-font-scale, 1))'}}>Acessibilidade</span>
                  <span style={{fontWeight: 700, color: '#2AC2D2', fontSize: 'calc(14px * var(--a11y-font-scale, 1))', display: 'inline-flex', alignItems: 'center', gap: 4}}><IconRamp width={16} height={16} /> {avgAccessibility}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}