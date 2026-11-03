import { Link } from 'react-router-dom';
import { Header } from '../components/Header';

export function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header />
      <main className="about-section">
        <div className="about-content">
          <p style={{ color: '#2AC2D2', fontWeight: 700, marginBottom: 12 }}>SOBRE A TRUACESS</p>
          <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 20, lineHeight: 1.2 }}>
            Viagens acessíveis, redefinidas
          </h1>
          <p className="about-description">
            A TruAcess conecta viajantes a hotéis, restaurantes e atrações com informações de acessibilidade.
            Queremos ajudar cada pessoa a planejar suas jornadas com mais autonomia, segurança e confiança.
          </p>
          <Link to="/destinos" className="btn-explore">Explorar locais</Link>
        </div>
      </main>
    </div>
  );
}
