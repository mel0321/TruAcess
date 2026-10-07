import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Header } from '../components/Header';
import type { Place, Review } from '../types';

export function PlaceDetailsPage() {
  const { id } = useParams();
  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    api.get(`/places/${id}`)
      .then(res => {
        setPlace(res.data);
        setReviews(res.data.reviews || []);
      })
      .catch(err => console.error(err));
  }, [id]);

  if (!place) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#C1E8FF' }}>
      <Header />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', width: '100%' }}>
        <Link to="/" style={{ marginBottom: '20px', display: 'inline-block', color: '#052659' }}>← Voltar</Link>

        <img src={place.main_image || undefined} alt={place.establishment_name} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '12px', marginBottom: '20px' }} />

        <h1 style={{ color: '#052659' }}>{place.establishment_name}</h1>
        <p style={{ color: '#5483B3', fontSize: '18px', marginBottom: '20px' }}>📍 {place.full_address}</p>
        <p style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '30px' }}>{place.description}</p>

        <h3 style={{ color: '#021024', marginBottom: '15px' }}>Recursos de Acessibilidade</h3>
        <ul style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '40px' }}>
          {place.has_access_ramp && <li>♿ Rampa de acesso</li>}
          {place.has_adapted_bathroom && <li>🚿 Banheiro adaptado</li>}
          {place.allows_guide_dog && <li>🐕 Permite cão-guia</li>}
          {place.has_braille_signage && <li>⠿ Sinalização em Braille</li>}
          {place.has_sign_language_interpreter && <li>🤟 Intérprete de Libras</li>}
          {place.has_asd_friendly_space && <li> Espaço TEA</li>}
        </ul>

        <h3 style={{ color: '#021024', marginBottom: '15px' }}>Avaliações ({reviews.length})</h3>
        {reviews.length === 0 ? <p>Nenhuma avaliação ainda.</p> : reviews.map(review => (
          <div key={review.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <strong>Nota: {review.experience_rating}/5</strong>
              <span style={{ backgroundColor: '#C1E8FF', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{review.accessibility_level}</span>
            </div>
            <p>{review.comment_text}</p>
            {review.owner_reply_text && (
              <div style={{ backgroundColor: '#C1E8FF', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #2AC2D2', marginTop: '10px' }}>
                <strong style={{ color: '#052659' }}>Resposta do estabelecimento:</strong>
                <p style={{ marginTop: '5px' }}>{review.owner_reply_text}</p>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}