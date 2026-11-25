import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { accessibilityQuestions, type AccessibilityAnswer, type AccessibilityAssessment } from '../utils/accessibilityQuestionnaire';
import { getPlaceCategoryDetailLabel, getPlaceCategoryLabel, placeCategories, placeCategoryDetails } from '../utils/placeCategories';
import type { Place, PlacePhoto } from '../types';

type PhotoCategory = NonNullable<PlacePhoto['accessibility_category']>;
type PendingPhoto = {
  id: string;
  file: File;
  photo_type: PlacePhoto['photo_type'];
  accessibility_category: PhotoCategory;
};

const accessibilityPhotoCategories: Array<{ value: PhotoCategory; label: string }> = [
  { value: 'ACCESS_ROUTE', label: 'Rota acessível' },
  { value: 'RAMP', label: 'Rampa' },
  { value: 'ENTRANCE', label: 'Entrada' },
  { value: 'ADAPTED_BATHROOM', label: 'Banheiro adaptado' },
  { value: 'PARKING', label: 'Vaga acessível' },
  { value: 'BRAILLE', label: 'Braille' },
  { value: 'SIGN_LANGUAGE', label: 'Libras' },
  { value: 'GUIDE_DOG', label: 'Cão-guia' },
  { value: 'SENSORY_SPACE', label: 'Espaço sensorial' },
  { value: 'OTHER', label: 'Outro recurso' },
];

type PlaceForm = {
  establishment_name: string;
  category: string;
  category_detail: string;
  full_address: string;
  city: string;
  district: string;
  state: string;
  country: string;
  description: string;
  price: string;
  main_image: string;
  phone: string;
  website: string;
  opening_hours: string;
};

const emptyForm: PlaceForm = {
  establishment_name: '',
  category: 'ACCOMMODATION',
  category_detail: '',
  full_address: '',
  city: '',
  district: '',
  state: '',
  country: 'Brasil',
  description: '',
  price: '',
  main_image: '',
  phone: '',
  website: '',
  opening_hours: '',
};

const answerOptions: Array<{ value: AccessibilityAnswer; label: string }> = [
  { value: 'yes', label: 'Sim' },
  { value: 'no', label: 'Não' },
  { value: 'unsure', label: 'Não sei / não se aplica' },
];

const categoryPriorityQuestions: Record<string, string[]> = {
  ACCOMMODATION: ['step_free_route', 'adapted_restroom', 'accessible_parking', 'quiet_space'],
  GASTRONOMY: ['accessible_entrance', 'adapted_restroom', 'accessible_service', 'guide_dog'],
  TOURIST_ATTRACTION: ['step_free_route', 'tactile_signage', 'accessible_website', 'sensory_support'],
  SHOPPING: ['step_free_route', 'accessible_parking', 'accessible_service', 'libras_support'],
  HEALTH: ['accessible_entrance', 'adapted_restroom', 'libras_support', 'staff_training'],
  TRANSPORT: ['step_free_route', 'accessible_parking', 'tactile_signage', 'libras_support'],
  ENTERTAINMENT: ['accessible_entrance', 'adapted_restroom', 'quiet_space', 'sensory_support'],
  EDUCATION: ['step_free_route', 'braille_information', 'libras_support', 'staff_training'],
  SPORTS: ['step_free_route', 'adapted_restroom', 'access_ramp', 'accessible_service'],
};

