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
            <div className="about-hero-copy">
              <p className="eyebrow">SOBRE A TRUACESS</p>
              <h1>Descubra lugares que respeitam o seu ritmo e apoiam sua próxima viagem.</h1>
              <p>
                A TruAcess nasceu para conectar pessoas a lugares que respeitam diferentes ritmos,
                mobilidades e necessidades. Somos uma plataforma que transforma a experiência de viajar
                em uma jornada mais autônoma, respeitosa e emocionante.
              </p>
              <div className="about-hero-actions">
                <Link to="/destinos" className="btn-explore about-primary-action">
                  <span className="action-copy">
                    <strong>Encontrar meu próximo destino</strong>
                    <small>Destinos e recursos para planejar com autonomia</small>
                  </span>
                </Link>
                <a href="#missao" className="about-mission-action">
                  <span className="mission-copy">
                    <strong>Conheça nossa missão</strong>
                    <small>Veja como queremos transformar o turismo</small>
                  </span>
                </a>
              </div>
              <div className="about-hero-highlights" aria-label="Recursos da TruAcess">
                <span><i aria-hidden="true">✓</i> Filtros de acessibilidade</span>
                <span><i aria-hidden="true">✓</i> Informações para planejar</span>
                <span><i aria-hidden="true">✓</i> Experiências da comunidade</span>
              </div>
            </div>

            <div className="about-hero-visual" aria-label="Demonstração do app mobile">
              <div className="phone-orbit orbit-one" />
              <div className="phone-orbit orbit-two" />

              <div className="floating-card card-top">
                <span className="card-dot" />
                <div>
                  <strong>+500</strong>
                  <small>locais</small>
                </div>
              </div>

              <div className="floating-card card-bottom">
                <span className="card-badge">Acessível</span>
                <div>
                  <strong>98%</strong>
                  <small>satisfação</small>
                </div>
              </div>

              <div className="phone-mockup">
                <div className="phone-speaker" />
                <div className="phone-screen">
                  <div className="screen-header">
                    <span className="screen-brand">TruAcess</span>
                    <span className="screen-status">9:41</span>
                  </div>

                  <div className="screen-search">
                    <span className="search-glass" aria-hidden="true" />
                    <span>Buscar destino ou cidade</span>
                  </div>

                  <div className="screen-section-heading">
                    <div>
                      <small>SELEÇÃO TRUACESS</small>
                      <h3>Para sua próxima viagem</h3>
                    </div>
                    <span className="screen-more">Ver todos</span>
                  </div>

                  <div className="screen-place-card">
                    <div className="place-image">
                      <span className="place-image-sun" />
                      <span className="place-image-hill hill-back" />
                      <span className="place-image-hill hill-front" />
                      <span className="place-image-label">DESTAQUE</span>
                    </div>
                    <div className="place-card-content">
                      <span className="place-location"><IconMapPin width={12} height={12} /> Bahia, Brasil</span>
                      <strong>Praia do Forte</strong>
                      <div className="place-rating"><span>★</span> 4,9 <small>· 28 avaliações</small></div>
                    </div>
                  </div>

                  <div className="screen-accessibility">
                    <div className="accessibility-heading">
                      <strong>Recursos de acesso</strong>
                      <span>3 disponíveis</span>
                    </div>
                    <div className="accessibility-chips">
                      <span><i>✓</i> Rampa</span>
                      <span><i>✓</i> Banheiro</span>
                      <span><i>✓</i> Libras</span>
                    </div>
                  </div>

                  <div className="screen-bottom-nav">
                    <span className="nav-item active"><i>⌂</i>Início</span>
                    <span className="nav-item"><i>⌕</i>Explorar</span>
                    <span className="nav-item"><i>♡</i>Salvos</span>
                    <span className="nav-item"><i>○</i>Perfil</span>
                  </div>
                </div>
              </div>
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

        <section className="about-content-grid" id="missao">
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
            <p className="eyebrow">Como a TruAcess funciona</p>
            <h2>Informação confiável para cada etapa da visita</h2>
          </div>
          <div className="about-process-grid">
            <article><span>01</span><h3>Conte sobre suas necessidades</h3><p>O questionário do viajante identifica preferências de mobilidade, comunicação e ambiente. Você controla quais informações deseja compartilhar.</p></article>
            <article><span>02</span><h3>Receba uma experiência adaptada</h3><p>O site ajusta contraste, controles, movimento e priorização dos resultados de acordo com as necessidades informadas no perfil.</p></article>
            <article><span>03</span><h3>Planeje com contexto</h3><p>Estabelecimentos informam recursos reais e viajantes compartilham experiências, ajudando a comparar diferentes opções antes de sair.</p></article>
          </div>
        </section>

        <section className="about-story-section">
          <div className="about-story-copy">
            <p className="eyebrow">Por que existimos</p>
            <h2>O problema não é viajar. É decidir sem as informações certas.</h2>
            <p>Muitas vezes, uma viagem é planejada descobrindo tarde demais que a entrada tem degraus, que o banheiro não atende às necessidades da pessoa ou que o ambiente pode gerar desconforto. A TruAcess nasceu para colocar essas informações no começo do planejamento.</p>
            <p>Reunimos as informações declaradas pelos estabelecimentos com experiências reais da comunidade. Assim, cada visitante pode avaliar quais condições são importantes para sua própria realidade, em vez de depender de um rótulo genérico de “acessível”.</p>
          </div>
          <div className="about-audience-grid">
            <article><strong>Viajantes</strong><p>Encontram locais, salvam opções e identificam recursos compatíveis com suas necessidades.</p></article>
            <article><strong>Famílias e acompanhantes</strong><p>Planejam deslocamentos e visitas considerando conforto, autonomia e segurança do grupo.</p></article>
            <article><strong>Estabelecimentos</strong><p>Apresentam seus recursos com clareza e descobrem oportunidades de melhoria pelo contato com viajantes.</p></article>
          </div>
        </section>

        <section className="about-method-section">
          <div className="section-header">
            <p className="eyebrow">Informação explicada</p>
            <h2>De onde vêm os dados de acessibilidade</h2>
          </div>
          <div className="about-method-grid">
            <article><span>01</span><h3>Autodeclaração do local</h3><p>O estabelecimento responde perguntas sobre acesso físico, comunicação, atendimento e conforto sensorial. As respostas devem representar a condição atual do espaço.</p></article>
            <article><span>02</span><h3>Avaliações de visitantes</h3><p>Viajantes relatam sua experiência e a presença dos recursos durante a visita, oferecendo uma perspectiva prática e complementar.</p></article>
            <article><span>03</span><h3>Compatibilidade com seu perfil</h3><p>Quando você responde ao questionário, os resultados consideram seus recursos prioritários. A plataforma não substitui a confirmação direta com o local.</p></article>
          </div>
        </section>

        <section className="about-commitment-section">
          <div>
            <p className="eyebrow">Nosso compromisso</p>
            <h2>Transparência sem prometer uma experiência igual para todo mundo.</h2>
          </div>
          <p>Acessibilidade é específica para cada pessoa e pode mudar. Por isso, mostramos quem informou cada recurso, separamos autodeclarações de avaliações de visitantes e incentivamos empresas a manterem os dados atualizados. A TruAcess não substitui o contato prévio com o local nem uma vistoria técnica.</p>
        </section>

        <section className="about-faq-section">
          <div>
            <p className="eyebrow">Dúvidas frequentes</p>
            <h2>O que você precisa saber antes de usar a plataforma</h2>
          </div>
          <div className="about-faq-list">
            <details><summary>A TruAcess certifica que um local é acessível?</summary><p>Não. As informações são declaradas pelos estabelecimentos e complementadas por avaliações. Elas ajudam no planejamento, mas não representam auditoria ou certificação técnica.</p></details>
            <details><summary>Por que dois perfis podem receber recomendações diferentes?</summary><p>Porque acessibilidade varia conforme mobilidade, comunicação, sensibilidade sensorial e preferências de cada pessoa.</p></details>
            <details><summary>Como manter minhas informações pessoais privadas?</summary><p>O questionário permite escolher o que compartilhar e oferece opções de não informar. Suas respostas servem para personalizar a experiência e podem ser alteradas.</p></details>
            <details><summary>O que fazer se uma informação estiver desatualizada?</summary><p>Consulte diretamente o estabelecimento e deixe uma avaliação detalhada após a visita. Feedbacks ajudam outros viajantes e alertam os responsáveis pelo local.</p></details>
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
