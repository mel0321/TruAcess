import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { IconStar, IconUsers, IconMapPin, IconEdit, IconTrash, IconMessageCircle, IconBell } from '../components/Icons';

interface DashboardStats { total_places: number; total_reviews: number; avg_rating: number; pending_replies: number; }
interface Review { id: number; place_name: string; traveler_name: string; experience_rating: number; accessibility_rating: number; comment_text: string; created_at: string; replied: boolean; }

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'places' | 'reviews'>('places');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStats({ total_places: 2, total_reviews: 15, avg_rating: 4.8, pending_replies: 1 });
    setPlaces([
      { id: 1, establishment_name: "Pousada Mar Azul", category: "Hotéis", city: "Florianópolis", state: "SC", price: 250 },
      { id: 2, establishment_name: "Museu da Acessibilidade", category: "Museus", city: "São Paulo", state: "SP", price: 0 },
    ]);
    setReviews([
      { id: 1, place_name: "Pousada Mar Azul", traveler_name: "Ana Silva", experience_rating: 5, accessibility_rating: 4, comment_text: "Local excelente! Tem rampa de acesso e banheiro adaptado.", created_at: "2026-10-15", replied: false },
      { id: 2, place_name: "Museu da Acessibilidade", traveler_name: "Carlos Mendes", experience_rating: 4, accessibility_rating: 5, comment_text: "Ótimo espaço para pessoas com TEA.", created_at: "2026-10-10", replied: true }
    ]);
    setLoading(false);
  }, []);

  if (loading) return <div style={{padding: '100px', textAlign: 'center'}}>Carregando painel...</div>;

  return (
    <div style={{background: '#F8FAFC', minHeight: '100vh'}}>
      <Header />
      <div className="container" style={{padding: '40px 24px', maxWidth: '1200px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
          <h1 style={{fontFamily: 'Poppins', fontSize: '32px', fontWeight: 800, color: '#052659'}}>Painel Administrativo</h1>
          <Link to="/register-place" className="btn-plan" style={{background: '#2AC2D2', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', color: 'white', fontWeight: 700}}>+ Novo Estabelecimento</Link>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px'}}>
          <div style={{background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(5, 38, 89, 0.05)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}><IconMapPin width={24} height={24} color="#052659" /><p style={{color: '#64748B', fontSize: '14px', margin: 0}}>Total de Locais</p></div>
            <p style={{fontSize: '36px', fontWeight: '800', color: '#052659', margin: 0}}>{stats?.total_places || 0}</p>
          </div>
          <div style={{background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(5, 38, 89, 0.05)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}><IconStar width={24} height={24} color="#F59E0B" /><p style={{color: '#64748B', fontSize: '14px', margin: 0}}>Nota Média</p></div>
            <p style={{fontSize: '36px', fontWeight: '800', color: '#052659', margin: 0}}>{stats?.avg_rating ? stats.avg_rating.toFixed(1) : '0.0'}</p>
          </div>
          <div style={{background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(5, 38, 89, 0.05)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}><IconUsers width={24} height={24} color="#2AC2D2" /><p style={{color: '#64748B', fontSize: '14px', margin: 0}}>Avaliações</p></div>
            <p style={{fontSize: '36px', fontWeight: '800', color: '#052659', margin: 0}}>{stats?.total_reviews || 0}</p>
          </div>
          <div style={{background: '#FEF3C7', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.1)'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}><IconBell width={24} height={24} color="#D97706" /><p style={{color: '#92400E', fontSize: '14px', margin: 0}}>Não Respondidas</p></div>
            <p style={{fontSize: '36px', fontWeight: '800', color: '#92400E', margin: 0}}>{stats?.pending_replies || 0}</p>
          </div>
        </div>

        <div style={{display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px'}}>
          <button onClick={() => setActiveTab('places')} style={{padding: '12px 24px', border: 'none', background: activeTab === 'places' ? '#052659' : 'transparent', color: activeTab === 'places' ? 'white' : '#64748B', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'}}><IconMapPin width={18} height={18} style={{marginRight: '8px', verticalAlign: 'middle'}} /> Meus Locais</button>
          <button onClick={() => setActiveTab('reviews')} style={{padding: '12px 24px', border: 'none', background: activeTab === 'reviews' ? '#052659' : 'transparent', color: activeTab === 'reviews' ? 'white' : '#64748B', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'}}><IconMessageCircle width={18} height={18} style={{marginRight: '8px', verticalAlign: 'middle'}} /> Avaliações Recebidas</button>
        </div>

        <div style={{background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(5, 38, 89, 0.05)', overflow: 'hidden', padding: '32px'}}>
          {activeTab === 'places' && (
            <div>
              <h2 style={{fontFamily: 'Poppins', fontSize: '20px', fontWeight: 700, color: '#052659', marginBottom: '24px'}}>Meus Estabelecimentos</h2>
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
                  <thead>
                    <tr style={{background: '#F8FAFC', borderBottom: '1px solid #E2E8F0'}}>
                      <th style={{padding: '16px 24px', fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase'}}>Nome</th>
                      <th style={{padding: '16px 24px', fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase'}}>Categoria</th>
                      <th style={{padding: '16px 24px', fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase'}}>Localização</th>
                      <th style={{padding: '16px 24px', fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase'}}>Status</th>
                      <th style={{padding: '16px 24px', fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase'}}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {places.map((place) => (
                      <tr key={place.id} style={{borderBottom: '1px solid #F1F5F9'}}>
                        <td style={{padding: '16px 24px', fontWeight: 600, color: '#0F172A'}}>{place.establishment_name}</td>
                        <td style={{padding: '16px 24px', color: '#64748B'}}>{place.category}</td>
                        <td style={{padding: '16px 24px', color: '#64748B'}}>{place.city}, {place.state}</td>
                        <td style={{padding: '16px 24px'}}>
                          <span style={{background: place.price && place.price > 0 ? '#DCFCE7' : '#E0F2FE', color: place.price && place.price > 0 ? '#16A34A' : '#0284C7', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700}}>
                            {place.price && place.price > 0 ? 'Pago' : 'Gratuito'}
                          </span>
                        </td>
                        <td style={{padding: '16px 24px', display: 'flex', gap: '12px'}}>
                          <button style={{background: 'transparent', border: 'none', cursor: 'pointer', color: '#052659'}}><IconEdit width={18} height={18} /></button>
                          <button style={{background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444'}}><IconTrash width={18} height={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h2 style={{fontFamily: 'Poppins', fontSize: '20px', fontWeight: 700, color: '#052659', marginBottom: '24px'}}>Avaliações Recebidas ({reviews.length})</h2>
              <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                {reviews.map(review => (
                  <div key={review.id} style={{padding: '24px', background: review.replied ? '#F8FAFC' : '#FEF3C7', borderRadius: '12px', border: `2px solid ${review.replied ? '#E2E8F0' : '#F59E0B'}`}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px'}}>
                      <div><strong style={{color: '#0F172A'}}>{review.traveler_name}</strong><span style={{marginLeft: '12px', fontSize: '13px', color: '#64748B'}}>em {review.place_name}</span></div>
                      <span style={{fontSize: '13px', color: '#64748B'}}>{review.created_at}</span>
                    </div>
                    <div style={{display: 'flex', gap: '16px', marginBottom: '12px'}}>
                      <div>
                        <span style={{fontSize: '12px', color: '#64748B'}}>Experiência: </span>
                        <div style={{display: 'flex', gap: '2px'}}>{[...Array(5)].map((_, i) => <IconStar key={i} width={16} height={16} fill={i < review.experience_rating ? '#F59E0B' : 'none'} stroke={i < review.experience_rating ? '#F59E0B' : '#CBD5E1'} />)}</div>
                      </div>
                      <div>
                        <span style={{fontSize: '12px', color: '#64748B'}}>Acessibilidade: </span>
                        <div style={{display: 'flex', gap: '2px'}}>{[...Array(5)].map((_, i) => <IconStar key={i} width={16} height={16} fill={i < review.accessibility_rating ? '#2AC2D2' : 'none'} stroke={i < review.accessibility_rating ? '#2AC2D2' : '#CBD5E1'} />)}</div>
                      </div>
                    </div>
                    <p style={{color: '#0F172A', lineHeight: '1.6', marginBottom: '16px'}}>{review.comment_text}</p>
                    {!review.replied ? (
                      <button style={{background: '#052659', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '100px', fontWeight: 600, cursor: 'pointer', fontSize: '14px'}}>Responder Avaliação</button>
                    ) : (
                      <span style={{color: '#16A34A', fontWeight: 600, fontSize: '14px'}}>✓ Respondido</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}