export function PlaceManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isWelcome = searchParams.get('welcome') === '1';
  const { user } = useAuth();
  const [form, setForm] = useState<PlaceForm>(emptyForm);
  const [assessment, setAssessment] = useState<AccessibilityAssessment>({});
  const [existingPhotos, setExistingPhotos] = useState<PlacePhoto[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [assessmentSaveStatus, setAssessmentSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const assessmentSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const assessmentSaveVersion = useRef(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    api.get<{ place: Place }>(`/places/${id}`)
      .then(({ data }) => {
        if (!active) return;
        const place = data.place;
        setForm({
          establishment_name: place.establishment_name,
          category: place.category,
          category_detail: place.category_detail || '',
          full_address: place.full_address || '',
          city: place.city,
          district: place.district || '',
          state: place.state || '',
          country: place.country || 'Brasil',
          description: place.description || '',
          price: place.price == null ? '' : (place.price / 100).toFixed(2),
          main_image: place.main_image || '',
          phone: place.phone || '',
          website: place.website || '',
          opening_hours: place.opening_hours || '',
        });
        setAssessment(place.accessibility_assessment || {});
        setExistingPhotos(place.photos || []);
        setAssessmentSaveStatus('idle');
      })
      .catch(() => setError('Não foi possível carregar os dados deste estabelecimento.'))
      .finally(() => setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (!user || user.user_type !== 'BUSINESS') {
    return (
      <div className="place-form-page">
        <Header />
        <main className="place-form-shell">
          <div className="place-form-card">
            <h1>Área de estabelecimentos</h1>
            <p>Este espaço é exclusivo para contas de estabelecimento.</p>
            <Link to="/dashboard">Voltar</Link>
          </div>
        </main>
      </div>
    );
  }

  const updateForm = (key: keyof PlaceForm, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === 'category' ? { category_detail: '' } : {}),
    }));
  };

  const updateAssessment = (key: string, answer: AccessibilityAnswer) => {
    const nextAssessment = { ...assessment, [key]: answer };
    setAssessment(nextAssessment);
    if (!id) return;

    const version = ++assessmentSaveVersion.current;
    setAssessmentSaveStatus('saving');
    const saveRequest = assessmentSaveQueue.current.then(async () => {
      await api.put(`/places/${id}`, { accessibility_assessment: nextAssessment });
    });
    assessmentSaveQueue.current = saveRequest.then(() => undefined, () => undefined);
    void saveRequest.then(() => {
      if (version === assessmentSaveVersion.current) setAssessmentSaveStatus('saved');
    }).catch((saveError: unknown) => {
      console.error('Erro ao salvar resposta do questionário:', saveError);
      if (version === assessmentSaveVersion.current) setAssessmentSaveStatus('error');
    });
  };

  const savePlace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const priceValue = form.price.trim() ? Number(form.price.replace(',', '.')) : null;
    if (priceValue !== null && (!Number.isFinite(priceValue) || priceValue < 0)) {
      setError('Informe um preço válido ou deixe o campo em branco.');
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      price: priceValue === null ? null : Math.round(priceValue * 100),
      accessibility_assessment: assessment,
    };
    let placeSaved = false;
    try {
      const response = id
        ? await api.put<{ place: Place }>(`/places/${id}`, payload)
        : await api.post<{ place: Place }>('/places', payload);
      const placeId = response.data.place.id;
      placeSaved = true;
      if (!id && pendingPhotos.length > 0) navigate(`/edit-place/${placeId}`, { replace: true });
      for (const photo of pendingPhotos) {
        const data = new FormData();
        data.append('photo', photo.file);
        data.append('photo_type', photo.photo_type);
        if (photo.photo_type === 'ACCESSIBILITY') {
          data.append('accessibility_category', photo.accessibility_category);
        }
        const uploaded = await api.post<{ photo: PlacePhoto }>(`/places/${placeId}/photos`, data);
        setExistingPhotos((current) => [...current, uploaded.data.photo]);
        setPendingPhotos((current) => current.filter((item) => item.id !== photo.id));
      }
      navigate('/dashboard');
    } catch (saveError: unknown) {
      const responseData = (saveError as { response?: { data?: { message?: string; error?: string } } }).response?.data;
      const message = responseData?.message || responseData?.error;
      setError(message || (placeSaved
        ? 'Os dados do estabelecimento foram salvos, mas uma foto não foi enviada. Tente novamente.'
        : 'Não foi possível salvar. Revise os dados e tente novamente.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="place-form-message" role="status">Carregando estabelecimento...</div>;
  }

  const categoryDetails = placeCategoryDetails[form.category] || [];
  const priorityKeys = categoryPriorityQuestions[form.category] || categoryPriorityQuestions.TOURIST_ATTRACTION;
  const orderedAccessibilityQuestions = [
    ...accessibilityQuestions.filter((question) => priorityKeys.includes(question.key)),
    ...accessibilityQuestions.filter((question) => !priorityKeys.includes(question.key)),
  ];
  const answeredQuestionCount = Object.values(assessment).filter((answer) => answer === 'yes' || answer === 'no' || answer === 'unsure').length;

  return (
    <div className="place-form-page">
      <Header />
      <main className="place-form-shell">
        <Link className="place-form-back" to="/dashboard">Voltar ao painel</Link>
        <header className="place-form-heading">
          <span>PERFIL DO ESTABELECIMENTO</span>
          <h1>{id ? 'Atualize as informações do local' : 'Cadastre seu estabelecimento'}</h1>
          <p>Esses dados ajudam viajantes a encontrar e planejar uma visita com mais autonomia.</p>
        </header>

        {isWelcome && !id && (
          <section className="business-welcome-card" role="status">
            <div>
              <strong>Conta criada! Agora vamos enriquecer o perfil da sua empresa.</strong>
              <p>Preencha os dados comerciais e responda ao questionário. As perguntas mais relevantes para sua categoria aparecem primeiro.</p>
            </div>
            <ol>
              <li><span>1</span> Identifique o tipo de estabelecimento</li>
              <li><span>2</span> Informe contatos, localização e funcionamento</li>
              <li><span>3</span> Descreva os recursos reais de acessibilidade</li>
            </ol>
          </section>
        )}

        {error && <div role="alert" className="place-form-error">{error}</div>}

        <form className="place-form-card" onSubmit={savePlace}>
          <section className="place-form-section">
            <h2>Informações principais</h2>
            <div className="place-form-grid">
              <label className="place-form-field place-form-wide">Nome do estabelecimento
                <input required value={form.establishment_name} onChange={(event) => updateForm('establishment_name', event.target.value)} />
              </label>
              <label className="place-form-field">Categoria
                <select required value={form.category} onChange={(event) => updateForm('category', event.target.value)}>
                  {placeCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                </select>
              </label>
              <label className="place-form-field">Tipo de local
                <select value={form.category_detail} onChange={(event) => updateForm('category_detail', event.target.value)}>
                  <option value="">Selecione (opcional)</option>
                  {categoryDetails.map((detail) => <option key={detail.value} value={detail.value}>{detail.label}</option>)}
                </select>
              </label>
              <label className="place-form-field place-form-wide">Endereço completo
                <input required value={form.full_address} onChange={(event) => updateForm('full_address', event.target.value)} />
              </label>
              <label className="place-form-field">Cidade
                <input required value={form.city} onChange={(event) => updateForm('city', event.target.value)} />
              </label>
              <label className="place-form-field">Bairro / distrito
                <input value={form.district} onChange={(event) => updateForm('district', event.target.value)} />
              </label>
              <label className="place-form-field">Estado / província / região
                <input value={form.state} onChange={(event) => updateForm('state', event.target.value)} />
              </label>
              <label className="place-form-field">País
                <input required value={form.country} onChange={(event) => updateForm('country', event.target.value)} />
              </label>
              <label className="place-form-field">Telefone
                <input type="tel" value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} />
              </label>
              <label className="place-form-field">Site
                <input type="url" placeholder="https://" value={form.website} onChange={(event) => updateForm('website', event.target.value)} />
              </label>
              <label className="place-form-field">Horário de funcionamento
                <input placeholder="Ex.: seg–sex, 9h às 18h" value={form.opening_hours} onChange={(event) => updateForm('opening_hours', event.target.value)} />
              </label>
              <label className="place-form-field">Preço aproximado (R$)
                <input inputMode="decimal" value={form.price} onChange={(event) => updateForm('price', event.target.value)} />
              </label>
              <label className="place-form-field place-form-wide">Link da foto principal
                <input type="url" placeholder="https://" value={form.main_image} onChange={(event) => updateForm('main_image', event.target.value)} />
              </label>
              <label className="place-form-field place-form-wide">Descrição
                <textarea rows={4} value={form.description} onChange={(event) => updateForm('description', event.target.value)} />
              </label>
              <label className="place-form-field">CEP
                <input inputMode="numeric" placeholder="00000-000" />
              </label>
              <label className="place-form-field">Link do mapa
                <input type="url" placeholder="https://maps.google.com/..." />
              </label>
              <label className="place-form-field">Faixa de preço
                <select><option value="">Selecione</option><option>Gratuito</option><option>Econômico</option><option>Moderado</option><option>Premium</option></select>
              </label>
              <label className="place-form-field">Público atendido
                <select><option value="">Selecione</option><option>Famílias</option><option>Casais</option><option>Grupos</option><option>Individual</option><option>Todos os públicos</option></select>
              </label>
              <label className="place-form-field place-form-wide">Serviços e diferenciais
                <textarea rows={3} placeholder="Ex.: reserva, entrega, estacionamento, tours guiados, pagamento por app..." />
              </label>
              <label className="place-form-field place-form-wide">Formas de pagamento
                <input placeholder="Dinheiro, cartão, Pix, vale-alimentação..." />
              </label>
            </div>
          </section>

          <section className="place-form-section">
            <h2>Fotos do local e de acessibilidade</h2>
            <p>Adicione quantas fotos precisar. As evidências ajudam na avaliação, mas não alteram a pontuação automaticamente.</p>
            {existingPhotos.length > 0 && (
              <div className="place-photo-grid">
                {existingPhotos.map((photo) => (
                  <figure key={photo.id}>
                    <img src={photo.photo_url} alt={photo.photo_type === 'ACCESSIBILITY' ? `Evidência: ${photo.accessibility_category}` : 'Foto do estabelecimento'} />
                    <figcaption>{photo.photo_type === 'ACCESSIBILITY' ? accessibilityPhotoCategories.find((item) => item.value === photo.accessibility_category)?.label || 'Acessibilidade' : 'Foto do local'}</figcaption>
                  </figure>
                ))}
              </div>
            )}
            <div className="place-form-grid">
              <label className="place-form-field">Fotos gerais
                <input type="file" accept="image/*" multiple onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  setPendingPhotos((current) => [...current, ...files.map((file) => ({
                    id: `${file.name}-${file.lastModified}-${Math.random()}`,
                    file, photo_type: 'PLACE' as const, accessibility_category: 'OTHER' as const,
                  }))]);
                  event.target.value = '';
                }} />
              </label>
              <label className="place-form-field">Evidências de acessibilidade
                <input type="file" accept="image/*" multiple onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  setPendingPhotos((current) => [...current, ...files.map((file) => ({
                    id: `${file.name}-${file.lastModified}-${Math.random()}`,
                    file, photo_type: 'ACCESSIBILITY' as const, accessibility_category: 'RAMP' as const,
                  }))]);
                  event.target.value = '';
                }} />
              </label>
            </div>
            {pendingPhotos.length > 0 && (
              <ul className="place-pending-photos">
                {pendingPhotos.map((photo) => (
                  <li key={photo.id}>
                    <span>{photo.file.name}</span>
                    {photo.photo_type === 'ACCESSIBILITY' && (
                      <select aria-label={`Recurso comprovado por ${photo.file.name}`} value={photo.accessibility_category} onChange={(event) => {
                        const category = event.target.value as PhotoCategory;
                        setPendingPhotos((current) => current.map((item) => item.id === photo.id ? { ...item, accessibility_category: category } : item));
                      }}>
                        {accessibilityPhotoCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    )}
                    <button type="button" onClick={() => setPendingPhotos((current) => current.filter((item) => item.id !== photo.id))}>Remover</button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="place-form-section">
            <div className="place-questionnaire-heading">
              <div><h2>Questionário de acessibilidade</h2><p>Responda com base nas condições atuais do local.</p></div>
              <span>Autodeclarado</span>
            </div>
            <p className="place-questionnaire-notice">
              Este é o questionário de autodeclaração do estabelecimento: informe as condições atuais do local, não uma intenção futura. As respostas ajudam visitantes a planejar a visita, mas não são auditoria nem certificação. “Não sei / não se aplica” não reduz a pontuação.
            </p>
            <p className="place-questionnaire-notice" role="status" aria-live="polite">
              {id
                ? assessmentSaveStatus === 'saving'
                  ? 'Salvando resposta...'
                  : assessmentSaveStatus === 'saved'
                    ? 'Respostas salvas automaticamente. Os recursos informados também foram atualizados.'
                    : assessmentSaveStatus === 'error'
                      ? 'Não foi possível salvar automaticamente. Tente novamente ou use “Salvar alterações”.'
                      : 'Cada resposta é salva automaticamente.'
                : 'As respostas serão registradas e aplicadas aos recursos do local ao publicar o estabelecimento.'}
            </p>
            <p className="place-question-progress"><strong>{answeredQuestionCount} de {accessibilityQuestions.length}</strong> perguntas respondidas. Os primeiros itens foram priorizados para {getPlaceCategoryDetailLabel(form.category_detail) || getPlaceCategoryLabel(form.category)}.</p>
            <div className="place-question-list">
              {orderedAccessibilityQuestions.map((question) => (
                <fieldset className={`place-question${priorityKeys.includes(question.key) ? ' is-priority' : ''}`} key={question.key}>
                  <legend>{question.label}</legend>
                  <div className="place-question-options">
                    {answerOptions.map((option) => (
                      <label key={option.value}>
                        <input
                          type="radio"
                          name={question.key}
                          checked={assessment[question.key] === option.value}
                          onChange={() => updateAssessment(question.key, option.value)}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <p className="place-score-explanation">
              O nível combina a pontuação deste questionário e as avaliações de acessibilidade de viajantes (50% cada quando ambas existirem). Sem avaliações de viajantes, o resultado aparece como autodeclarado. A nota de 1 a 5 considera somente as avaliações dos viajantes.
            </p>
          </section>

          <div className="place-form-actions">
            <Link to="/dashboard">Cancelar</Link>
            <button type="submit" disabled={saving}>{saving ? 'Salvando...' : id ? 'Salvar alterações' : 'Publicar estabelecimento'}</button>
          </div>
        </form>
      </main>
    </div>
  );
}
