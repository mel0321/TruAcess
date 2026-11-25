import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { IconBrain, IconMapPin, IconRamp } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getPlaceCategoryDetailLabel, getPlaceCategoryLabel, placeCategories, placeCategoryDetails } from '../utils/placeCategories';
import type { DisabilityType, Place, UserProfile } from '../types';

const disabilityAssessmentKeys: Partial<Record<DisabilityType, string[]>> = {
  PHYSICAL: ['step_free_route', 'accessible_entrance', 'access_ramp', 'adapted_restroom'],
  VISUAL: ['tactile_signage', 'braille_information'],
  HEARING: ['libras_support'],
  COGNITIVE: ['accessible_service', 'staff_training'],
  NEURODIVERGENT: ['quiet_space', 'asd_friendly_space', 'sensory_support'],
};

const preferenceAssessmentKeys: Record<string, string[]> = {
  step_free_route: ['step_free_route', 'accessible_entrance', 'access_ramp'],
  accessible_restroom: ['adapted_restroom'],
  braille_or_tactile: ['tactile_signage', 'braille_information'],
  libras_or_captions: ['libras_support'],
  sensory_information: ['quiet_space', 'sensory_support'],
  trained_staff: ['accessible_service', 'staff_training'],
};

function personalizationScore(place: Place, profile: UserProfile | null | undefined) {
  const disabilities = profile?.disabilities?.filter((item) => item !== 'NONE' && item !== 'PREFER_NOT_SAY') || [];
  const keys = new Set(disabilities.flatMap((item) => disabilityAssessmentKeys[item] || []));
  profile?.accessibilityPreferences?.forEach((preference) => preferenceAssessmentKeys[preference]?.forEach((key) => keys.add(key)));
  if (!keys.size) return { score: 0, matches: 0, total: 0 };
  const answers = place.accessibility_assessment || {};
  const matches = [...keys].filter((key) => answers[key] === 'yes').length;
  return { score: matches / keys.size, matches, total: keys.size };
}

