import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Header } from '../components/Header';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { IconRamp, IconBrain, IconLibras, IconBraille, IconMapPin, IconStar, IconHeart, IconMessageCircle } from '../components/Icons';
import type { Place } from '../types';

interface Review {
  id: number;
  traveler_name: string;
  traveler_avatar: string;
  experience_rating: number;
  accessibility_rating: number;
  comment_text: string;
  created_at: string;
}

export function PlaceDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ experience_rating: 5, accessibility_rating: 5, comment_text: '' });

  useEffect(() => {
    if (id) {
      api.get(`/places/${id}`)
        .then(res => setPlace(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));

      setReviews([
        { id: 1, traveler_name: "Ana Silva", traveler_avatar: "https://i.pravatar.cc/150?img=1", experience_rating: 5, accessibility_rating: 4, comment_text: "Local excelente! Tem rampa de acesso e banheiro adaptado. Recomendo muito.", created_at: "2026-10-15" },
        { id: 2, traveler_name: "Carlos Mendes", traveler_avatar: "https://i.pravatar.cc/150?img=3", experience_rating: 4, accessibility_rating: 5, comment_text: "Ótimo espaço para pessoas com TEA. Ambiente calmo e acolhedor.", created_at: "2026-10-10" }
      ]);
    }
  }, [id]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Faça login para avaliar');
    
    const review: Review = {
      id: Date.now(),
      traveler_name: user.full_name,
      traveler_avatar: "https://i.pravatar.cc/150?img=12",
      ...newReview,
      created_at: new Date().toISOString().split('T')[0]
    };
    setReviews([review, ...reviews]);
    setNewReview({ experience_rating: 5, accessibility_rating: 5, comment_text: '' });
    setShowReviewForm(false);
  };

  if (loading) return <div style={{padding: '100px', textAlign: 'center'}}>Carregando...</div>;
  if (!place) return <div style={{padding: '100px', textAlign: 'center'}}>Local não encontrado</div>;

  const accessItems = [
    { show: place.has_access_ramp, label: 'Rampa de acesso', icon: <IconRamp width={24} height={24} /> },
    { show: place.has_adapted_bathroom, label: 'Banheiro adaptado', icon: <IconRamp width={24} height={24} /> },
    { show: place.allows_guide_dog, label: 'Permite cão-guia', icon: <IconRamp width={24} height={24} /> },
    { show: place.has_braille_signage, label: 'Sinalização em Braille', icon: <IconBraille width={24} height={24} /> },
    { show: place.has_sign_language_interpreter, label: 'Intérprete de Libras', icon: <IconLibras width={24} height={24} /> },
    { show: place.has_asd_friendly_space, label: 'Espaço TEA', icon: <IconBrain width={24} height={24} /> },
  ].filter(x => x.show);

  const avgAccessibility = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.accessibility_rating, 0) / reviews.length).toFixed(1) : '0.0';

  return (
    <div style={{background: '#F8FAFC', minHeight: '100vh'}}>
      <Header />
      <div className="details-hero">
        <img src={place.main_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80'} alt={place.establishment_name} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)'}} />
        <div style={{position: 'absolute', bottom: '40px', left: '40px', color: 'white', maxWidth: '700px'}}>
          <h1 style={{fontSize: '48px', fontWeight: 800, marginBottom: '16px'}}>{place.establishment_name}</h1>
          <p style={{fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'}}>
            <IconMapPin width={20} height={20} /> {place.full_address || `${place.city}, ${place.state}`}
          </p>
          <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
            <button 
              onClick={() => isFavorite(place.id) ? removeFavorite(place.id) : addFavorite(place.id)}
              style={{background: isFavorite(place.id) ? '#EF4444' : 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: 'none', padding: '12px 24px', borderRadius: '100px', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}
            >
              <IconHeart width={20} height={20} fill={isFavorite(place.id) ? 'white' : 'none'} />
              {isFavorite(place.id) ? 'Salvo' : 'Salvar'}
            </button>
            <div style={{background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', padding: '12px 24px', borderRadius: '100px'}}>
              <span style={{fontWeight: 700}}>♿ {avgAccessibility}</span>
              <span style={{marginLeft: '8px', fontSize: '14px'}}>({reviews.length} avaliações)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="details-content">
        <div>
          <div className="details-card">
            <h2>Sobre o Local</h2>
            <p style={{lineHeight: '1.8', color: '#64748B', fontSize: '16px'}}>{place.description || 'Descrição não disponível.'}</p>
            <div style={{marginTop: '24px', fontSize: '32px', fontWeight: 800, color: '#052659'}}>
              {(!place.price || place.price === 0) ? 'Gratuito' : `R$ ${place.price}`}
            </div>
          </div>

          <div className="details-card">
            <h2>Recursos de Acessibilidade</h2>
            <div className="access-grid">
              {accessItems.map((item, i) => (
                <div key={i} className="access-item">
                  <div className="access-icon">{item.icon}</div>
                  <div className="access-text">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="details-card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
              <h2 style={{margin: 0}}><IconMessageCircle width={28} height={28} style={{marginRight: '8px', verticalAlign: 'middle'}} /> Avaliações ({reviews.length})</h2>
              <button onClick={() => setShowReviewForm(!showReviewForm)} style={{background: '#052659', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '100px', fontWeight: 600, cursor: 'pointer'}}>
                {showReviewForm ? 'Cancelar' : '+ Avaliar'}
              </button>
            </div>

            {showReviewForm && (
              <form onSubmit={handleSubmitReview} style={{background: '#F8FAFC', padding: '24px', borderRadius: '12px', marginBottom: '24px'}}>
                <h3 style={{marginBottom: '16px', color: '#052659'}}>Sua Avaliação</h3>
                <div style={{marginBottom: '16px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 600}}>Experiência Geral</label>
                  <div style={{display: 'flex', gap: '8px'}}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" onClick={() => setNewReview({...newReview, experience_rating: star})} style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '32px'}}>
                        <IconStar width={32} height={32} fill={star <= newReview.experience_rating ? '#F59E0B' : 'none'} stroke={star <= newReview.experience_rating ? '#F59E0B' : '#CBD5E1'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom: '16px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: 600}}>Nível de Acessibilidade</label>
                  <div style={{display: 'flex', gap: '8px'}}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" onClick={() => setNewReview({...newReview, accessibility_rating: star})} style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '32px'}}>
                        <IconStar width={32} height={32} fill={star <= newReview.accessibility_rating ? '#2AC2D2' : 'none'} stroke={star <= newReview.accessibility_rating ? '#2AC2D2' : '#CBD5E1'} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea value={newReview.comment_text} onChange={e => setNewReview({...newReview, comment_text: e.target.value})} placeholder="Conte sobre sua experiência..." required style={{width: '100%', padding: '12px', border: '2px solid #E2E8F0', borderRadius: '8px', minHeight: '100px', fontFamily: 'inherit', resize: 'vertical'}} />
                <button type="submit" style={{marginTop: '16px', background: '#052659', color: 'white', border: 'none', padding: '12px 32px', borderRadius: '100px', fontWeight: 600, cursor: 'pointer'}}>Publicar Avaliação</button>
              </form>
            )}

            <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
              {reviews.map(review => (
                <div key={review.id} style={{borderBottom: '1px solid #E2E8F0', paddingBottom: '24px'}}>
                  <div style={{display: 'flex', gap: '16px', marginBottom: '12px'}}>
                    <img src={review.traveler_avatar} alt={review.traveler_name} style={{width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover'}} />
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: 700, color: '#0F172A'}}>{review.traveler_name}</div>
                      <div style={{fontSize: '13px', color: '#64748B'}}>{review.created_at}</div>
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '16px', marginBottom: '12px'}}>
                    <div>
                      <span style={{fontSize: '12px', color: '#64748B'}}>Experiência: </span>
                      <div style={{display: 'flex', gap: '2px'}}>
                        {[...Array(5)].map((_, i) => <IconStar key={i} width={16} height={16} fill={i < review.experience_rating ? '#F59E0B' : 'none'} stroke={i < review.experience_rating ? '#F59E0B' : '#CBD5E1'} />)}
                      </div>
                    </div>
                    <div>
                      <span style={{fontSize: '12px', color: '#64748B'}}>Acessibilidade: </span>
                      <div style={{display: 'flex', gap: '2px'}}>
                        {[...Array(5)].map((_, i) => <IconStar key={i} width={16} height={16} fill={i < review.accessibility_rating ? '#2AC2D2' : 'none'} stroke={i < review.accessibility_rating ? '#2AC2D2' : '#CBD5E1'} />)}
                      </div>
                    </div>
                  </div>
                  <p style={{color: '#0F172A', lineHeight: '1.6'}}>{review.comment_text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="details-card">
            <h3 style={{fontFamily: 'Syne', fontSize: '20px', fontWeight: 700, color: '#052659', marginBottom: '12px'}}>Localização</h3>
            <p style={{color: '#64748B', marginBottom: '16px'}}>{place.full_address || `${place.city}, ${place.state}`}</p>
            <div style={{background: '#E2E8F0', height: '200px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B'}}>Mapa (Integrar Google Maps)</div>
          </div>
          <div className="details-card">
            <h3 style={{fontFamily: 'Syne', fontSize: '20px', fontWeight: 700, color: '#052659', marginBottom: '12px'}}>Categoria</h3>
            <span style={{background: '#F0F9FF', color: '#052659', padding: '8px 16px', borderRadius: '100px', fontWeight: 600, fontSize: '14px'}}>{place.category}</span>
          </div>
        </div>
      </div>
    </div>
  );
}