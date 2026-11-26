import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Header } from '../components/Header';
import { IconShield, IconStar, IconMapPin, IconUsers, IconRamp, IconBrain, IconCulture, IconMuseum, IconRestaurant, IconHotel } from '../components/Icons';
import type { Place } from '../types';
import { getPlaceCategoryLabel } from '../utils/placeCategories';
import { getDistinctPlacePhotoUrls } from '../utils/placePhotos';

export function HomePage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api.get('/places', { params: { limit: 500 } })
      .then(res => setPlaces(res.data.places || res.data || []))
      .catch(err => {
        console.error('Erro ao carregar locais:', err);
        setLoadError('Não foi possível carregar os locais. Verifique se o servidor está funcionando.');
      });
  }, []);

  const uniqueCategories = Array.from(new Set(places.map(p => p.category))).filter(Boolean);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ACCOMMODATION':
        return <IconHotel width={20} height={20} />;
      case 'GASTRONOMY':
        return <IconRestaurant width={20} height={20} />;
      case 'TOURIST_ATTRACTION':
        return <IconMuseum width={20} height={20} />;
      default:
        return <IconCulture width={20} height={20} />;
    }
  };

  const filteredPlaces = places.filter(place => selectedCategory === 'todos' || place.category === selectedCategory);

  return (
    <div>
      <Header />

      <section className="hero home-hero">
        <div className="hero-content">
          <p className="home-hero-eyebrow"><span aria-hidden="true" /> TURISMO PARA TODAS AS FORMAS DE VIAJAR</p>
          <h1>Seu próximo destino pode ser <span>para você.</span></h1>
          <p className="home-hero-description">Descubra hotéis, restaurantes, atrações e serviços com informações de acessibilidade explicadas antes da sua visita.</p>
          <div className="home-hero-search" role="search">
            <IconMapPin width={22} height={22} />
            <Link to="/destinos">Pesquisar destino, cidade ou tipo de local</Link>
            
          </div>
          <div className="home-hero-benefits" aria-label="Benefícios da TruAcess">
            <span><IconRamp width={18} height={18} /> Recursos de acesso</span>
            <span><IconUsers width={18} height={18} /> Experiências de viajantes</span>
            <span><IconShield width={18} height={18} /> Informações transparentes</span>
          </div>
        </div>
      </section>

      <section className="home-trust-strip" aria-label="Como a TruAcess ajuda">
        <div><strong>01</strong><span>Compare recursos de mobilidade, comunicação e conforto.</span></div>
        <div><strong>02</strong><span>Consulte relatos e avaliações de outros viajantes.</span></div>
        <div><strong>03</strong><span>Escolha o local que combina com sua forma de viajar.</span></div>
      </section>

      <section className="home-category-bar">
        <div className="container">
          <div className="home-category-title"><strong>O que você quer explorar?</strong><span>Escolha uma categoria</span></div>
          <div className="home-category-list" role="group" aria-label="Filtrar locais por categoria">
            <button onClick={() => setSelectedCategory('todos')} style={{ padding: '8px 20px', borderRadius: '100px', border: 'none', cursor: 'pointer', background: selectedCategory === 'todos' ? '#052659' : '#F1F5F9', color: selectedCategory === 'todos' ? 'white' : '#64748B', fontWeight: 600, fontSize: 'calc(14px * var(--a11y-font-scale, 1))' }}>Todos</button>
            {uniqueCategories.map((cat, index) => (
              <button key={index} onClick={() => setSelectedCategory(cat)} style={{ padding: '8px 20px', borderRadius: '100px', border: 'none', cursor: 'pointer', background: selectedCategory === cat ? '#052659' : '#F1F5F9', color: selectedCategory === cat ? 'white' : '#64748B', fontWeight: 600, fontSize: 'calc(14px * var(--a11y-font-scale, 1))', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getCategoryIcon(cat)} {getPlaceCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="destinations-section">
        <div className="container">
          <div className="home-section-heading">
            <div><p className="eyebrow">LOCAIS PARA CONHECER</p><h2>Mais opções para sua próxima viagem</h2></div>
            <Link to="/destinos">Ver todos os {places.length || ''} locais <span aria-hidden="true">→</span></Link>
          </div>
          {loadError && <p role="alert">{loadError}</p>}
          <div className="destinations-grid home-destinations-grid">
            {!loadError && places.length === 0 ? (
              <p className="home-loading" role="status">Carregando locais para explorar...</p>
            ) : filteredPlaces.slice(0, 8).map((place) => (
              <Link to={`/local/${place.id}`} key={place.id} className="destination-card">
                <div className={`destination-img${getDistinctPlacePhotoUrls(place).length > 1 ? ' has-photo-mosaic' : ''}`}>
                  {getDistinctPlacePhotoUrls(place).length ? (
                    getDistinctPlacePhotoUrls(place).slice(0, 4).map((photoUrl, index) => (
                      <img key={photoUrl} src={photoUrl} alt={index === 0 ? place.establishment_name : ''} loading="lazy" />
                    ))
                  ) : <span className="destination-no-photo">Foto ainda não cadastrada</span>}
                  {getDistinctPlacePhotoUrls(place).length > 1 && <span className="destination-photo-count">{getDistinctPlacePhotoUrls(place).length} fotos</span>}
                  <div className="destination-pin"></div>
                </div>
                <div className="destination-content">
                  <div className="destination-badges">
                    {place.has_access_ramp && <div className="badge-access"><IconRamp width={16} height={16} /> Acesso Físico</div>}
                    {place.has_asd_friendly_space && <div className="badge-access"><IconBrain width={16} height={16} /> TEA</div>}
                  </div>
                  {(place.has_sign_language_interpreter || place.has_braille_signage) && (
                    <div className="stars" aria-label="Recursos de acessibilidade visual ou auditiva">
                      <span>Recursos de comunicação disponíveis</span>
                    </div>
                  )}
                  <div className="destination-title">{place.establishment_name}</div>
                  <p className="home-place-location"><IconMapPin width={15} height={15} /> {place.city}{place.state ? `, ${place.state}` : ''}</p>
                  <div className="home-place-footer">
                    <span>{getPlaceCategoryLabel(place.category)}</span>
                    <span>{place.average_rating != null ? `${place.average_rating.toFixed(1)} / 5` : 'Conhecer local'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="home-destinations-action">
            <Link to="/destinos" className="btn-explore">Ver destinos e filtros</Link>
          </div>
        </div>
      </section>

      <section className="about-section">
        <div className="about-content">
          <h2>Mais Que Uma Viagem,<br />Uma Experiência de Vida</h2>
          <p className="about-description">
            Conectamos pessoas a destinos incríveis com autonomia, segurança e suporte sensorial completo. 
            Nossa missão é tornar o turismo acessível para todos, independentemente de suas necessidades.
          </p>
          
          <div className="about-stats">
            <div className="stat-item">
              <div className="stat-number">+500</div>
              <div className="stat-label">Locais Verificados</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">+10k</div>
              <div className="stat-label">Viajantes Ativos</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfação</div>
            </div>
          </div>

          <div className="about-icons">
            <div className="about-icon-item">
              <div className="about-icon-circle"><IconUsers width={28} height={28} /></div>
              <div className="about-icon-label">Comunidade</div>
            </div>
            <div className="about-icon-item">
              <div className="about-icon-circle"><IconShield width={28} height={28} /></div>
              <div className="about-icon-label">Confiança</div>
            </div>
            <div className="about-icon-item">
              <div className="about-icon-circle"><IconStar width={28} height={28} /></div>
              <div className="about-icon-label">Empoderamento</div>
            </div>
            <div className="about-icon-item">
              <div className="about-icon-circle"><IconMapPin width={28} height={28} /></div>
              <div className="about-icon-label">Jornada</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="logo">
                <span className="tru">Tru</span><span className="access">Acess</span>
              </Link>
              <p className="footer-tagline">Viagens Acessíveis, Redefinidas.</p>
              <div className="footer-minimal-icons">
                <a href="#" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="#" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href="#" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a href="#" aria-label="Twitter">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4>Navegação</h4>
              <ul>
                <li><Link to="/">Início</Link></li>
                <li><Link to="/destinos">Destinos</Link></li>
                <li><Link to="/sobre">Sobre Nós</Link></li>
              </ul>
            </div>
            <div>
              <h4>Recursos</h4>
              <ul>
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/contato">Contato</Link></li>
                <li><Link to="/termos">Termos</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 TruAcess</p>
          </div>
        </div>
      </footer>
    </div>
  );
}