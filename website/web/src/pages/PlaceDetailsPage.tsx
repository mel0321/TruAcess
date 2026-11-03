import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Header } from '../components/Header';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { IconRamp, IconBrain, IconLibras, IconBraille, IconMapPin, IconStar, IconHeart, IconMessageCircle, IconArrowLeft, IconDog } from '../components/Icons';
import type { Place, Review } from '../types';

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
      review.accessibility_level === 'GOOD' ? 4 : 1
  );
  return { ...review, accessibility_rating: accessibilityRating };
}

const categoryLabels: Record<string, string> = {
  ACCOMMODATION: 'Hospedagem',
  GASTRONOMY: 'Gastronomia',
  TOURIST_ATTRACTION: 'Atração turística',
  OTHERS: 'Outro',
};

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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ experience_rating: 5, accessibility_rating: 5, comment_text: '' });
  const [hoveredExp, setHoveredExp] = useState(0);
  const [hoveredAcc, setHoveredAcc] = useState(0);
  const [submitting, setSubmitting] = useState(false);

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
    try {
      const response = await api.get<ReviewsResponse>(`/places/${id}/reviews`);
      setReviews(response.data.reviews.map(normalizeReview));
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      setReviewError('Não foi possível carregar as avaliações deste local.');
    }
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
        comment_text: newReview.comment_text
      });

      setReviews((current) => [normalizeReview(response.data.review), ...current]);
      setNewReview({ experience_rating: 5, accessibility_rating: 5, comment_text: '' });
      setShowReviewForm(false);
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

  const avgAccessibility = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.accessibility_rating, 0) / reviews.length).toFixed(1) : '0.0';

  return (
    <div style={{background: '#f8fafc', minHeight: '100vh'}}>
      <Header />

      <div style={{background: 'white', padding: '16px 0', borderBottom: '1px solid #E2E8F0'}}>
        <div className="container" style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <button onClick={() => navigate(-1)} style={{background: '#F1F5F9', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px', color: '#052659'}}
            onMouseOver={e => (e.currentTarget.style.background = '#E2E8F0')}
            onMouseOut={e => (e.currentTarget.style.background = '#F1F5F9')}>
            <IconArrowLeft width={18} height={18} /> Voltar
          </button>
          <div style={{color: '#64748B', fontSize: '14px'}}>
            <Link to="/" style={{color: '#64748B', textDecoration: 'none'}}>Início</Link>
            <span style={{margin: '0 8px'}}>/</span>
            <Link to="/destinos" style={{color: '#64748B', textDecoration: 'none'}}>Destinos</Link>
            <span style={{margin: '0 8px'}}>/</span>
            <span style={{color: '#052659', fontWeight: 600}}>{place.establishment_name}</span>
          </div>
        </div>
      </div>

      <div style={{position: 'relative', height: '450px', overflow: 'hidden'}}>
        <img src={place.main_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80'} alt={place.establishment_name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5, 38, 89, 0.85), rgba(5, 38, 89, 0.3))'}} />
        <div style={{position: 'absolute', bottom: '40px', left: '0', right: '0', color: 'white'}}>
          <div className="container">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px'}}>
              <div>
                <div style={{display: 'inline-block', background: '#2AC2D2', color: 'white', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{categoryLabels[place.category] || place.category}</div>
                <h1 style={{fontSize: '48px', fontWeight: 800, marginBottom: '12px', lineHeight: 1.1}}>{place.establishment_name}</h1>
                <p style={{fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9}}>
                  <IconMapPin width={18} height={18} /> {place.full_address || `${place.city}, ${place.state}`}
                </p>
              </div>
              <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                <button 
                  onClick={() => isFavorite(place.id) ? removeFavorite(place.id) : addFavorite(place.id)}
                  style={{background: isFavorite(place.id) ? '#EF4444' : 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 20px', borderRadius: '100px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'}}
                >
                  <IconHeart width={18} height={18} fill={isFavorite(place.id) ? 'white' : 'none'} />
                  {isFavorite(place.id) ? 'Salvo' : 'Salvar'}
                </button>
                <div style={{background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 20px', borderRadius: '100px'}}>
                  <span style={{fontWeight: 700, fontSize: '18px'}}>♿ {avgAccessibility}</span>
                  <span style={{marginLeft: '8px', fontSize: '13px', opacity: 0.9}}>({reviews.length} avaliações)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{maxWidth: '1200px', margin: '-40px auto 0', padding: '0 24px 80px', position: 'relative', zIndex: 2}}>
        <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px'}}>
          <div>
            <div style={{background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)', marginBottom: '24px'}}>
              <h2 style={{fontFamily: 'Poppins', fontSize: '28px', fontWeight: 800, color: '#052659', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                <span style={{width: '4px', height: '28px', background: '#2AC2D2', borderRadius: '2px', display: 'inline-block'}}></span>
                Sobre o Local
              </h2>
              <p style={{lineHeight: '1.8', color: '#64748B', fontSize: '16px', marginBottom: '24px'}}>{place.description || 'Descrição não disponível.'}</p>
              <div style={{display: 'flex', alignItems: 'baseline', gap: '8px'}}>
                <span style={{fontSize: '36px', fontWeight: 800, color: '#052659'}}>
                  {formatPrice(place.price)}
                </span>
                {place.price !== null && place.price > 0 && <span style={{fontSize: '14px', color: '#64748B'}}>/ pessoa</span>}
              </div>
            </div>

            {accessItems.length > 0 && (
              <div style={{background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)', marginBottom: '24px'}}>
                <h2 style={{fontFamily: 'Poppins', fontSize: '28px', fontWeight: 800, color: '#052659', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <span style={{width: '4px', height: '28px', background: '#2AC2D2', borderRadius: '2px', display: 'inline-block'}}></span>
                  Recursos de Acessibilidade
                </h2>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px'}}>
                  {accessItems.map((item, i) => (
                    <div key={i} style={{display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', borderRadius: '12px', border: '1px solid #BAE6FD'}}>
                      <div style={{width: '44px', height: '44px', background: '#2AC2D2', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0}}>
                        {item.icon}
                      </div>
                      <div style={{fontWeight: 600, color: '#052659', fontSize: '14px'}}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px'}}>
                <h2 style={{fontFamily: 'Poppins', fontSize: '28px', fontWeight: 800, color: '#052659', display: 'flex', alignItems: 'center', gap: '12px', margin: 0}}>
                  <span style={{width: '4px', height: '28px', background: '#2AC2D2', borderRadius: '2px', display: 'inline-block'}}></span>
                  <IconMessageCircle width={28} height={28} style={{color: '#2AC2D2'}} />
                  Avaliações ({reviews.length})
                </h2>
                <button onClick={() => {
                  if (!user) {
                    navigate('/login');
                    return;
                  }
                  setShowReviewForm(!showReviewForm);
                }} style={{background: showReviewForm ? '#E2E8F0' : '#052659', color: showReviewForm ? '#052659' : 'white', border: 'none', padding: '12px 24px', borderRadius: '100px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                  {showReviewForm ? '✕ Cancelar' : user ? '✚ Avaliar este local' : '✚ Entre para avaliar'}
                </button>
              </div>

              {reviewError && <p role="alert" style={{ color: '#991B1B', marginBottom: 16 }}>{reviewError}</p>}

              {showReviewForm && (
                <form onSubmit={handleSubmitReview} style={{background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', padding: '28px', borderRadius: '16px', marginBottom: '32px', border: '1px solid #E2E8F0'}}>
                  <h3 style={{fontFamily: 'Poppins', fontSize: '20px', fontWeight: 700, color: '#052659', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <IconStar width={22} height={22} fill="#2AC2D2" stroke="#2AC2D2" /> Sua Avaliação
                  </h3>
                  
                  <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '10px', fontWeight: 600, color: '#0F172A', fontSize: '14px'}}>Experiência Geral</label>
                    <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setNewReview({...newReview, experience_rating: star})} onMouseEnter={() => setHoveredExp(star)} onMouseLeave={() => setHoveredExp(0)} style={{background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'transform 0.2s', transform: (hoveredExp || newReview.experience_rating) >= star ? 'scale(1.15)' : 'scale(1)'}}>
                          <IconStar width={36} height={36} fill={(hoveredExp || newReview.experience_rating) >= star ? '#F59E0B' : 'none'} stroke={(hoveredExp || newReview.experience_rating) >= star ? '#F59E0B' : '#CBD5E1'} strokeWidth={2} />
                        </button>
                      ))}
                      <span style={{marginLeft: '12px', fontSize: '14px', color: '#64748B', fontWeight: 500}}>
                        {['', 'Péssima', 'Ruim', 'Regular', 'Boa', 'Excelente'][newReview.experience_rating]}
                      </span>
                    </div>
                  </div>

                  <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '10px', fontWeight: 600, color: '#0F172A', fontSize: '14px'}}>Nível de Acessibilidade</label>
                    <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setNewReview({...newReview, accessibility_rating: star})} onMouseEnter={() => setHoveredAcc(star)} onMouseLeave={() => setHoveredAcc(0)} style={{background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'transform 0.2s', transform: (hoveredAcc || newReview.accessibility_rating) >= star ? 'scale(1.15)' : 'scale(1)'}}>
                          <IconStar width={36} height={36} fill={(hoveredAcc || newReview.accessibility_rating) >= star ? '#2AC2D2' : 'none'} stroke={(hoveredAcc || newReview.accessibility_rating) >= star ? '#2AC2D2' : '#CBD5E1'} strokeWidth={2} />
                        </button>
                      ))}
                      <span style={{marginLeft: '12px', fontSize: '14px', color: '#64748B', fontWeight: 500}}>
                        {['', 'Inacessível', 'Difícil', 'Parcial', 'Bom', 'Excelente'][newReview.accessibility_rating]}
                      </span>
                    </div>
                  </div>

                  <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '10px', fontWeight: 600, color: '#0F172A', fontSize: '14px'}}>Seu Comentário</label>
                    <textarea value={newReview.comment_text} onChange={e => setNewReview({...newReview, comment_text: e.target.value})} placeholder="Conte sobre sua experiência neste local..." required style={{width: '100%', padding: '14px', border: '2px solid #E2E8F0', borderRadius: '10px', minHeight: '110px', fontFamily: 'inherit', resize: 'vertical', fontSize: '14px', outline: 'none', boxSizing: 'border-box'}} />
                  </div>

                  <button type="submit" disabled={submitting} style={{background: 'linear-gradient(135deg, #052659 0%, #0a3d7a 100%)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '100px', fontWeight: 700, cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(5, 38, 89, 0.2)', opacity: submitting ? 0.7 : 1}}>
                    <IconStar width={18} height={18} fill="white" stroke="white" /> {submitting ? 'Publicando...' : 'Publicar Avaliação'}
                  </button>
                </form>
              )}

              <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                {reviews.map(review => (
                  <div key={review.id} style={{padding: '24px', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0'}}>
                    <div style={{display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center'}}>
                      <img src={review.traveler_avatar || 'https://i.pravatar.cc/150?img=12'} alt={review.traveler_name} style={{width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #2AC2D2'}} />
                      <div style={{flex: 1}}>
                        <div style={{fontWeight: 700, color: '#0F172A', fontSize: '16px'}}>{review.traveler_name}</div>
                        <div style={{fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <span style={{width: '4px', height: '4px', background: '#64748B', borderRadius: '50%', display: 'inline-block'}}></span>
                          {review.created_at}
                        </div>
                      </div>
                      <div style={{display: 'flex', gap: '16px'}}>
                        <div style={{textAlign: 'center'}}>
                          <div style={{fontSize: '11px', color: '#64748B', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Experiência</div>
                          <div style={{display: 'flex', gap: '2px'}}>
                            {[...Array(5)].map((_, i) => <IconStar key={i} width={16} height={16} fill={i < review.experience_rating ? '#F59E0B' : 'none'} stroke={i < review.experience_rating ? '#F59E0B' : '#E2E8F0'} />)}
                          </div>
                        </div>
                        <div style={{textAlign: 'center'}}>
                          <div style={{fontSize: '11px', color: '#64748B', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>Acessibilidade</div>
                          <div style={{display: 'flex', gap: '2px'}}>
                            {[...Array(5)].map((_, i) => <IconStar key={i} width={16} height={16} fill={i < review.accessibility_rating ? '#2AC2D2' : 'none'} stroke={i < review.accessibility_rating ? '#2AC2D2' : '#E2E8F0'} />)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p style={{color: '#334155', lineHeight: '1.7', fontSize: '15px', margin: 0, paddingLeft: '68px'}}>{review.comment_text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{background: 'white', padding: '28px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)', marginBottom: '24px', position: 'sticky', top: '100px'}}>
              <h3 style={{fontFamily: 'Poppins', fontSize: '20px', fontWeight: 700, color: '#052659', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <IconMapPin width={22} height={22} style={{color: '#2AC2D2'}} /> Localização
              </h3>
              <p style={{color: '#64748B', marginBottom: '16px', fontSize: '14px', lineHeight: '1.6'}}>{place.full_address || `${place.city}, ${place.state}`}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.full_address || `${place.city}, ${place.state}`)}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Abrir ${place.establishment_name} no Google Maps`}
                style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', minHeight: 180, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#052659', border: '1px solid #BAE6FD', textDecoration: 'none' }}
              >
                <div style={{textAlign: 'center'}}>
                  <IconMapPin width={32} height={32} style={{color: '#2AC2D2', marginBottom: '8px'}} />
                  <p style={{fontSize: '13px', margin: 0, fontWeight: 600}}>Abrir no Google Maps</p>
                </div>
              </a>
            </div>

            <div style={{background: 'white', padding: '28px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'}}>
              <h3 style={{fontFamily: 'Poppins', fontSize: '20px', fontWeight: 700, color: '#052659', marginBottom: '16px'}}>Resumo</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9'}}>
                  <span style={{color: '#64748B', fontSize: '14px'}}>Categoria</span>
                  <span style={{fontWeight: 600, color: '#052659', fontSize: '14px'}}>{categoryLabels[place.category] || place.category}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9'}}>
                  <span style={{color: '#64748B', fontSize: '14px'}}>Preço</span>
                  <span style={{fontWeight: 700, color: '#052659', fontSize: '14px'}}>{formatPrice(place.price)}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9'}}>
                  <span style={{color: '#64748B', fontSize: '14px'}}>Avaliações</span>
                  <span style={{fontWeight: 600, color: '#052659', fontSize: '14px'}}>{reviews.length}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0'}}>
                  <span style={{color: '#64748B', fontSize: '14px'}}>Acessibilidade</span>
                  <span style={{fontWeight: 700, color: '#2AC2D2', fontSize: '14px'}}>♿ {avgAccessibility}/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}