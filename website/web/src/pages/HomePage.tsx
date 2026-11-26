import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Header } from '../components/Header';
import { IconShield, IconMapPin, IconUsers, IconRamp, IconBrain, IconCulture, IconMuseum, IconRestaurant, IconHotel } from '../components/Icons';
import type { Place } from '../types';
import { getPlaceCategoryLabel } from '../utils/placeCategories';
import { getDistinctPlacePhotoUrls } from '../utils/placePhotos';

export function HomePage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/places', { params: { limit: 500 } })
      .then(res => setPlaces(res.data.places || res.data || []))
      .catch(err => {
        console.error('Erro ao carregar locais:', err);
        setLoadError('Não foi possível carregar os locais. Verifique se o servidor está funcionando.');
      })
      .finally(() => setLoading(false));
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
  const featuredPlace = places.find((place) => getDistinctPlacePhotoUrls(place).length > 0) || places[0];
  const featuredPlacePhotos = featuredPlace ? getDistinctPlacePhotoUrls(featuredPlace) : [];

  return (
    <div>
      <Header />

      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-hero-eyebrow"><span aria-hidden="true" /> SUA PRÓXIMA AVENTURA COMEÇA AQUI</p>
          <h1>Viajar do seu jeito <span>começa aqui.</span></h1>
          <p className="home-hero-description">Descubra lugares incríveis, confira informações de acessibilidade e escolha seu próximo passeio com mais confiança.</p>
          <div className="home-hero-actions">
            <Link to="/destinos" className="home-primary-action">Quero explorar</Link>
            <Link to="/comunidade" className="home-secondary-action">Ver histórias da comunidade</Link>
          </div>
          <div className="home-hero-facts" aria-label="Informações sobre a TruAcess">
            <span><strong>{loading ? '—' : places.length}</strong><small>locais para explorar</small></span>
            <span><strong>{loading ? '—' : uniqueCategories.length}</strong><small>categorias de lugares</small></span>
          </div>
        </div>
        <div className="home-hero-visual">
          <div className="home-floating-note home-floating-note-top"><span aria-hidden="true">✦</span> Um lugar novo espera por você</div>
          {featuredPlace && (
            <Link to={`/local/${featuredPlace.id}`} className="home-hero-preview" aria-label={`Conheça ${featuredPlace.establishment_name}`}>
              <div className="home-preview-image">
                {featuredPlacePhotos.length > 0
                  ? <img src={featuredPlacePhotos[0]} alt={featuredPlace.establishment_name} />
                  : <span className="home-preview-placeholder">{getPlaceCategoryLabel(featuredPlace.category)}</span>}
                <span>DESTINO EM DESTAQUE</span>
                <span className="home-brand-art" aria-label="Marca TruAcess">
                  <img src="/images/truacess-mark.png" alt="" />
                </span>
              </div>
              <div className="home-preview-content">
                <p><IconMapPin width={16} height={16} /> {featuredPlace.city}{featuredPlace.state ? `, ${featuredPlace.state}` : ''}</p>
                <h2>{featuredPlace.establishment_name}</h2>
                <span className="home-preview-link">Ver informações do local</span>
              </div>
            </Link>
          )}
          <div className="home-floating-note home-floating-note-bottom">
            <span className="home-floating-note-icon"><IconRamp width={21} height={21} /></span>
            <span><strong>Viaje com mais autonomia</strong><small>no seu ritmo, do seu jeito</small></span>
          </div>
        </div>
      </section>

      <section className="home-benefits" aria-label="Como a TruAcess ajuda">
        <article><span><IconRamp width={21} height={21} /></span><div><strong>Acessibilidade em foco</strong><p>Veja os recursos informados por cada local.</p></div></article>
        <article><span><IconShield width={21} height={21} /></span><div><strong>Planejamento com clareza</strong><p>Consulte detalhes antes de sair de casa.</p></div></article>
        <article><span><IconUsers width={21} height={21} /></span><div><strong>Vivências compartilhadas</strong><p>Descubra relatos de quem já esteve lá.</p></div></article>
      </section>

      <section className="home-category-bar">
        <div className="container">
          <div className="home-category-title"><strong>O que você quer explorar?</strong><span>Escolha uma categoria</span></div>
          <div className="home-category-list" role="group" aria-label="Filtrar locais por categoria">
            <button className={`home-category-chip${selectedCategory === 'todos' ? ' is-selected' : ''}`} onClick={() => setSelectedCategory('todos')}>Todos</button>
            {uniqueCategories.map((cat, index) => (
              <button key={index} className={`home-category-chip${selectedCategory === cat ? ' is-selected' : ''}`} onClick={() => setSelectedCategory(cat)}>
                {getCategoryIcon(cat)} {getPlaceCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="destinations-section home-destinations-section">
        <div className="container">
          <div className="home-section-heading">
            <div><p className="eyebrow">EXPLORE A TRUACESS</p><h2>Todos os locais para sua próxima viagem</h2><p className="home-results-description">Explore {places.length} opções e filtre por categoria para encontrar o lugar certo.</p></div>
            <Link to="/destinos">Abrir filtros avançados</Link>
          </div>
          {loadError && <p role="alert">{loadError}</p>}
          <div className="destinations-grid home-destinations-grid">
            {loading ? (
              <p className="home-loading" role="status">Carregando todos os locais...</p>
            ) : filteredPlaces.length === 0 && !loadError ? (
              <p className="home-loading" role="status">Não encontramos locais nesta categoria.</p>
            ) : filteredPlaces.map((place) => (
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
        </div>
      </section>

      <section className="about-section">
        <div className="about-content">
          <p className="eyebrow">SOBRE A TRUACESS</p>
          <h2>Mais informação para escolher. Mais autonomia para viajar.</h2>
          <p className="about-description">
            A TruAcess reúne informações de acessibilidade, locais para conhecer e experiências de viajantes para ajudar você a planejar passeios que façam sentido para suas necessidades.
          </p>
          <div className="home-about-actions">
            <Link to="/sobre">Conheça nosso propósito</Link>
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