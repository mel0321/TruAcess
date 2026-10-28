import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Header } from '../components/Header';
import { IconShield, IconStar, IconMapPin, IconUsers, IconRamp, IconBrain, IconCulture, IconBeach, IconMuseum, IconRestaurant, IconTrail, IconHotel } from '../components/Icons';
import type { Place } from '../types';

export function HomePage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  useEffect(() => {
    api.get('/places')
      .then(res => setPlaces(res.data.places || res.data || []))
      .catch(err => console.error(err));
  }, []);

  const uniqueCategories = Array.from(new Set(places.map(p => p.category))).filter(Boolean);

  const getCategoryIcon = (category: string) => {
    const cat = category?.toLowerCase();
    if (cat?.includes('hotel')) return <IconHotel width={20} height={20} />;
    if (cat?.includes('praia')) return <IconBeach width={20} height={20} />;
    if (cat?.includes('museu')) return <IconMuseum width={20} height={20} />;
    if (cat?.includes('restaurante')) return <IconRestaurant width={20} height={20} />;
    if (cat?.includes('trilha')) return <IconTrail width={20} height={20} />;
    return <IconCulture width={20} height={20} />;
  };

  const filteredPlaces = places.filter(place => selectedCategory === 'todos' || place.category === selectedCategory);

  return (
    <div>
      <Header />

      <section className="hero">
        <div className="hero-content">
          <h1>Explore o Mundo <span>Sem Limites</span></h1>
          <p>Aventuras acessíveis para todos. Sua próxima jornada começa aqui.</p>
          <div className="hero-buttons">
            <Link to="/destinos" className="btn-explore">Explorar Destinos</Link>
            <Link to="/sobre" className="btn-story">Nossa História</Link>
          </div>
        </div>
      </section>

      <section className="features-bar">
        <div className="container">
          <div className="features-grid">
            <div className="feature-item"><div className="feature-icon"><IconShield width={24} height={24} /></div><div className="feature-text">Segurança</div></div>
            <div className="feature-item"><div className="feature-icon"><IconRamp width={24} height={24} /></div><div className="feature-text">Suporte</div></div>
            <div className="feature-item"><div className="feature-icon"><IconStar width={24} height={24} /></div><div className="feature-text">Qualidade</div></div>
            <div className="feature-item"><div className="feature-icon"><IconMapPin width={24} height={24} /></div><div className="feature-text">Localização</div></div>
            <div className="feature-item"><div className="feature-icon"><IconUsers width={24} height={24} /></div><div className="feature-text">Inclusão</div></div>
          </div>
        </div>
      </section>

      <section style={{ padding: '24px 0', background: 'white', borderBottom: '1px solid #E2E8F0' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto' }}>
            <button onClick={() => setSelectedCategory('todos')} style={{ padding: '8px 20px', borderRadius: '100px', border: 'none', cursor: 'pointer', background: selectedCategory === 'todos' ? '#052659' : '#F1F5F9', color: selectedCategory === 'todos' ? 'white' : '#64748B', fontWeight: 600, fontSize: '14px' }}>Todos</button>
            {uniqueCategories.map((cat, index) => (
              <button key={index} onClick={() => setSelectedCategory(cat)} style={{ padding: '8px 20px', borderRadius: '100px', border: 'none', cursor: 'pointer', background: selectedCategory === cat ? '#052659' : '#F1F5F9', color: selectedCategory === cat ? 'white' : '#64748B', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getCategoryIcon(cat)} {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="destinations-section">
        <div className="container">
          <div className="section-header"><h2>Principais Destinos</h2></div>
          <div className="destinations-grid">
            {filteredPlaces.slice(0, 5).map((place) => (
              <Link to={`/local/${place.id}`} key={place.id} className="destination-card">
                <div className="destination-img">
                  <img src={place.main_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'} alt={place.establishment_name} />
                  <div className="destination-pin"></div>
                </div>
                <div className="destination-content">
                  <div className="destination-badges">
                    {place.has_access_ramp && <div className="badge-access"><IconRamp width={16} height={16} /> Acesso Físico</div>}
                    {place.has_asd_friendly_space && <div className="badge-access"><IconBrain width={16} height={16} /> TEA</div>}
                  </div>
                  {(place.has_sign_language_interpreter || place.has_braille_signage) && <div className="stars">★★★★★</div>}
                  <div className="destination-title">{place.establishment_name}</div>
                </div>
              </Link>
            ))}
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

          <div className="about-cta">
            <Link to="/register" className="btn-about">Começar Agora</Link>
            <Link to="/sobre" className="btn-about-outline">Saiba Mais</Link>
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
              <p className="footer-tagline">Viagens Acessíveis, Redefinidas. Conectando você ao mundo sem barreiras.</p>
              <div className="footer-social">
                <a href="#" aria-label="Facebook">f</a>
                <a href="#" aria-label="Instagram">📷</a>
                <a href="#" aria-label="LinkedIn">in</a>
                <a href="#" aria-label="YouTube">▶</a>
              </div>
            </div>
            <div>
              <h4>Links Rápidos</h4>
              <ul>
                <li><Link to="/">Início</Link></li>
                <li><Link to="/destinos">Destinos</Link></li>
                <li><Link to="/sobre">Sobre Nós</Link></li>
                <li><Link to="/acessibilidade">Acessibilidade</Link></li>
              </ul>
            </div>
            <div>
              <h4>Recursos</h4>
              <ul>
                <li><Link to="/blog">Blog</Link></li>
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/guia">Guia de Acessibilidade</Link></li>
                <li><Link to="/dicas">Dicas de Viagem</Link></li>
              </ul>
            </div>
            <div className="footer-contact">
              <h4>Contato</h4>
              <p>📧 contato@truaccess.com.br</p>
              <p>📱 (11) 99999-9999</p>
              <p>📍 São Paulo, SP - Brasil</p>
              <p>🕐 Seg-Sex: 9h às 18h</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 TruAcess. Todos os direitos reservados. Feito com ❤️ para tornar o mundo mais acessível.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}