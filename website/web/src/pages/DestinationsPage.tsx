import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { IconBrain, IconMapPin, IconRamp } from '../components/Icons';
import api from '../services/api';
import { placeCategories } from '../utils/placeCategories';
import type { Place } from '../types';

export function DestinationsPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPlaces = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get<{ places: Place[] }>('/places', {
        params: { limit: 100 },
      });
      setPlaces(response.data.places);
    } catch (loadError) {
      console.error('Erro ao carregar locais:', loadError);
      setError('Não foi possível carregar os locais. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlaces();
  }, []);

  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
  const filteredPlaces = places.filter((place) => {
    const matchesSearch = !normalizedSearch || [
      place.establishment_name,
      place.city,
      place.state,
      place.description,
    ].some((value) => value?.toLocaleLowerCase('pt-BR').includes(normalizedSearch));
    const matchesCategory = !category || place.category === category;
    const matchesAccessibility = !accessibleOnly || (
      place.has_access_ramp || place.has_asd_friendly_space ||
      place.has_adapted_bathroom || place.has_braille_signage ||
      place.has_sign_language_interpreter || place.allows_guide_dog
    );

    return matchesSearch && matchesCategory && matchesAccessibility;
  });

  return (
    <div className="destinations-page">
      <Header />
      <main>
        <section className="destinations-hero">
          <div className="container">
            <div className="destinations-hero-copy">
              <p className="destinations-eyebrow"><span /> DESCUBRA NOVOS LUGARES</p>
              <h1>Destinos que combinam <span>com você.</span></h1>
              <p className="destinations-intro">
                Encontre hotéis, restaurantes e atrações com informações de acessibilidade para planejar sua próxima viagem com mais confiança.
              </p>
              <div className="destinations-traits" aria-label="Benefícios da busca">
                <span><IconRamp width={17} height={17} /> Recursos de acesso</span>
                <span><IconMapPin width={17} height={17} /> Lugares para explorar</span>
              </div>
            </div>
            <div className="destinations-hero-art" aria-hidden="true">
              <span className="destinations-art-orbit orbit-a" />
              <span className="destinations-art-orbit orbit-b" />
              <div className="destinations-art-pin"><IconMapPin width={42} height={42} /></div>
              <span className="destinations-art-dot dot-a" />
              <span className="destinations-art-dot dot-b" />
            </div>
          </div>
        </section>

        <section className="destinations-section destinations-discovery">
          <div className="container">
            <div className="destination-controls">
              <label className="destination-search">
                <span className="destination-search-icon"><IconMapPin width={19} height={19} /></span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por local, cidade ou descrição"
                  aria-label="Buscar locais"
                />
              </label>
              <label className={`accessibility-toggle${accessibleOnly ? ' is-active' : ''}`}>
                <input
                  type="checkbox"
                  checked={accessibleOnly}
                  onChange={(event) => setAccessibleOnly(event.target.checked)}
                />
                <span className="accessibility-toggle-icon"><IconRamp width={20} height={20} /></span>
                <span className="accessibility-toggle-copy">
                  <strong>Recursos de acessibilidade</strong>
                  <small>Mostrar locais com recursos informados</small>
                </span>
                <span className="toggle-track" aria-hidden="true"><span /></span>
              </label>
            </div>

            <div className="destination-category-row">
              <div>
                <h2>Explore por categoria</h2>
                <p>Encontre o tipo de experiência que procura</p>
              </div>
              <div className="destination-categories" aria-label="Categorias de destinos">
                <button
                  type="button"
                  className={`category-chip${category === '' ? ' is-active' : ''}`}
                  aria-pressed={category === ''}
                  onClick={() => setCategory('')}
                >
                  Todas
                </button>
                {placeCategories.map((item, index) => (
                  <button
                    type="button"
                    key={item.value}
                    className={`category-chip category-chip-${index}${category === item.value ? ' is-active' : ''}`}
                    aria-pressed={category === item.value}
                    onClick={() => setCategory(category === item.value ? '' : item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <p role="status" className="destinations-message">Carregando locais...</p>
            ) : error ? (
              <div role="alert" className="destinations-message">
                <p>{error}</p>
                <button onClick={() => void loadPlaces()} className="destinations-retry">
                  Tentar novamente
                </button>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <p className="destinations-message">
                {places.length ? 'Nenhum local encontrado com esses filtros.' : 'Ainda não há locais cadastrados.'}
              </p>
            ) : (
              <>
                <div className="destinations-results-heading">
                  <div>
                    <h2>Lugares para sua próxima viagem</h2>
                    <p>{filteredPlaces.length} {filteredPlaces.length === 1 ? 'local encontrado' : 'locais encontrados'}</p>
                  </div>
                  <span className="results-mark"><IconMapPin width={18} height={18} /> Atualizados pela comunidade</span>
                </div>
                <div className="destinations-grid">
                  {filteredPlaces.map((place) => (
                    <Link to={`/local/${place.id}`} key={place.id} className="destination-card">
                      <div className="destination-img">
                        <img
                          src={place.main_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'}
                          alt={place.establishment_name}
                        />
                        <div className="destination-pin" />
                      </div>
                      <div className="destination-content">
                        <div className="destination-badges">
                          {place.has_access_ramp && <span className="badge-access"><IconRamp width={16} height={16} /> Acesso físico</span>}
                          {place.has_asd_friendly_space && <span className="badge-access"><IconBrain width={16} height={16} /> Espaço TEA</span>}
                        </div>
                        <div className="destination-title">{place.establishment_name}</div>
                        <p className="destination-location">
                          <IconMapPin width={16} height={16} /> {place.city}, {place.state}
                        </p>
                        {place.description && (
                          <p className="destination-description">
                            {place.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
