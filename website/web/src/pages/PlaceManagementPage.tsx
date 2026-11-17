import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { accessibilityQuestions, type AccessibilityAnswer, type AccessibilityAssessment } from '../utils/accessibilityQuestionnaire';
import { placeCategories, placeCategoryDetails } from '../utils/placeCategories';
import type { Place } from '../types';

type PlaceForm = {
  establishment_name: string;
  category: string;
  category_detail: string;
  full_address: string;
  city: string;
  state: string;
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
  state: '',
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

export function PlaceManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<PlaceForm>(emptyForm);
  const [assessment, setAssessment] = useState<AccessibilityAssessment>({});
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
          state: place.state,
          description: place.description || '',
          price: place.price == null ? '' : (place.price / 100).toFixed(2),
          main_image: place.main_image || '',
          phone: place.phone || '',
          website: place.website || '',
          opening_hours: place.opening_hours || '',
        });
        setAssessment(place.accessibility_assessment || {});
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
    try {
      if (id) await api.put(`/places/${id}`, payload);
      else await api.post('/places', payload);
      navigate('/dashboard');
    } catch (saveError: unknown) {
      const message = (saveError as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message || 'Não foi possível salvar. Revise os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="place-form-message" role="status">Carregando estabelecimento...</div>;
  }

  const categoryDetails = placeCategoryDetails[form.category] || [];

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
              <label className="place-form-field">Estado (UF)
                <input required maxLength={2} value={form.state} onChange={(event) => updateForm('state', event.target.value.toUpperCase())} />
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
            </div>
          </section>

          <section className="place-form-section">
            <div className="place-questionnaire-heading">
              <div><h2>Questionário de acessibilidade</h2><p>Responda com base nas condições atuais do local.</p></div>
              <span>Autodeclarado</span>
            </div>
            <p className="place-questionnaire-notice">
              Questionário informativo inspirado nos princípios de acessibilidade e remoção de barreiras da Lei Brasileira de Inclusão (Lei nº 13.146/2015). Não é auditoria nem certificação; “não sei / não se aplica” não reduz a pontuação. Mantenha as informações atualizadas e convide visitantes a compartilhar experiências.
            </p>
            <div className="place-question-list">
              {accessibilityQuestions.map((question) => (
                <fieldset className="place-question" key={question.key}>
                  <legend>{question.label}</legend>
                  <div className="place-question-options">
                    {answerOptions.map((option) => (
                      <label key={option.value}>
                        <input
                          type="radio"
                          name={question.key}
                          checked={assessment[question.key] === option.value}
                          onChange={() => setAssessment((current) => ({ ...current, [question.key]: option.value }))}
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
