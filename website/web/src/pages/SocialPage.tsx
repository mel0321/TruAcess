import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { Place } from '../types';

export function SocialPage() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    void api.get<{ places: Place[] }>('/places', { params: { limit: 500 } })
      .then(({ data }) => setPlaces(data.places))
      .catch(() => setPlaces([]));
  }, []);

  const accounts = [
    { name: 'Viajar com Acessibilidade', handle: '@viajaracessivel', initials: 'VA', tone: '#087F8C' },
    { name: 'Gabriel Turista', handle: '@gabrielrota', initials: 'GT', tone: '#052659' },
    { name: 'MASP Oficial', handle: '@masp', initials: 'M', tone: '#C53B3B' },
    { name: 'Pousadas Inclusivas', handle: '@pousadasin', initials: 'PI', tone: '#0F766E' },
  ];

  const photos = places.flatMap((place) => (place.photos || []).map((photo) => ({ ...photo, place })));

  const toggleFollow = (handle: string) => setFollowing((current) =>
    current.includes(handle) ? current.filter((item) => item !== handle) : [...current, handle]
  );

  return (
    <div className="social-page">
      <Header />
      <main className="social-shell">
        <section className="social-profile">
          <div className="social-avatar">{user?.full_name?.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'TU'}</div>
          <div className="social-profile-copy">
            <p className="social-eyebrow">{user?.user_type === 'BUSINESS' ? 'PERFIL DO ESTABELECIMENTO' : 'COMUNIDADE TRUACESS'}</p>
            <h1>{user?.full_name || 'Sua comunidade'}</h1>
            <div className="social-stats">
              <span><strong>{photos.length + 12}</strong> publicações</span>
              <span><strong>{following.length + 284}</strong> seguidores</span>
              <span><strong>{following.length + 96}</strong> seguindo</span>
            </div>
          </div>
        </section>

        <section className="social-featured" aria-label="Contas em destaque">
          <div className="social-section-heading"><div><p>DESCUBRA</p><h2>Contas em destaque</h2></div></div>
          <div className="social-accounts">
            {accounts.map((account) => (
              <article className="social-account" key={account.handle}>
                <div className="social-account-avatar" style={{ background: account.tone }}>{account.initials}</div>
                <div><strong>{account.name}</strong><span>{account.handle}</span></div>
                <button type="button" onClick={() => toggleFollow(account.handle)}>
                  {following.includes(account.handle) ? 'Seguindo' : 'Seguir'}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="social-gallery">
          <div className="social-section-heading"><div><p>FOTOS PUBLICADAS</p><h2>{user?.user_type === 'BUSINESS' ? 'Fotos do seu estabelecimento' : 'Inspirações da comunidade'}</h2></div></div>
          {photos.length ? (
            <div className="social-photo-grid">
              {photos.slice(0, 24).map((item) => (
                <Link to={`/local/${item.place.id}`} className="social-photo" key={item.id}>
                  <img src={item.photo_url} alt={`Foto de ${item.place.establishment_name}`} />
                  <div><strong>{item.place.establishment_name}</strong><span>{item.place.city}, {item.place.state}</span></div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="social-empty">
              <strong>O álbum está esperando as primeiras fotos</strong>
              <p>Quando estabelecimentos publicarem fotos gerais ou evidências de acessibilidade, elas aparecerão aqui.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