export function DestinationsPage() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categoryDetail, setCategoryDetail] = useState('');
  const [minimumRating, setMinimumRating] = useState('');
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
  const placesMatchingOtherFilters = places.filter((place) => {
    const matchesSearch = !normalizedSearch || [
      place.establishment_name,
      place.city,
      place.state,
      place.description,
    ].some((value) => value?.toLocaleLowerCase('pt-BR').includes(normalizedSearch));
    const matchesCategory = !category || place.category === category;
    const matchesCategoryDetail = !categoryDetail || place.category_detail === categoryDetail;
    const matchesAccessibility = !accessibleOnly || (
      place.has_access_ramp || place.has_asd_friendly_space ||
      place.has_adapted_bathroom || place.has_braille_signage ||
      place.has_sign_language_interpreter || place.allows_guide_dog
    );

    return matchesSearch && matchesCategory && matchesCategoryDetail && matchesAccessibility;
  });
  const activeAccessibilityNeeds = user?.user_type === 'TRAVELER' && Boolean(
    user.profile?.disabilities?.some((item) => item !== 'NONE' && item !== 'PREFER_NOT_SAY') ||
    user.profile?.accessibilityPreferences?.length
  );
  const filteredPlaces = placesMatchingOtherFilters
    .filter((place) => (
      !minimumRating ||
      (place.average_rating !== null && place.average_rating !== undefined && place.average_rating >= Number(minimumRating))
    ))
    .sort((first, second) => activeAccessibilityNeeds
      ? personalizationScore(second, user?.profile).score - personalizationScore(first, user?.profile).score
      : 0);
  const ratingOptions = ['3', '4', '5'] as const;
  const ratingCounts = Object.fromEntries(ratingOptions.map((rating) => [
    rating,
    placesMatchingOtherFilters.filter((place) => (
      place.average_rating !== null &&
      place.average_rating !== undefined &&
      place.average_rating >= Number(rating)
    )).length,
  ])) as Record<(typeof ratingOptions)[number], number>;
  const detailCategories = category ? placeCategoryDetails[category] || [] : [];

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
            {activeAccessibilityNeeds && (
              <div className="personalized-accessibility-banner" role="status">
                <span className="personalized-accessibility-icon"><IconRamp width={24} height={24} /></span>
                <div>
                  <strong>Resultados adaptados ao seu perfil de acessibilidade</strong>
                  <p>Priorizamos locais que informaram os recursos relacionados às suas respostas. Você ainda pode alterar os filtros abaixo.</p>
                </div>
              </div>
            )}
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
                  onClick={() => { setCategory(''); setCategoryDetail(''); }}
                >
                  Todas
                </button>
                {placeCategories.map((item, index) => (
                  <button
                    type="button"
                    key={item.value}
                    className={`category-chip category-chip-${index}${category === item.value ? ' is-active' : ''}`}
                    aria-pressed={category === item.value}
                    onClick={() => {
                      setCategory(category === item.value ? '' : item.value);
                      setCategoryDetail('');
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="destination-extra-filters">
              {category && (
                <label>
                  Tipo de local
                  <select value={categoryDetail} onChange={(event) => setCategoryDetail(event.target.value)}>
                    <option value="">Todos os tipos</option>
                    {detailCategories.map((detail) => (
                      <option key={detail.value} value={detail.value}>{detail.label}</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="destination-rating-filter" role="group" aria-labelledby="destination-rating-title">
                <span id="destination-rating-title" className="destination-rating-filter-title">Nota dos viajantes</span>
                <span className="destination-rating-filter-help">Média da experiência geral. Sem avaliações aparece em “Qualquer nota”.</span>
                <div className="destination-rating-options">
                  <button
                    type="button"
                    className={`rating-filter-chip${minimumRating === '' ? ' is-active' : ''}`}
                    aria-pressed={minimumRating === ''}
                    onClick={() => setMinimumRating('')}
                  >
                    Qualquer nota
                  </button>
                  {ratingOptions.map((rating) => (
                    <button
                      type="button"
                      key={rating}
                      className={`rating-filter-chip${minimumRating === rating ? ' is-active' : ''}`}
                      aria-label={`Mostrar locais com média de pelo menos ${rating} de 5 estrelas. ${ratingCounts[rating]} locais correspondem`}
                      aria-pressed={minimumRating === rating}
                      onClick={() => setMinimumRating(minimumRating === rating ? '' : rating)}
                    >
                      <span aria-hidden="true">★</span> {rating}+ <span className="rating-filter-count">{ratingCounts[rating]}</span>
                    </button>
                  ))}
                </div>
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
                          {activeAccessibilityNeeds && (() => {
                            const compatibility = personalizationScore(place, user?.profile);
                            return compatibility.matches > 0 ? (
                              <span className="badge-access badge-personalized"><IconRamp width={16} height={16} /> {compatibility.matches} de {compatibility.total} recursos para você</span>
                            ) : null;
                          })()}
                          {place.has_access_ramp && <span className="badge-access"><IconRamp width={16} height={16} /> Acesso físico</span>}
                          {place.has_asd_friendly_space && <span className="badge-access"><IconBrain width={16} height={16} /> Espaço TEA</span>}
                        </div>
                        <div className="destination-title">{place.establishment_name}</div>
                        <div className="destination-card-meta">
                          <span>{getPlaceCategoryDetailLabel(place.category_detail) || getPlaceCategoryLabel(place.category)}</span>
                          {place.average_rating !== null && place.average_rating !== undefined
                            ? <span className="destination-rating">★ {place.average_rating.toFixed(1)} ({place.total_reviews || 0})</span>
                            : <span className="destination-no-rating">Ainda sem avaliações</span>}
                          {place.accessibility_level && <span className={`destination-level level-${place.accessibility_level.toLowerCase()}`}>{place.accessibility_level === 'INITIAL' ? 'Inicial' : place.accessibility_level === 'INTERMEDIATE' ? 'Intermediário' : 'Avançado'}</span>}
                        </div>
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
