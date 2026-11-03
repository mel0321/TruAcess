import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { IconBrain, IconMapPin, IconRamp } from '../components/Icons';
import api from '../services/api';
import type { Place } from '../types';

const categories = [
  { value: 'ACCOMMODATION', label: 'Hospedagem' },
  { value: 'GASTRONOMY', label: 'Gastronomia' },
  { value: 'TOURIST_ATTRACTION', label: 'Atrações' },
  { value: 'OTHERS', label: 'Outros' },
];

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
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header />
      <main>
        <section style={{ background: 'white', padding: '56px 0 40px' }}>
          <div className="container">
            <p style={{ color: '#2AC2D2', fontWeight: 700, marginBottom: 8 }}>DESCUBRA NOVOS LUGARES</p>
            <h1 style={{ color: '#052659', fontSize: 40, lineHeight: 1.2, marginBottom: 12 }}>
              Destinos acessíveis
            </h1>
            <p style={{ color: '#64748B', maxWidth: 640 }}>
              Encontre hotéis, restaurantes e atrações com informações de acessibilidade para planejar sua próxima viagem.
            </p>
          </div>
        </section>

        <section className="destinations-section">
          <div className="container">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por local, cidade ou descrição"
                aria-label="Buscar locais"
                style={{ flex: '1 1 280px', minWidth: 0, padding: '13px 16px', border: '1px solid #CBD5E1', borderRadius: 8, font: 'inherit' }}
              />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                aria-label="Filtrar por categoria"
                style={{ flex: '0 1 220px', padding: '13px 16px', border: '1px solid #CBD5E1', borderRadius: 8, background: 'white', font: 'inherit' }}
              >
                <option value="">Todas as categorias</option>
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', color: '#334155', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={accessibleOnly}
                  onChange={(event) => setAccessibleOnly(event.target.checked)}
                />
                Com recursos de acessibilidade
              </label>
            </div>

            {loading ? (
              <p role="status" style={{ textAlign: 'center', padding: 48, color: '#64748B' }}>Carregando locais...</p>
            ) : error ? (
              <div role="alert" style={{ textAlign: 'center', padding: 48 }}>
                <p style={{ color: '#991B1B', marginBottom: 16 }}>{error}</p>
                <button onClick={() => void loadPlaces()} style={{ padding: '10px 18px', border: 0, borderRadius: 8, background: '#052659', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  Tentar novamente
                </button>
              </div>
            ) : filteredPlaces.length === 0 ? (
              <p style={{ textAlign: 'center', padding: 48, color: '#64748B' }}>
                {places.length ? 'Nenhum local encontrado com esses filtros.' : 'Ainda não há locais cadastrados.'}
              </p>
            ) : (
              <>
                <p style={{ color: '#64748B', marginBottom: 20 }}>
                  {filteredPlaces.length} {filteredPlaces.length === 1 ? 'local encontrado' : 'locais encontrados'}
                </p>
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
                        <p style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 13, marginTop: 8 }}>
                          <IconMapPin width={16} height={16} /> {place.city}, {place.state}
                        </p>
                        {place.description && (
                          <p style={{ color: '#64748B', fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
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
