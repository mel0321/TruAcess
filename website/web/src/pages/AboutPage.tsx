import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { IconBrain, IconMapPin, IconRamp, IconShield, IconStar, IconUsers } from '../components/Icons';

const pillars = [
  {
    icon: <IconRamp width={24} height={24} />,
    title: 'Acesso real',
    text: 'Selecionamos locais com infraestrutura útil para mobilidade, conforto e segurança em cada etapa da viagem.'
  },
  {
    icon: <IconBrain width={24} height={24} />,
    title: 'Experiência sensorial',
    text: 'Valorizamos ambientes com apoio para pessoas neurodivergentes, sinalização clara e menor sobrecarga sensorial.'
  },
  {
    icon: <IconUsers width={24} height={24} />,
    title: 'Inclusão coletiva',
    text: 'Criamos uma comunidade mais consciente, com informações úteis para famílias, grupos e viajantes independentes.'
  }
];

const values = [
  {
    icon: <IconShield width={22} height={22} />,
    title: 'Segurança',
    text: 'Toda recomendação é pensada para reduzir fricções e aumentar a confiança do viajante.'
  },
  {
    icon: <IconMapPin width={22} height={22} />,
    title: 'Planejamento',
    text: 'Ajudamos a encontrar destinos com informações antes mesmo da chegada, evitando surpresas.'
  },
  {
    icon: <IconStar width={22} height={22} />,
    title: 'Qualidade',
    text: 'Acreditamos que acessibilidade é parte da experiência e não um detalhe extra.'
  }
];

export function AboutPage() {
  return (
    <div className="about-page-shell">
      <Header />

      <main className="about-page">
        <section className="about-hero">
          <div className="about-hero-content">
            <p className="eyebrow">SOBRE A TRUACESS</p>
            <h1>Descubra lugares que respeitam o seu ritmo e apoiam sua próxima viagem.</h1>
            <p>
              A TruAcess nasceu para conectar pessoas a lugares que respeitam diferentes ritmos,
              mobilidades e necessidades. Somos uma plataforma que transforma a experiência de viajar
              em uma jornada mais autônoma, respeitosa e emocionante.
            </p>
            <div className="about-hero-actions">
              <Link to="/destinos" className="btn-explore">Ver destinos acessíveis</Link>
            </div>
          </div>
        </section>

        <section className="about-stats-panel">
          <div className="about-stat">
            <strong>+500</strong>
            <span>locais verificados</span>
          </div>
          <div className="about-stat">
            <strong>10k+</strong>
            <span>viajantes apoiados</span>
          </div>
          <div className="about-stat">
            <strong>98%</strong>
            <span>de satisfação</span>
          </div>
        </section>

        <section className="about-content-grid">
          <div className="about-section-card about-detail-card">
            <p className="eyebrow">Nossa missão</p>
            <h2>Mais do que informações, um guia para viver melhor cada jornada.</h2>
            <p>
              Queremos ajudar cada pessoa a planejar suas viagens com clareza, conforto e confiança.
              Acreditamos que a acessibilidade é essencial em qualquer passeio, hospedagem, refeição
              ou visita cultural.
            </p>
            <ul className="about-checklist">
              <li>Mapeamos experiências com foco em mobilidade, conforto e autonomia.</li>
              <li>Organizamos dados úteis para facilitar a tomada de decisão antes da viagem.</li>
              <li>Promovemos lugares que acolhem diferentes perfis de viajantes.</li>
            </ul>
          </div>

          <div className="about-section-card about-visual-card">
            {pillars.map((pillar) => (
              <div className="about-pillars-item" key={pillar.title}>
                <div className="about-pillars-icon">{pillar.icon}</div>
                <div>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="about-values-section">
          <div className="section-header">
            <p className="eyebrow">O que nos move</p>
            <h2>Valores que guiam cada experiência</h2>
          </div>

          <div className="values-grid">
            {values.map((value) => (
              <div className="value-card" key={value.title}>
                <div className="value-icon">{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer className="footer about-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="logo">
                <span className="tru">Tru</span><span className="access">Acess</span>
              </Link>
              <p className="footer-tagline">Viagens acessíveis com mais autonomia, conforto e confiança.</p>
            </div>

            <div>
              <h4>Navegação</h4>
              <ul>
                <li><Link to="/">Início</Link></li>
                <li><Link to="/destinos">Destinos</Link></li>
                <li><Link to="/sobre">Sobre</Link></li>
              </ul>
            </div>

            <div>
              <h4>Conecte-se</h4>
              <ul>
                <li><Link to="/login">Entrar</Link></li>
                <li><Link to="/register">Cadastrar</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">© 2025 TruAcess. Todos os direitos reservados.</div>
        </div>
      </footer>
    </div>
  );
}
