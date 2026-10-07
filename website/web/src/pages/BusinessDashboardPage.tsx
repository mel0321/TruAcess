import { useEffect, useState } from 'react';
import api from '../services/api';
import { Header } from '../components/Header';
interface Stats {
  total_places: number;
  total_reviews: number;
  avg_rating: number;
  pending_replies: number;
}


export function BusinessDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [places, setPlaces] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api.get('/business/stats'), api.get('/business/places')])
      .then(([statsRes, placesRes]) => {
        setStats(statsRes.data);
        setPlaces(placesRes.data.places || placesRes.data);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#C1E8FF' }}>
      <Header />
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', width: '100%' }}>
        <h1 style={{ color: '#052659', marginBottom: '30px' }}>Dashboard da Empresa</h1>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#5483B3', fontSize: '14px' }}>Nota Média</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#052659' }}>{stats.avg_rating?.toFixed(1) || '0.0'}</p>
            </div>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#5483B3', fontSize: '14px' }}>Total de Avaliações</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#052659' }}>{stats.total_reviews}</p>
            </div>
            <div style={{ backgroundColor: stats.pending_replies > 0 ? '#ffebee' : 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: stats.pending_replies > 0 ? '#c62828' : '#5483B3', fontSize: '14px' }}>Respostas Pendentes</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: stats.pending_replies > 0 ? '#c62828' : '#052659' }}>{stats.pending_replies}</p>
            </div>
          </div>
        )}

        <h2 style={{ color: '#021024', marginBottom: '20px' }}>Meus Estabelecimentos</h2>
        <div style={{ display: 'grid', gap: '15px' }}>
          {places.map(place => (
            <div key={place.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div>
                <h3 style={{ color: '#052659' }}>{place.establishment_name}</h3>
                <p style={{ color: '#5483B3', fontSize: '14px' }}>{place.city} - {place.state}</p>
              </div>
              <span style={{ backgroundColor: '#C1E8FF', color: '#052659', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                {place.total_reviews || 0} avaliações
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}