import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api');
const api = axios.create({ baseURL: API_URL, timeout: 10000 });

type UserProfile = {
  gender?: string;
  ageRange?: string;
  travelFrequency?: string;
  companionType?: string;
  disabilities?: string[];
  interests?: string[];
  accessibilityPreferences?: string[];
  profileCompleted?: boolean;
  onboardingStep?: number;
};
type User = { id: number; email: string; full_name: string; user_type: 'TRAVELER' | 'BUSINESS'; profile?: UserProfile | null };
type AccessibilityAnswer = 'yes' | 'no' | 'unsure';
type AccessibilityAssessment = Record<string, AccessibilityAnswer>;
type ReviewAccessibilityAnswer = 'yes' | 'partially' | 'no' | 'not_applicable';
type ReviewAccessibilityDetails = Record<string, ReviewAccessibilityAnswer>;
type PlaceReview = {
  id: number;
  traveler_name: string;
  traveler_avatar?: string | null;
  experience_rating: number;
  accessibility_level: 'POOR' | 'GOOD' | 'EXCELLENT';
  comment_text?: string | null;
  accessibility_details?: ReviewAccessibilityDetails | null;
  created_at: string;
};
type Place = {
  id: number;
  establishment_name: string;
  category: string;
  category_detail?: string | null;
  city: string;
  state: string | null;
  district?: string | null;
  country?: string;
  description?: string;
  full_address?: string;
  price: number;
  main_image?: string | null;
  phone?: string | null;
  website?: string | null;
  opening_hours?: string | null;
  accessibility_assessment?: AccessibilityAssessment | null;
  photos?: PlacePhoto[];
  average_rating?: number | null;
  total_reviews?: number;
  accessibility_score?: number | null;
  accessibility_level?: 'INITIAL' | 'INTERMEDIATE' | 'ADVANCED' | null;
  questionnaire_score?: number | null;
  traveler_accessibility_score?: number | null;
  is_public?: boolean;
  has_access_ramp: boolean;
  has_adapted_bathroom: boolean;
  allows_guide_dog: boolean;
  has_braille_signage: boolean;
  has_sign_language_interpreter: boolean;
  has_asd_friendly_space: boolean;
};
type PlacePhoto = {
  id: number;
  photo_url: string;
  photo_type: 'PLACE' | 'ACCESSIBILITY';
  accessibility_category: string | null;
};
type PendingPhoto = {
  id: string;
  uri: string;
  name: string;
  mimeType: string;
  photo_type: 'PLACE' | 'ACCESSIBILITY';
  accessibility_category: string;
};
type PlaceDetailsResponse = {
  place: Place & {
    stats?: {
      average_rating: number | null;
      total_reviews: number;
    };
  };
};
type Screen = 'home' | 'login' | 'register' | 'placeForm';
type MainTab = 'home' | 'explore' | 'favorites' | 'profile';
type PlaceDraft = {
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

const categories = [
  { value: '', label: 'Todos' },
  { value: 'ACCOMMODATION', label: 'Hospedagem' },
  { value: 'GASTRONOMY', label: 'Gastronomia' },
  { value: 'TOURIST_ATTRACTION', label: 'Atrações turísticas' },
  { value: 'SHOPPING', label: 'Compras' },
  { value: 'HEALTH', label: 'Saúde e bem-estar' },
  { value: 'TRANSPORT', label: 'Transporte' },
  { value: 'EDUCATION', label: 'Educação' },
  { value: 'ENTERTAINMENT', label: 'Entretenimento' },
  { value: 'SPORTS', label: 'Esportes e lazer' },
  { value: 'RELIGIOUS_SITE', label: 'Espaços religiosos' },
  { value: 'PUBLIC_SERVICE', label: 'Serviços públicos' },
  { value: 'OTHERS', label: 'Outros' },
];
const categoryDetails: Record<string, Array<{ value: string; label: string }>> = {
  ACCOMMODATION: [{ value: 'HOTEL', label: 'Hotel' }, { value: 'HOSTEL', label: 'Hostel' }, { value: 'INN', label: 'Pousada' }, { value: 'RESORT', label: 'Resort' }, { value: 'CAMPING', label: 'Camping' }, { value: 'VACATION_RENTAL', label: 'Aluguel por temporada' }],
  GASTRONOMY: [{ value: 'RESTAURANT', label: 'Restaurante' }, { value: 'CAFE', label: 'Café' }, { value: 'BAR', label: 'Bar' }, { value: 'BAKERY', label: 'Padaria' }, { value: 'FOOD_TRUCK', label: 'Food truck' }],
  TOURIST_ATTRACTION: [{ value: 'MUSEUM', label: 'Museu' }, { value: 'PARK', label: 'Parque' }, { value: 'BEACH', label: 'Praia' }, { value: 'TRAIL', label: 'Trilha' }, { value: 'CULTURAL_SITE', label: 'Espaço cultural' }, { value: 'EVENT_VENUE', label: 'Eventos' }, { value: 'HISTORIC_SITE', label: 'Ponto histórico' }],
  SHOPPING: [{ value: 'SHOPPING_MALL', label: 'Shopping center' }, { value: 'STORE', label: 'Loja' }, { value: 'MARKET', label: 'Mercado' }, { value: 'FAIR', label: 'Feira' }],
  HEALTH: [{ value: 'CLINIC', label: 'Clínica' }, { value: 'HOSPITAL', label: 'Hospital' }, { value: 'PHARMACY', label: 'Farmácia' }, { value: 'WELLNESS', label: 'Bem-estar' }],
  TRANSPORT: [{ value: 'AIRPORT', label: 'Aeroporto' }, { value: 'BUS_STATION', label: 'Terminal rodoviário' }, { value: 'TRAIN_STATION', label: 'Estação de trem/metrô' }, { value: 'PORT', label: 'Porto' }],
  EDUCATION: [{ value: 'SCHOOL', label: 'Escola' }, { value: 'UNIVERSITY', label: 'Universidade' }, { value: 'LIBRARY', label: 'Biblioteca' }],
  ENTERTAINMENT: [{ value: 'CINEMA', label: 'Cinema' }, { value: 'THEATER', label: 'Teatro' }, { value: 'CONCERT_HALL', label: 'Casa de shows' }, { value: 'EVENT_VENUE', label: 'Espaço de eventos' }],
  SPORTS: [{ value: 'STADIUM', label: 'Estádio' }, { value: 'GYM', label: 'Academia' }, { value: 'SPORTS_CENTER', label: 'Centro esportivo' }],
  RELIGIOUS_SITE: [{ value: 'CHURCH', label: 'Igreja' }, { value: 'TEMPLE', label: 'Templo' }, { value: 'OTHER_RELIGIOUS_SITE', label: 'Outro espaço religioso' }],
  PUBLIC_SERVICE: [{ value: 'GOVERNMENT_OFFICE', label: 'Órgão público' }, { value: 'POST_OFFICE', label: 'Correios' }, { value: 'CITIZEN_SERVICE', label: 'Atendimento ao cidadão' }],
  OTHERS: [{ value: 'OTHER_SERVICE', label: 'Outro serviço' }],
};
const photoAccessibilityCategories = [
  ['ACCESS_ROUTE', 'Rota acessível'],
  ['RAMP', 'Rampa'],
  ['ENTRANCE', 'Entrada'],
  ['ADAPTED_BATHROOM', 'Banheiro adaptado'],
  ['PARKING', 'Vaga acessível'],
  ['BRAILLE', 'Braille'],
  ['SIGN_LANGUAGE', 'Libras'],
  ['GUIDE_DOG', 'Cão-guia'],
  ['SENSORY_SPACE', 'Espaço sensorial'],
  ['OTHER', 'Outro recurso'],
] as const;
const accessibilityQuestions = [
  { key: 'step_free_route', label: 'Há um caminho contínuo, sem degraus, da calçada ou vaga até a entrada e as áreas abertas aos visitantes?' },
  { key: 'accessible_entrance', label: 'A entrada permite a passagem de cadeira de rodas e de pessoas com mobilidade reduzida, sem barreiras difíceis de transpor?' },
  { key: 'access_ramp', label: 'Nos desníveis do percurso, há rampa firme e segura para chegar às áreas de atendimento e visita?' },
  { key: 'adapted_restroom', label: 'Há banheiro acessível aos visitantes, com espaço de circulação e apoios necessários?' },
  { key: 'accessible_parking', label: 'Há vaga reservada e sinalizada, ligada à entrada por uma rota acessível?' },
  { key: 'guide_dog', label: 'A pessoa pode permanecer com seu cão-guia nas áreas abertas ao público?' },
  { key: 'tactile_signage', label: 'Há sinalização tátil ou piso tátil que ajude pessoas cegas ou com baixa visão a se orientar?' },
  { key: 'braille_information', label: 'Informações importantes, como cardápio, orientações e avisos, estão disponíveis em Braille ou formato tátil?' },
  { key: 'libras_support', label: 'É possível receber atendimento em Libras ou por outro recurso de comunicação acessível?' },
  { key: 'accessible_website', label: 'Os canais digitais informam como chegar, quais recursos de acessibilidade existem e como pedir apoio?' },
  { key: 'accessible_service', label: 'A equipe oferece ajuda respeitando a autonomia e as preferências de cada visitante?' },
  { key: 'quiet_space', label: 'Há um local tranquilo onde visitantes possam fazer uma pausa quando precisarem?' },
  { key: 'asd_friendly_space', label: 'Há recursos ou um espaço preparado para acolher pessoas autistas?' },
  { key: 'sensory_support', label: 'Antes da visita, é possível saber sobre ruídos, iluminação, lotação ou outros estímulos sensoriais?' },
  { key: 'staff_training', label: 'A equipe recebe orientação para atender pessoas com diferentes deficiências e necessidades de acesso?' },
];
const reviewAccessibilityQuestions = [
  { key: 'access_route', label: 'Na sua visita, você conseguiu sair da calçada ou vaga, entrar e chegar aos espaços que precisava?' },
  { key: 'entrance_access', label: 'A porta, os desníveis e a entrada permitiram que você entrasse e saísse com autonomia?' },
  { key: 'accessible_facilities', label: 'Você conseguiu usar as áreas e instalações de que precisava, como balcão, mesas ou assentos?' },
  { key: 'restroom_access', label: 'Se precisou usar o banheiro, conseguiu chegar e utilizá-lo com segurança e autonomia?' },
  { key: 'communication', label: 'Você conseguiu acessar as informações e se comunicar da forma necessária durante a visita?' },
  { key: 'staff_support', label: 'Quando precisou de apoio, a equipe ouviu você, respeitou sua autonomia e ajudou adequadamente?' },
  { key: 'guide_dog_access', label: 'Se estava com cão-guia, ele pôde acompanhar você nas áreas abertas ao público?' },
  { key: 'sensory_comfort', label: 'Ruídos, iluminação, cheiros e lotação foram confortáveis para você durante a visita?' },
];
const reviewAnswerOptions: Array<[ReviewAccessibilityAnswer, string]> = [
  ['yes', 'Sim'],
  ['partially', 'Em parte'],
  ['no', 'Não'],
  ['not_applicable', 'Não se aplica / não consegui avaliar'],
];
const emptyPlaceDraft: PlaceDraft = {
  establishment_name: '', category: 'ACCOMMODATION', category_detail: '',
  full_address: '', city: '', district: '', state: '', country: 'Brasil', description: '', price: '',
  main_image: '', phone: '', website: '', opening_hours: '',
};

const favoriteStorageKey = (userId: number) => `TruAcessFavoritos${userId}`;
const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

// ✅ FORMATAÇÃO DE PREÇO CORRIGIDA
const formatPrice = (price: number | null | undefined): string => {
  if (price == null || price === 0 || price === 0.0) return 'Gratuito';
  return `R$ ${(price / 100).toFixed(2).replace('.', ',')}`;
};

// Verifica se é gratuito
const isFree = (price: number | null | undefined): boolean => {
  return price == null || price === 0 || price === 0.0;
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const mainScrollRef = useRef<ScrollViewInstance>(null);
  const [user, setUser] = useState<User | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [placeReviews, setPlaceReviews] = useState<PlaceReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [experienceRating, setExperienceRating] = useState(5);
  const [accessibilityRating, setAccessibilityRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAccessibilityDetails, setReviewAccessibilityDetails] = useState<ReviewAccessibilityDetails>({});
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [category, setCategory] = useState('');
  const [categoryDetail, setCategoryDetail] = useState('');
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<'TRAVELER' | 'BUSINESS'>('TRAVELER');
  const [myPlaces, setMyPlaces] = useState<Place[]>([]);
  const [linkedAccount, setLinkedAccount] = useState<Pick<User, 'id' | 'email' | 'full_name' | 'user_type'> | null>(null);
  const [linkMode, setLinkMode] = useState<'connect' | 'create' | null>(null);
  const [linkedFullName, setLinkedFullName] = useState('');
  const [linkedEmail, setLinkedEmail] = useState('');
  const [linkedPassword, setLinkedPassword] = useState('');
  const [linkedError, setLinkedError] = useState('');
  const [linkedNotice, setLinkedNotice] = useState('');
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [travelerDraft, setTravelerDraft] = useState<UserProfile>({});
  const [placeDraft, setPlaceDraft] = useState<PlaceDraft>(emptyPlaceDraft);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [placeAssessment, setPlaceAssessment] = useState<AccessibilityAssessment>({});
  const [assessmentSaveStatus, setAssessmentSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const assessmentSaveQueue = useRef<Promise<void>>(Promise.resolve());
  const assessmentSaveVersion = useRef(0);
  const [editingPlaceId, setEditingPlaceId] = useState<number | null>(null);
  const [confirmDeletePlaceId, setConfirmDeletePlaceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void loadPlaces();
    void restoreSession();
  }, []);

  useEffect(() => {
    if (user) void loadFavorites(user.id);
    else setFavorites([]);
  }, [user]);

  useEffect(() => {
    const placeId = selectedPlace?.id;
    if (!placeId) {
      setPlaceReviews([]);
      setReviewError('');
      setReviewFormOpen(false);
      return;
    }

    let active = true;
    setReviewsLoading(true);
    setReviewError('');
    void api.get<{ reviews: PlaceReview[] }>(`/places/${placeId}/reviews`)
      .then((response) => {
        if (active) setPlaceReviews(response.data.reviews);
      })
      .catch((loadError: unknown) => {
        console.error('Erro ao carregar avaliações do local:', loadError);
        if (active) setReviewError('Não foi possível carregar os comentários. Tente novamente.');
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
      });

    return () => { active = false; };
  }, [selectedPlace?.id]);

  useEffect(() => {
    const placeId = selectedPlace?.id;
    if (!placeId) return;
    let active = true;
    void api.get<PlaceDetailsResponse>(`/places/${placeId}`)
      .then(({ data }) => {
        if (active) setSelectedPlace((current) => current?.id === placeId ? data.place : current);
      })
      .catch((loadError: unknown) => {
        console.error('Erro ao carregar fotos e detalhes do local:', loadError);
      });
    return () => { active = false; };
  }, [selectedPlace?.id]);

  useEffect(() => {
    if (user?.user_type !== 'BUSINESS') {
      setMyPlaces([]);
      return;
    }
    let active = true;
    void SecureStore.getItemAsync('TruAcessToken').then(async (token) => {
      if (!token) throw new Error('Sessão expirada. Entre novamente.');
      const response = await api.get<{ places: Place[] }>('/business/places', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (active) setMyPlaces(response.data.places);
    }).catch((loadError: unknown) => {
      if (active) {
        console.error('Erro ao carregar locais da empresa:', loadError);
        setError('Não foi possível carregar seus estabelecimentos.');
      }
    });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLinkedAccount(null);
      setTravelerDraft({});
      return;
    }
    setTravelerDraft(user.profile || {});
    let active = true;
    void SecureStore.getItemAsync('TruAcessToken').then((token) => {
      if (!token) throw new Error('Sessão expirada.');
      return api.get<{ account: typeof linkedAccount }>('/users/linked-account', {
        headers: { Authorization: 'Bearer ' + token },
      });
    }).then(({ data }) => {
      if (active) {
        setLinkedAccount(data.account);
        setLinkedError('');
      }
    }).catch((loadError: unknown) => {
      console.error('Erro ao carregar conta conectada:', loadError);
      if (active) setLinkedError('Não foi possível verificar se há outro perfil conectado.');
    });
    return () => { active = false; };
  }, [user?.id]);

  const loadPlaces = async () => {
    setPlacesLoading(true);
    try {
      const res = await api.get<any>('/places', { params: { limit: 100 } });
      const data = res.data;
      const placesArray = Array.isArray(data) ? data : (data.places || []);
      console.log('📍 Locais carregados:', placesArray.length);
      placesArray.forEach((p: any) => {
        console.log(`- ${p.establishment_name} | Preço: ${p.price} | Formatado: ${formatPrice(p.price)} | Público: ${p.is_public}`);
      });
      setPlaces(placesArray);
      setError('');
    } catch (err: any) {
      console.error('❌ Erro ao carregar locais:', err.message);
      setError('Não foi possível carregar os locais. Verifique se a API está em execução e tente novamente.');
    } finally {
      setPlacesLoading(false);
    }
  };

  const restoreSession = async () => {
    try {
      const token = await SecureStore.getItemAsync('TruAcessToken');
      if (!token) return;
      const res = await api.get<any>('/auth/me', { headers: { Authorization: 'Bearer ' + token } });
      setUser(res.data.user || res.data);
      await SecureStore.setItemAsync('TruAcessUser', JSON.stringify(res.data.user || res.data));
    } catch {
      await SecureStore.deleteItemAsync('TruAcessToken');
      await SecureStore.deleteItemAsync('TruAcessUser');
    }
  };

  const loadFavorites = async (userId: number) => {
    try {
      const saved = await AsyncStorage.getItem(favoriteStorageKey(userId));
      setFavorites(saved ? JSON.parse(saved) : []);
    } catch {}
  };

  const filteredPlaces = useMemo(() => {
    const q = search.trim().toLowerCase();
    return places.filter((p) => {
      const matchCat = !category || p.category === category;
      const matchDetail = !categoryDetail || p.category_detail === categoryDetail;
      const matchSearch = !q || [p.establishment_name, p.city, p.district || '', p.state || '', p.country || '', p.category_detail || ''].some(v => v.toLowerCase().includes(q));
      const matchFav = !showFavorites || favorites.includes(p.id);
      return matchCat && matchDetail && matchSearch && matchFav;
    });
  }, [category, categoryDetail, favorites, places, search, showFavorites]);

  const toggleFavorite = async (placeId: number) => {
    if (!user) { setNotice('Faça login para salvar.'); setScreen('login'); return; }
    const next = favorites.includes(placeId) ? favorites.filter(id => id !== placeId) : [...favorites, placeId];
    setFavorites(next);
    await AsyncStorage.setItem(favoriteStorageKey(user.id), JSON.stringify(next));
  };

  const submitPlaceReview = async () => {
    if (!selectedPlace) return;
    if (!user || user.user_type !== 'TRAVELER') {
      setReviewError(user ? 'Somente contas de viajante podem avaliar locais.' : 'Entre na sua conta de viajante para avaliar este local.');
      return;
    }

    setReviewSubmitting(true);
    setReviewError('');
    try {
      const token = await SecureStore.getItemAsync('TruAcessToken');
      if (!token) throw new Error('Sua sessão expirou. Entre novamente para avaliar.');
      const response = await api.post<{ review: PlaceReview }>(`/places/${selectedPlace.id}/reviews`, {
        experience_rating: experienceRating,
        accessibility_level: accessibilityRating >= 5 ? 'EXCELLENT' : accessibilityRating >= 3 ? 'GOOD' : 'POOR',
        accessibility_details: reviewAccessibilityDetails,
        comment_text: reviewComment.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } });

      setPlaceReviews((current) => [response.data.review, ...current]);
      setReviewComment('');
      setReviewAccessibilityDetails({});
      setExperienceRating(5);
      setAccessibilityRating(5);
      setReviewFormOpen(false);
      setSelectedPlace((current) => current ? { ...current, total_reviews: (current.total_reviews || 0) + 1 } : current);

      try {
        const updated = await api.get<PlaceDetailsResponse>(`/places/${selectedPlace.id}`);
        const refreshedPlace = {
          ...updated.data.place,
          average_rating: updated.data.place.stats?.average_rating ?? null,
          total_reviews: updated.data.place.stats?.total_reviews ?? placeReviews.length + 1,
        };
        setSelectedPlace((current) => current?.id === selectedPlace.id ? refreshedPlace : current);
      } catch (refreshError: unknown) {
        console.error('Comentário publicado, mas não foi possível atualizar o nivelador:', refreshError);
        setReviewError('Comentário publicado. O nivelador será atualizado quando os dados forem carregados novamente.');
      }
    } catch (submitError: unknown) {
      console.error('Erro ao publicar comentário:', submitError);
      setReviewError(axios.isAxiosError(submitError)
        ? submitError.response?.data?.message || 'Não foi possível publicar seu comentário. Tente novamente.'
        : submitError instanceof Error ? submitError.message : 'Não foi possível publicar seu comentário. Tente novamente.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) { setError('Informe seu e-mail.'); return; }
    if (!emailPattern.test(email.trim())) { setError('Informe um e-mail válido.'); return; }
    if (!password) { setError('Informe sua senha.'); return; }

    setLoading(true); setError(''); setNotice('');
    try {
      const res = await api.post<any>('/auth/login', { email, password });
      await SecureStore.setItemAsync('TruAcessToken', res.data.token);
      await SecureStore.setItemAsync('TruAcessUser', JSON.stringify(res.data.user || res.data));
      setUser(res.data.user || res.data);
      setPassword(''); setScreen('home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'E-mail ou senha incorretos.');
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!fullName.trim()) { setError('Informe seu nome.'); return; }
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true); setError(''); setNotice('');
    try {
      const res = await api.post<any>('/auth/register', { full_name: fullName.trim(), email, password, user_type: accountType });
      await SecureStore.setItemAsync('TruAcessToken', res.data.token);
      await SecureStore.setItemAsync('TruAcessUser', JSON.stringify(res.data.user || res.data));
      setUser(res.data.user || res.data);
      setPassword(''); setScreen('home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta.');
    } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('TruAcessToken');
    await SecureStore.deleteItemAsync('TruAcessUser');
    setUser(null); setFavorites([]); setShowFavorites(false); setSelectedPlace(null);
    setActiveTab('home');
    setNotice('Você saiu da conta.');
  };

  const submitLinkedAccount = async () => {
    if (!linkedEmail.trim() || !linkedPassword) {
      setLinkedError('Informe e-mail e senha do perfil.');
      return;
    }
    if (linkMode === 'create' && !linkedFullName.trim()) {
      setLinkedError('Informe o nome para criar o outro perfil.');
      return;
    }
    setLoading(true);
    setLinkedError('');
    setLinkedNotice('');
    try {
      const token = await SecureStore.getItemAsync('TruAcessToken');
      if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
      const response = linkMode === 'connect'
        ? await api.post<{ account: NonNullable<typeof linkedAccount>; message: string }>('/users/linked-account/connect', {
            email: linkedEmail, password: linkedPassword,
          }, { headers: { Authorization: 'Bearer ' + token } })
        : await api.post<{ account: NonNullable<typeof linkedAccount>; message: string }>('/users/linked-account/create', {
            full_name: linkedFullName.trim(), email: linkedEmail, password: linkedPassword,
          }, { headers: { Authorization: 'Bearer ' + token } });
      setLinkedAccount(response.data.account);
      setLinkedNotice(response.data.message);
      setLinkMode(null);
      setLinkedFullName('');
      setLinkedEmail('');
      setLinkedPassword('');
    } catch (linkError: unknown) {
      console.error('Erro ao conectar perfis:', linkError);
      setLinkedError(axios.isAxiosError(linkError)
        ? linkError.response?.data?.message || linkError.response?.data?.error || 'Não foi possível conectar os perfis.'
        : linkError instanceof Error ? linkError.message : 'Não foi possível conectar os perfis.');
    } finally {
      setLoading(false);
    }
  };

  const switchLinkedAccount = async () => {
    setLoading(true);
    setLinkedError('');
    try {
      const token = await SecureStore.getItemAsync('TruAcessToken');
      if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
      const response = await api.post<{ token: string; user: User }>('/users/linked-account/switch', {}, {
        headers: { Authorization: 'Bearer ' + token },
      });
      await SecureStore.setItemAsync('TruAcessToken', response.data.token);
      await SecureStore.setItemAsync('TruAcessUser', JSON.stringify(response.data.user));
      setUser(response.data.user);
      setActiveTab('profile');
      setNotice(`Perfil alterado para ${response.data.user.user_type === 'BUSINESS' ? 'estabelecimento' : 'viajante'}.`);
    } catch (switchError: unknown) {
      console.error('Erro ao alternar perfil:', switchError);
      setLinkedError(axios.isAxiosError(switchError)
        ? switchError.response?.data?.message || 'Não foi possível alternar o perfil.'
        : switchError instanceof Error ? switchError.message : 'Não foi possível alternar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  const unlinkAccount = async () => {
    setLoading(true);
    setLinkedError('');
    try {
      const token = await SecureStore.getItemAsync('TruAcessToken');
      if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
      await api.delete('/users/linked-account', { headers: { Authorization: 'Bearer ' + token } });
      setLinkedAccount(null);
      setLinkedNotice('Os perfis foram desconectados.');
    } catch (unlinkError: unknown) {
      console.error('Erro ao desconectar perfis:', unlinkError);
      setLinkedError(axios.isAxiosError(unlinkError)
        ? unlinkError.response?.data?.message || 'Não foi possível desconectar os perfis.'
        : unlinkError instanceof Error ? unlinkError.message : 'Não foi possível desconectar os perfis.');
    } finally {
      setLoading(false);
    }
  };

  const saveTravelerProfile = async () => {
    setLoading(true);
    setLinkedError('');
    try {
      const token = await SecureStore.getItemAsync('TruAcessToken');
      if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
      const profile = { ...user?.profile, ...travelerDraft };
      const response = await api.put<{ user: User }>('/users/profile', { profile }, {
        headers: { Authorization: 'Bearer ' + token },
      });
      setUser(response.data.user);
      await SecureStore.setItemAsync('TruAcessUser', JSON.stringify(response.data.user));
      setProfileEditOpen(false);
      setNotice('Perfil do viajante atualizado.');
    } catch (profileError: unknown) {
      console.error('Erro ao salvar perfil do viajante:', profileError);
      setLinkedError(axios.isAxiosError(profileError)
        ? profileError.response?.data?.message || 'Não foi possível salvar as informações do viajante.'
        : profileError instanceof Error ? profileError.message : 'Não foi possível salvar as informações do viajante.');
    } finally {
      setLoading(false);
    }
  };

  const openExplore = (selectedCategory = '') => {
    setActiveTab('explore');
    setShowFavorites(false);
    setSearch('');
    setCategory(selectedCategory);
    setCategoryDetail('');
    requestAnimationFrame(() => mainScrollRef.current?.scrollTo({ y: 0, animated: true }));
  };

  const handleTabPress = (tab: MainTab) => {
    if (tab === 'favorites' && !user) {
      setNotice('Entre na sua conta para acessar seus favoritos.');
      setScreen('login');
      return;
    }

    if (tab === 'profile' && !user) {
      setNotice('Entre na sua conta para acessar seu perfil.');
      setScreen('login');
      return;
    }

    if (tab === 'explore') {
      openExplore();
      return;
    }

    setActiveTab(tab);
    setShowFavorites(tab === 'favorites');
    if (tab === 'home') {
      setSearch('');
      setCategory('');
      setCategoryDetail('');
      requestAnimationFrame(() => mainScrollRef.current?.scrollTo({ y: 0, animated: true }));
    }
  };

  const startNewPlace = () => {
    setEditingPlaceId(null);
    setPlaceDraft(emptyPlaceDraft);
    setPendingPhotos([]);
    setPlaceAssessment({});
    setAssessmentSaveStatus('idle');
    setError('');
    setScreen('placeForm');
  };

  const startEditPlace = (place: Place) => {
    setEditingPlaceId(place.id);
    setPlaceDraft({
      establishment_name: place.establishment_name,
      category: place.category,
      category_detail: place.category_detail || '',
      full_address: place.full_address || '',
      city: place.city,
      district: place.district || '',
      state: place.state || '',
      country: place.country || 'Brasil',
      description: place.description || '',
      price: place.price ? (place.price / 100).toFixed(2) : '',
      main_image: place.main_image || '',
      phone: place.phone || '',
      website: place.website || '',
      opening_hours: place.opening_hours || '',
    });
    setPendingPhotos([]);
    setPlaceAssessment(place.accessibility_assessment || {});
    setAssessmentSaveStatus('idle');
    setError('');
    setScreen('placeForm');
  };

  const pickPlacePhotos = async (photoType: PendingPhoto['photo_type']) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Permita o acesso às fotos para selecionar imagens.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (result.canceled) return;
    const selected = result.assets.map((asset, index): PendingPhoto => ({
      id: `${Date.now()}-${index}-${asset.uri}`,
      uri: asset.uri,
      name: asset.fileName || `foto-${Date.now()}-${index}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
      photo_type: photoType,
      accessibility_category: 'RAMP',
    }));
    setPendingPhotos((current) => [...current, ...selected]);
    setError('');
  };

  const updatePlaceAssessment = (key: string, answer: AccessibilityAnswer) => {
    const nextAssessment = { ...placeAssessment, [key]: answer };
    setPlaceAssessment(nextAssessment);
    if (!editingPlaceId) return;

    const version = ++assessmentSaveVersion.current;
    setAssessmentSaveStatus('saving');
    const saveRequest = assessmentSaveQueue.current.then(async () => {
      const token = await SecureStore.getItemAsync('TruAcessToken');
      if (!token) throw new Error('Sua sessão expirou. Entre novamente para salvar as respostas.');
      await api.put(`/places/${editingPlaceId}`, { accessibility_assessment: nextAssessment }, {
        headers: { Authorization: 'Bearer ' + token },
      });
    });
    assessmentSaveQueue.current = saveRequest.then(() => undefined, () => undefined);
    void saveRequest.then(() => {
      if (version === assessmentSaveVersion.current) {
        setAssessmentSaveStatus('saved');
        setError('');
      }
    }).catch((saveError: unknown) => {
      console.error('Erro ao salvar resposta do questionário:', saveError);
      if (version === assessmentSaveVersion.current) {
        setAssessmentSaveStatus('error');
        setError(axios.isAxiosError(saveError)
          ? saveError.response?.data?.message || 'Não foi possível salvar a resposta automaticamente.'
          : saveError instanceof Error ? saveError.message : 'Não foi possível salvar a resposta automaticamente.');
      }
    });
  };

  const savePlace = async () => {
    if (!placeDraft.establishment_name.trim() || !placeDraft.full_address.trim() || !placeDraft.city.trim() || !placeDraft.country.trim()) {
      setError('Preencha nome, endereço, cidade e país.');
      return;
    }
    const price = placeDraft.price.trim() ? Number(placeDraft.price.replace(',', '.')) : null;
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      setError('Informe um preço válido ou deixe o campo em branco.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = await SecureStore.getItemAsync('TruAcessToken');
      if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
      const payload = {
        ...placeDraft,
        establishment_name: placeDraft.establishment_name.trim(),
        full_address: placeDraft.full_address.trim(),
        city: placeDraft.city.trim(),
        district: placeDraft.district.trim(),
        state: placeDraft.state.trim() || null,
        country: placeDraft.country.trim(),
        price: price === null ? null : Math.round(price * 100),
        accessibility_assessment: placeAssessment,
      };
      const config = { headers: { Authorization: 'Bearer ' + token } };
      const saved = editingPlaceId
        ? await api.put<{ place: Place }>(`/places/${editingPlaceId}`, payload, config)
        : await api.post<{ place: Place }>('/places', payload, config);
      const savedPlaceId = saved.data.place.id;
      setEditingPlaceId(savedPlaceId);
      for (const photo of pendingPhotos) {
        const formData = new FormData();
        const imageBlob = await (await fetch(photo.uri)).blob();
        formData.append('photo', imageBlob, photo.name);
        formData.append('photo_type', photo.photo_type);
        if (photo.photo_type === 'ACCESSIBILITY') {
          formData.append('accessibility_category', photo.accessibility_category);
        }
        await api.post(`/places/${savedPlaceId}/photos`, formData, config);
        setPendingPhotos((current) => current.filter((item) => item.id !== photo.id));
      }
      const response = await api.get<{ places: Place[] }>('/business/places', config);
      setMyPlaces(response.data.places);
      setScreen('home');
      setActiveTab('profile');
      setNotice(editingPlaceId ? 'Estabelecimento atualizado.' : 'Estabelecimento publicado.');
    } catch (saveError: any) {
      setError(saveError.response?.data?.message || saveError.message || 'Não foi possível salvar o estabelecimento.');
    } finally {
      setLoading(false);
    }
  };

  const deletePlace = async (placeId: number) => {
    try {
      const token = await SecureStore.getItemAsync('TruAcessToken');
      if (!token) throw new Error('Sua sessão expirou. Entre novamente.');
      await api.delete(`/places/${placeId}`, { headers: { Authorization: 'Bearer ' + token } });
      setMyPlaces((current) => current.filter((place) => place.id !== placeId));
      setNotice('Estabelecimento removido.');
    } catch (deleteError: any) {
      setError(deleteError.response?.data?.message || deleteError.message || 'Não foi possível excluir o estabelecimento.');
    }
  };

  const renderPlaceCard = (place: Place) => {
    const free = isFree(place.price);
    const isPublic = place.is_public === true;
    return (
      <Pressable key={place.id} onPress={() => setSelectedPlace(place)} style={styles.card}>
        <View style={styles.cardImageContainer}>
          {place.main_image ? (
            <Image source={{ uri: place.main_image }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={styles.cardImagePlaceholder}>
              <Ionicons name="image-outline" size={40} color="#CBD5E1" />
              <Text style={styles.cardImagePlaceholderText}>Sem foto</Text>
            </View>
          )}
          {(free || isPublic) && (
            <View style={styles.cardBadges}>
              {free && <View style={styles.cardBadgeFree}><Text style={styles.cardBadgeFreeText}>Grátis</Text></View>}
              {isPublic && <View style={styles.cardBadgePublic}><Text style={styles.cardBadgePublicText}>Público</Text></View>}
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardCat}>
              {place.category_detail
                ? `${categories.find((item) => item.value === place.category)?.label || place.category} · ${place.category_detail.replaceAll('_', ' ')}`
                : categories.find((item) => item.value === place.category)?.label || place.category}
            </Text>
            <Pressable onPress={(event) => { event.stopPropagation(); void toggleFavorite(place.id); }}>
              <Ionicons name={favorites.includes(place.id) ? 'heart' : 'heart-outline'} size={22} color={favorites.includes(place.id) ? '#EF4444' : '#94A3B8'} />
            </Pressable>
          </View>
          <Text style={styles.cardName}>{place.establishment_name}</Text>
          <Text style={styles.mobilePlaceRating}>
            {place.average_rating == null ? 'Sem avaliações' : `★ ${place.average_rating.toFixed(1)} (${place.total_reviews || 0})`}
            {place.accessibility_score == null ? '' : ` · ${place.accessibility_score}% ${place.accessibility_level === 'ADVANCED' ? 'Avançado' : place.accessibility_level === 'INTERMEDIATE' ? 'Intermediário' : 'Inicial'}`}
          </Text>
          <View style={styles.locRow}>
            <Ionicons name="location" size={14} color="#64748B" />
            <Text style={styles.locText}>{[place.district, place.city, place.state, place.country].filter(Boolean).join(', ')}</Text>
          </View>
          <Text style={[styles.cardPrice, free && styles.cardPriceFree]}>{formatPrice(place.price)}</Text>
          {place.description ? <Text numberOfLines={2} style={styles.desc}>{place.description}</Text> : null}
          <View style={styles.cardFooter}><Text style={styles.seeMore}>Ver detalhes ›</Text></View>
        </View>
      </Pressable>
    );
  };

  // --- TELA DE AUTENTICAÇÃO ---
  if (screen === 'login' || screen === 'register') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.authCard}>
            <Text style={styles.logoText}>Tru<Text style={styles.logoAccent}>Acess</Text></Text>
            <Text style={styles.authTitle}>{screen === 'login' ? 'Bem-vindo!' : 'Crie sua conta'}</Text>

            {notice ? <View style={styles.noticeBox}><Text style={styles.noticeText}>{notice}</Text></View> : null}
            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            {screen === 'register' && (
              <>
                <View style={styles.inputWrap}>
                  <Ionicons name="person" size={20} color="#94A3B8" />
                  <TextInput value={fullName} onChangeText={setFullName} placeholder="Nome completo" style={styles.input} />
                </View>
                <Text style={styles.formLabel}>Tipo de conta</Text>
                <View style={styles.roleChoiceRow}>
                  {(['TRAVELER', 'BUSINESS'] as const).map((type) => (
                    <Pressable key={type} onPress={() => setAccountType(type)} style={[styles.roleChoice, accountType === type && styles.roleChoiceActive]}>
                      <Text style={[styles.roleChoiceText, accountType === type && styles.roleChoiceTextActive]}>{type === 'TRAVELER' ? 'Viajante' : 'Estabelecimento'}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <View style={styles.inputWrap}>
              <Ionicons name="mail" size={20} color="#94A3B8" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="E-mail"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed" size={20} color="#94A3B8" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={screen === 'login' ? 'Senha' : 'Senha (mín. 6)'}
                style={styles.input}
                secureTextEntry
                autoComplete={screen === 'login' ? 'current-password' : 'new-password'}
                textContentType={screen === 'login' ? 'password' : 'newPassword'}
              />
            </View>

            <Pressable onPress={() => screen === 'login' ? handleLogin() : handleRegister()} disabled={loading} style={[styles.primaryBtn, loading && styles.disabledBtn]}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>{screen === 'login' ? 'Entrar' : 'Cadastrar'}</Text>}
            </Pressable>

            <Pressable onPress={() => { setError(''); setNotice(''); setScreen(screen === 'login' ? 'register' : 'login'); }} style={styles.switchBtn}>
              <Text style={styles.switchBtnText}>{screen === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}</Text>
            </Pressable>

            <Pressable
              onPress={() => { setScreen('home'); setError(''); setNotice(''); }}
              accessibilityRole="button"
              accessibilityLabel="Voltar para o início"
              style={({ pressed }) => [styles.authBackBtn, pressed && styles.authBackBtnPressed]}
            >
              <Ionicons name="arrow-back" size={18} color="#052659" />
              <Text style={styles.authBackBtnText}>Voltar para o início</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screen === 'placeForm') {
    const categoryOptions = categories.filter((item) => item.value);
    const detailOptions = categoryDetails[placeDraft.category] || [];
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.placeFormContainer} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => { setError(''); setScreen('home'); setActiveTab('profile'); }} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={16} color="#64748B" />
            <Text style={styles.backBtnText}>Voltar ao perfil</Text>
          </Pressable>
          <Text style={styles.placeFormTitle}>{editingPlaceId ? 'Editar estabelecimento' : 'Novo estabelecimento'}</Text>
          <Text style={styles.placeFormIntro}>Preencha os detalhes para viajantes encontrarem e planejarem a visita.</Text>
          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          <Text style={styles.formLabel}>Nome do estabelecimento *</Text>
          <TextInput value={placeDraft.establishment_name} onChangeText={(value) => setPlaceDraft((current) => ({ ...current, establishment_name: value }))} placeholder="Ex.: Pousada ..." style={styles.formInput} />
          <Text style={styles.formLabel}>Categoria</Text>
          <View style={styles.formChoiceWrap}>
            {categoryOptions.map((item) => (
              <Pressable key={item.value} onPress={() => setPlaceDraft((current) => ({ ...current, category: item.value, category_detail: '' }))} style={[styles.formChoice, placeDraft.category === item.value && styles.formChoiceActive]}>
                <Text style={[styles.formChoiceText, placeDraft.category === item.value && styles.formChoiceTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.formLabel}>Tipo de local</Text>
          <View style={styles.formChoiceWrap}>
            {detailOptions.map((item) => (
              <Pressable key={item.value} onPress={() => setPlaceDraft((current) => ({ ...current, category_detail: item.value }))} style={[styles.formChoice, placeDraft.category_detail === item.value && styles.formChoiceActive]}>
                <Text style={[styles.formChoiceText, placeDraft.category_detail === item.value && styles.formChoiceTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          {([
            ['full_address', 'Endereço completo *'],
            ['city', 'Cidade *'],
            ['district', 'Bairro / distrito'],
            ['state', 'Estado / província / região'],
            ['country', 'País *'],
            ['phone', 'Telefone'],
            ['website', 'Site'],
            ['opening_hours', 'Horário de funcionamento'],
            ['price', 'Preço aproximado em reais'],
            ['main_image', 'Link da foto principal'],
          ] as Array<[keyof PlaceDraft, string]>).map(([field, label]) => (
            <View key={field}>
              <Text style={styles.formLabel}>{label}</Text>
              <TextInput
                value={placeDraft[field]}
                onChangeText={(value) => setPlaceDraft((current) => ({ ...current, [field]: value }))}
                placeholder={field === 'website' || field === 'main_image' ? 'https://' : ''}
                keyboardType={field === 'phone' ? 'phone-pad' : field === 'price' ? 'decimal-pad' : 'default'}
                autoCapitalize={field === 'website' || field === 'main_image' ? 'none' : 'sentences'}
                style={styles.formInput}
              />
            </View>
          ))}
          <Text style={styles.formLabel}>Descrição</Text>
          <TextInput value={placeDraft.description} onChangeText={(value) => setPlaceDraft((current) => ({ ...current, description: value }))} placeholder="Conte o que visitantes precisam saber" multiline style={[styles.formInput, styles.formTextArea]} />

          <View style={styles.questionnaireCard}>
            <Text style={styles.sectionTitle}>Fotos do local e de acessibilidade</Text>
            <Text style={styles.questionnaireNotice}>Envie quantas fotos precisar. Para cada evidência, escolha o recurso que ela mostra. Fotos não alteram a pontuação automaticamente.</Text>
            <View style={styles.formChoiceWrap}>
              <Pressable onPress={() => void pickPlacePhotos('PLACE')} style={styles.formChoice}>
                <Text style={styles.formChoiceText}>Adicionar fotos do local</Text>
              </Pressable>
              <Pressable onPress={() => void pickPlacePhotos('ACCESSIBILITY')} style={styles.formChoice}>
                <Text style={styles.formChoiceText}>Adicionar evidências</Text>
              </Pressable>
            </View>
            {pendingPhotos.map((photo) => (
              <View key={photo.id} style={styles.pendingPhoto}>
                <Image source={{ uri: photo.uri }} style={styles.pendingPhotoImage} />
                <View style={styles.pendingPhotoInfo}>
                  <Text style={styles.pendingPhotoName} numberOfLines={1}>{photo.name}</Text>
                  {photo.photo_type === 'ACCESSIBILITY' ? (
                    <View style={styles.formChoiceWrap}>
                      {photoAccessibilityCategories.map(([value, label]) => (
                        <Pressable key={value} onPress={() => setPendingPhotos((current) => current.map((item) => item.id === photo.id ? { ...item, accessibility_category: value } : item))} style={[styles.formChoice, photo.accessibility_category === value && styles.formChoiceActive]}>
                          <Text style={[styles.formChoiceText, photo.accessibility_category === value && styles.formChoiceTextActive]}>{label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : <Text style={styles.questionnaireNotice}>Foto geral do local</Text>}
                  <Pressable onPress={() => setPendingPhotos((current) => current.filter((item) => item.id !== photo.id))}>
                    <Text style={styles.removePhotoText}>Remover foto</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.questionnaireCard}>
            <Text style={styles.sectionTitle}>Autoavaliação do estabelecimento</Text>
            <Text style={styles.questionnaireNotice}>Este questionário é uma autodeclaração do estabelecimento: informe as condições atuais do local, não uma intenção futura. As respostas ajudam visitantes a planejar a visita e não são auditoria nem certificação.</Text>
            <Text style={styles.questionnaireNotice}>
              {editingPlaceId
                ? assessmentSaveStatus === 'saving'
                  ? 'Salvando resposta...'
                  : assessmentSaveStatus === 'saved'
                    ? 'Respostas salvas automaticamente. Os recursos informados também foram atualizados.'
                    : assessmentSaveStatus === 'error'
                      ? 'Não foi possível salvar automaticamente. Tente novamente ou toque em “Salvar alterações”.'
                      : 'Cada resposta é salva automaticamente.'
                : 'As respostas serão registradas e aplicadas aos recursos do local ao publicar o estabelecimento.'}
            </Text>
            {accessibilityQuestions.map((question) => (
              <View key={question.key} style={styles.mobileQuestion}>
                <Text style={styles.mobileQuestionText}>{question.label}</Text>
                <View style={styles.formChoiceWrap}>
                  {([
                    ['yes', 'Sim'],
                    ['no', 'Não'],
                    ['unsure', 'Não sei / N/A'],
                  ] as Array<[AccessibilityAnswer, string]>).map(([answer, label]) => (
                    <Pressable key={answer} onPress={() => updatePlaceAssessment(question.key, answer)} style={[styles.formChoice, placeAssessment[question.key] === answer && styles.formChoiceActive]}>
                      <Text style={[styles.formChoiceText, placeAssessment[question.key] === answer && styles.formChoiceTextActive]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
            <Text style={styles.questionnaireNotice}>O nível usa 50% do questionário e 50% das avaliações de acessibilidade dos viajantes, quando ambas existirem. A nota de 1 a 5 considera as avaliações dos viajantes.</Text>
          </View>
          <Pressable onPress={() => void savePlace()} disabled={loading} style={[styles.primaryBtn, loading && styles.disabledBtn]}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>{editingPlaceId ? 'Salvar alterações' : 'Publicar estabelecimento'}</Text>}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- TELA DE DETALHES ---
  if (selectedPlace) {
    const hasAnyAccessibility =
      selectedPlace.has_access_ramp ||
      selectedPlace.has_adapted_bathroom ||
      selectedPlace.allows_guide_dog ||
      selectedPlace.has_braille_signage ||
      selectedPlace.has_sign_language_interpreter ||
      selectedPlace.has_asd_friendly_space;

    const placeCategoryLabel = categories.find(c => c.value === selectedPlace.category)?.label || selectedPlace.category;
    const free = isFree(selectedPlace.price);
    const isPublic = selectedPlace.is_public === true;
    const accessibilityLevelLabel = selectedPlace.accessibility_level === 'INITIAL' ? 'Inicial' :
      selectedPlace.accessibility_level === 'INTERMEDIATE' ? 'Intermediário' :
        selectedPlace.accessibility_level === 'ADVANCED' ? 'Avançado' : 'Sem dados';

    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.detailsHeader}>
            <Pressable onPress={() => setSelectedPlace(null)} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Voltar para destinos">
              <Ionicons name="arrow-back" size={24} color="#052659" />
            </Pressable>
            <View style={styles.detailsCategoryPill}>
              <Text numberOfLines={1} style={styles.detailsCategory}>{placeCategoryLabel}</Text>
            </View>
            <Pressable
              onPress={() => void toggleFavorite(selectedPlace.id)}
              style={styles.detailsFavoriteButton}
              accessibilityRole="button"
              accessibilityLabel={favorites.includes(selectedPlace.id) ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            >
              <Ionicons name={favorites.includes(selectedPlace.id) ? 'heart' : 'heart-outline'} size={20} color={favorites.includes(selectedPlace.id) ? '#D92D20' : '#052659'} />
            </Pressable>
          </View>

          <View style={styles.detailsImageContainer}>
            {selectedPlace.main_image ? (
              <Image
                source={{ uri: selectedPlace.main_image }}
                style={styles.detailsImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.detailsImagePlaceholder}>
                <Ionicons name="image-outline" size={64} color="#CBD5E1" />
                <Text style={styles.detailsImageText}>Sem foto disponível</Text>
              </View>
            )}
          </View>

          <View style={styles.detailsContent}>
            <Text style={styles.detailsTitle}>{selectedPlace.establishment_name}</Text>
            <View style={styles.locRow}>
              <Ionicons name="location" size={16} color="#64748B" />
              <Text style={styles.locText}>{selectedPlace.full_address || [selectedPlace.district, selectedPlace.city, selectedPlace.state, selectedPlace.country].filter(Boolean).join(', ')}</Text>
            </View>

            {/* ✅ BADGES: GRATUITO E PÚBLICO */}
            {(free || isPublic) && (
              <View style={styles.badgesRow}>
                {free && (
                  <View style={styles.badgeFree}>
                    <Ionicons name="gift" size={14} color="#059669" />
                    <Text style={styles.badgeFreeText}>Gratuito</Text>
                  </View>
                )}
                {isPublic && (
                  <View style={styles.badgePublic}>
                    <Ionicons name="globe" size={14} color="#0284C7" />
                    <Text style={styles.badgePublicText}>Espaço Público</Text>
                  </View>
                )}
              </View>
            )}

            {/* CARD DE RESUMO */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumo</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Categoria</Text>
                <Text style={styles.summaryValue}>{placeCategoryLabel}</Text>
              </View>
              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Preço</Text>
                <Text style={free ? styles.summaryPriceFree : styles.summaryPrice}>
                  {formatPrice(selectedPlace.price)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Avaliações</Text>
                <Text style={styles.summaryValue}>{selectedPlace.total_reviews || 0}</Text>
              </View>
              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Acessibilidade</Text>
                <View style={styles.accessibilityRating}>
                  <Ionicons name="accessibility" size={16} color="#2AC2D2" />
                  <Text style={styles.accessibilityScore}>
                    {selectedPlace.accessibility_score == null ? 'Sem dados' : `${selectedPlace.accessibility_score}% · ${accessibilityLevelLabel}`}
                  </Text>
                </View>
              </View>
              <View
                style={styles.levelTrack}
                accessibilityRole="progressbar"
                accessibilityValue={{
                  min: 0,
                  max: 100,
                  now: selectedPlace.accessibility_score ?? 0,
                  text: selectedPlace.accessibility_score == null ? 'Sem dados' : `${selectedPlace.accessibility_score}% · ${accessibilityLevelLabel}`,
                }}
              >
                <View style={[
                  styles.levelFill,
                  selectedPlace.accessibility_score == null && styles.levelFillEmpty,
                  selectedPlace.accessibility_score != null && { width: `${selectedPlace.accessibility_score}%` },
                ]} />
              </View>
              <View style={styles.levelLabels}>
                <Text style={[styles.levelLabel, selectedPlace.accessibility_level === 'INITIAL' && styles.levelLabelActive]}>Inicial</Text>
                <Text style={[styles.levelLabel, selectedPlace.accessibility_level === 'INTERMEDIATE' && styles.levelLabelActive]}>Intermediário</Text>
                <Text style={[styles.levelLabel, selectedPlace.accessibility_level === 'ADVANCED' && styles.levelLabelActive]}>Avançado</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informações do local</Text>
              <Text style={styles.desc}>{selectedPlace.description || 'Descrição não disponível.'}</Text>
              {selectedPlace.category_detail ? <Text style={styles.detailInfo}>Tipo: {selectedPlace.category_detail.replaceAll('_', ' ')}</Text> : null}
              {selectedPlace.phone ? <Text style={styles.detailInfo}>Telefone: {selectedPlace.phone}</Text> : null}
              {selectedPlace.website ? <Text style={styles.detailInfo}>Site: {selectedPlace.website}</Text> : null}
              {selectedPlace.opening_hours ? <Text style={styles.detailInfo}>Funcionamento: {selectedPlace.opening_hours}</Text> : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recursos de Acessibilidade</Text>
              <View style={styles.tags}>
                {selectedPlace.has_access_ramp && (
                  <View style={styles.tag}>
                    <Ionicons name="accessibility" size={14} color="#087F8C" />
                    <Text style={styles.tagText}>Rampa</Text>
                  </View>
                )}
                {selectedPlace.has_adapted_bathroom && (
                  <View style={styles.tag}>
                    <Ionicons name="water" size={14} color="#087F8C" />
                    <Text style={styles.tagText}>Banheiro adaptado</Text>
                  </View>
                )}
                {selectedPlace.allows_guide_dog && (
                  <View style={styles.tag}>
                    <Ionicons name="paw" size={14} color="#087F8C" />
                    <Text style={styles.tagText}>Cão-guia</Text>
                  </View>
                )}
                {selectedPlace.has_braille_signage && (
                  <View style={styles.tag}>
                    <Ionicons name="eye" size={14} color="#087F8C" />
                    <Text style={styles.tagText}>Braille</Text>
                  </View>
                )}
                {selectedPlace.has_sign_language_interpreter && (
                  <View style={styles.tag}>
                    <Ionicons name="happy" size={14} color="#087F8C" />
                    <Text style={styles.tagText}>Libras</Text>
                  </View>
                )}
                {selectedPlace.has_asd_friendly_space && (
                  <View style={styles.tag}>
                    <Ionicons name="people" size={14} color="#087F8C" />
                    <Text style={styles.tagText}>Espaço TEA</Text>
                  </View>
                )}
                {!hasAnyAccessibility && (
                  <Text style={styles.noInfoText}>Nenhum recurso de acessibilidade informado.</Text>
                )}
              </View>
              {(selectedPlace.photos || []).filter((photo) => photo.photo_type === 'ACCESSIBILITY').length > 0 && (
                <View style={styles.photoGallery}>
                  <Text style={styles.sectionTitle}>Fotos de acessibilidade</Text>
                  <Text style={styles.questionnaireNotice}>Evidências enviadas pelo estabelecimento; não representam certificação.</Text>
                  {(selectedPlace.photos || []).filter((photo) => photo.photo_type === 'ACCESSIBILITY').map((photo) => (
                    <View key={photo.id} style={styles.galleryPhoto}>
                      <Image source={{ uri: photo.photo_url }} style={styles.galleryPhotoImage} />
                      <Text style={styles.tagText}>{photoAccessibilityCategories.find(([value]) => value === photo.accessibility_category)?.[1] || 'Acessibilidade'}</Text>
                    </View>
                  ))}
                </View>
              )}
              {(selectedPlace.photos || []).filter((photo) => photo.photo_type === 'PLACE').length > 0 && (
                <View style={styles.photoGallery}>
                  <Text style={styles.sectionTitle}>Fotos do local</Text>
                  {(selectedPlace.photos || []).filter((photo) => photo.photo_type === 'PLACE').map((photo) => (
                    <Image key={photo.id} source={{ uri: photo.photo_url }} style={styles.galleryPhotoImage} />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.reviewSection}>
              <View style={styles.reviewHeading}>
                <View>
                  <Text style={styles.sectionTitle}>Comentários</Text>
                  <Text style={styles.reviewCount}>{placeReviews.length} avaliação(ões)</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    if (!user) {
                      setNotice('Entre na sua conta de viajante para avaliar este local.');
                      setScreen('login');
                    } else if (user.user_type !== 'TRAVELER') {
                      setReviewError('Somente contas de viajante podem avaliar locais.');
                    } else {
                      setReviewError('');
                      if (reviewFormOpen) setReviewAccessibilityDetails({});
                      setReviewFormOpen((open) => !open);
                    }
                  }}
                  style={styles.reviewButton}
                >
                  <Text style={styles.reviewButtonText}>{reviewFormOpen ? 'Cancelar' : 'Avaliar local'}</Text>
                </Pressable>
              </View>

              {reviewError ? <Text accessibilityRole="alert" style={styles.reviewError}>{reviewError}</Text> : null}
              {reviewFormOpen ? (
                <View style={styles.reviewForm}>
                  <Text style={styles.reviewFormLabel}>Como foi sua experiência?</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Pressable key={`experience-${rating}`} onPress={() => setExperienceRating(rating)} accessibilityRole="button" accessibilityLabel={`${rating} de 5 estrelas para experiência`}>
                        <Ionicons name={rating <= experienceRating ? 'star' : 'star-outline'} size={25} color="#F59E0B" />
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.reviewFormLabel}>Como avalia a acessibilidade?</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Pressable key={`accessibility-${rating}`} onPress={() => setAccessibilityRating(rating)} accessibilityRole="button" accessibilityLabel={`${rating} de 5 para acessibilidade`}>
                        <Ionicons name={rating <= accessibilityRating ? 'star' : 'star-outline'} size={25} color="#087F8C" />
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.reviewFormLabel}>Conte como foi a acessibilidade na prática</Text>
                  <Text style={styles.reviewAccessibilityHelp}>Este questionário é diferente da autodeclaração do estabelecimento: avalie somente o que você vivenciou nesta visita. Se não souber ou não se aplicar, deixe sem resposta.</Text>
                  {reviewAccessibilityQuestions.map((question) => (
                    <View key={question.key} style={styles.mobileQuestion}>
                      <Text style={styles.mobileQuestionText}>{question.label}</Text>
                      <View style={styles.formChoiceWrap}>
                        {reviewAnswerOptions.map(([answer, label]) => (
                          <Pressable
                            key={answer}
                            onPress={() => setReviewAccessibilityDetails((current) => ({ ...current, [question.key]: answer }))}
                            style={[styles.formChoice, reviewAccessibilityDetails[question.key] === answer && styles.formChoiceActive]}
                          >
                            <Text style={[styles.formChoiceText, reviewAccessibilityDetails[question.key] === answer && styles.formChoiceTextActive]}>{label}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                  <TextInput
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    placeholder="Conte como foi sua visita"
                    multiline
                    maxLength={2000}
                    style={styles.reviewInput}
                    accessibilityLabel="Comentário sobre o local"
                  />
                  <Pressable
                    onPress={() => void submitPlaceReview()}
                    disabled={reviewSubmitting || !reviewComment.trim()}
                    style={[styles.reviewSubmitButton, (reviewSubmitting || !reviewComment.trim()) && styles.reviewSubmitDisabled]}
                  >
                    {reviewSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.reviewSubmitText}>Publicar comentário</Text>}
                  </Pressable>
                </View>
              ) : null}

              {reviewsLoading ? (
                <ActivityIndicator color="#087F8C" style={styles.reviewLoading} />
              ) : placeReviews.length ? placeReviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewCardHeading}>
                    <Text style={styles.reviewAuthor}>{review.traveler_name}</Text>
                    <Text style={styles.reviewDate}>{review.created_at ? new Date(review.created_at).toLocaleDateString('pt-BR') : ''}</Text>
                  </View>
                  <View style={styles.reviewRatingRow}>
                    <Text style={styles.reviewRatingLabel}>Experiência</Text>
                    <Text style={styles.reviewStarsText}>{'★'.repeat(Math.max(0, Math.min(5, review.experience_rating)))}</Text>
                  </View>
                  <View style={styles.reviewRatingRow}>
                    <Text style={styles.reviewRatingLabel}>Acessibilidade</Text>
                    <Text style={styles.reviewStarsText}>{'★'.repeat(review.accessibility_level === 'EXCELLENT' ? 5 : review.accessibility_level === 'GOOD' ? 3 : 1)}</Text>
                  </View>
                  {review.comment_text ? <Text style={styles.reviewComment}>{review.comment_text}</Text> : <Text style={styles.reviewNoComment}>Sem comentário escrito.</Text>}
                  {review.accessibility_details && reviewAccessibilityQuestions.some((question) => review.accessibility_details?.[question.key]) ? (
                    <View style={styles.reviewAccessibilitySummary}>
                      <Text style={styles.reviewFormLabel}>Acessibilidade na prática</Text>
                      {reviewAccessibilityQuestions.map((question) => {
                        const answer = review.accessibility_details?.[question.key];
                        if (!answer) return null;
                        const answerLabel = reviewAnswerOptions.find(([value]) => value === answer)?.[1] || answer;
                        return <Text key={question.key} style={styles.reviewComment}>{question.label} — {answerLabel}</Text>;
                      })}
                    </View>
                  ) : null}
                </View>
              )) : (
                <View style={styles.reviewEmpty}>
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color="#087F8C" />
                  <Text style={styles.reviewEmptyText}>{reviewError ? 'As avaliações não puderam ser carregadas.' : 'Ainda não há comentários. Seja a primeira pessoa a avaliar este local.'}</Text>
                </View>
              )}
            </View>

            <Pressable onPress={() => toggleFavorite(selectedPlace.id)} style={[styles.saveBtn, favorites.includes(selectedPlace.id) && styles.saveBtnActive]}>
              <Ionicons name={favorites.includes(selectedPlace.id) ? 'heart' : 'heart-outline'} size={20} color={favorites.includes(selectedPlace.id) ? '#FFF' : '#052659'} />
              <Text style={[styles.saveBtnText, favorites.includes(selectedPlace.id) && styles.saveBtnTextActive]}>
                {favorites.includes(selectedPlace.id) ? 'Remover' : 'Salvar local'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- TELA INICIAL ---
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.brand}>Tru<Text style={styles.brandAccent}>Acess</Text></Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView ref={mainScrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {activeTab === 'profile' && user ? (
            <View style={styles.profilePanel}>
              {notice ? <View style={styles.noticeBox}><Text style={styles.noticeText}>{notice}</Text></View> : null}
              {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{user.full_name.trim().charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.profileTitle}>{user.full_name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <View style={styles.profileInfoRow}>
                <Text style={styles.profileInfoLabel}>Tipo de conta</Text>
                <Text style={styles.profileInfoValue}>{user.user_type === 'BUSINESS' ? 'Empresa' : 'Viajante'}</Text>
              </View>
              {user.user_type === 'TRAVELER' && (() => {
                const requiredProfileFields = [
                  { key: 'gender', label: 'Gênero', options: [['FEMALE', 'Mulher'], ['MALE', 'Homem'], ['OTHER', 'Outro'], ['PREFER_NOT_SAY', 'Prefiro não dizer']] },
                  { key: 'ageRange', label: 'Faixa etária', options: [['18-24', '18–24'], ['25-34', '25–34'], ['35-44', '35–44'], ['45-54', '45–54'], ['55+', '55+'], ['PREFER_NOT_SAY', 'Prefiro não informar']] },
                  { key: 'travelFrequency', label: 'Frequência de viagem', options: [['RARELY', 'Raramente'], ['SOMETIMES', 'Às vezes'], ['OFTEN', 'Frequentemente'], ['ALWAYS', 'Sempre']] },
                  { key: 'companionType', label: 'Com quem costuma viajar', options: [['ALONE', 'Sozinho(a)'], ['COUPLE', 'Com parceiro(a)'], ['FAMILY', 'Com família'], ['FRIENDS', 'Com amigos'], ['GROUP', 'Em grupo']] },
                ] as const;
                const missingFields = requiredProfileFields.filter((field) => !user.profile?.[field.key as keyof UserProfile]);
                return (
                  <View style={styles.profileCompletionCard}>
                    <Text style={styles.sectionTitle}>{missingFields.length ? 'Perfil incompleto' : 'Perfil completo'}</Text>
                    {missingFields.length > 0 ? (
                      <>
                        <Text style={styles.questionnaireNotice}>Falta preencher: {missingFields.map((field) => field.label).join(', ')}.</Text>
                        <Pressable onPress={() => setProfileEditOpen((open) => !open)} style={styles.profileActionButton}>
                          <Text style={styles.profileActionButtonText}>{profileEditOpen ? 'Fechar preenchimento' : 'Completar perfil'}</Text>
                        </Pressable>
                      </>
                    ) : (
                      <Text style={styles.questionnaireNotice}>As informações essenciais do viajante estão preenchidas.</Text>
                    )}
                    {profileEditOpen && (
                      <View style={{ marginTop: 12 }}>
                        {requiredProfileFields.map((field) => (
                          <View key={field.key} style={styles.mobileQuestion}>
                            <Text style={styles.mobileQuestionText}>{field.label}{missingFields.some((item) => item.key === field.key) ? ' · incompleto' : ''}</Text>
                            <View style={styles.formChoiceWrap}>
                              {field.options.map(([value, label]) => (
                                <Pressable key={value} onPress={() => setTravelerDraft((current) => ({ ...current, [field.key]: value }))} style={[styles.formChoice, travelerDraft[field.key as keyof UserProfile] === value && styles.formChoiceActive]}>
                                  <Text style={[styles.formChoiceText, travelerDraft[field.key as keyof UserProfile] === value && styles.formChoiceTextActive]}>{label}</Text>
                                </Pressable>
                              ))}
                            </View>
                          </View>
                        ))}
                        <Pressable onPress={() => void saveTravelerProfile()} disabled={loading} style={[styles.profileActionButton, loading && styles.disabledBtn]}>
                          <Text style={styles.profileActionButtonText}>{loading ? 'Salvando...' : 'Salvar informações'}</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })()}
              {linkedError ? <View style={styles.errorBox}><Text style={styles.errorText}>{linkedError}</Text></View> : null}
              {linkedNotice ? <View style={styles.noticeBox}><Text style={styles.noticeText}>{linkedNotice}</Text></View> : null}
              <View style={styles.profileCompletionCard}>
                <Text style={styles.sectionTitle}>Perfis conectados</Text>
                <Text style={styles.questionnaireNotice}>Viajante e estabelecimento mantêm e-mails, senhas e informações separadas.</Text>
                {linkedAccount ? (
                  <>
                    <Text style={styles.profileInfoValue}>{linkedAccount.user_type === 'BUSINESS' ? 'Estabelecimento' : 'Viajante'} · {linkedAccount.full_name || linkedAccount.email}</Text>
                    <Pressable onPress={() => void switchLinkedAccount()} disabled={loading} style={styles.profileActionButton}>
                      <Text style={styles.profileActionButtonText}>{loading ? 'Alternando...' : `Mudar para ${linkedAccount.user_type === 'BUSINESS' ? 'estabelecimento' : 'viajante'}`}</Text>
                    </Pressable>
                    <Pressable onPress={() => void unlinkAccount()} disabled={loading} style={styles.unlinkAccountButton}>
                      <Text style={styles.unlinkAccountText}>Desconectar perfis</Text>
                    </Pressable>
                  </>
                ) : linkMode ? (
                  <View>
                    {linkMode === 'create' && (
                      <TextInput value={linkedFullName} onChangeText={setLinkedFullName} placeholder="Nome do outro perfil" style={styles.formInput} />
                    )}
                    <TextInput value={linkedEmail} onChangeText={setLinkedEmail} placeholder={linkMode === 'connect' ? 'E-mail da conta existente' : 'Novo e-mail'} keyboardType="email-address" autoCapitalize="none" style={styles.formInput} />
                    <TextInput value={linkedPassword} onChangeText={setLinkedPassword} placeholder={linkMode === 'connect' ? 'Senha da conta existente' : 'Nova senha (mín. 6 caracteres)'} secureTextEntry style={styles.formInput} />
                    <View style={styles.formChoiceWrap}>
                      <Pressable onPress={() => void submitLinkedAccount()} disabled={loading} style={styles.profileActionButton}>
                        <Text style={styles.profileActionButtonText}>{loading ? 'Salvando...' : linkMode === 'connect' ? 'Conectar conta' : 'Criar e conectar'}</Text>
                      </Pressable>
                      <Pressable onPress={() => { setLinkMode(null); setLinkedError(''); }} style={styles.formChoice}>
                        <Text style={styles.formChoiceText}>Cancelar</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.formChoiceWrap}>
                    <Pressable onPress={() => setLinkMode('connect')} style={styles.formChoice}>
                      <Text style={styles.formChoiceText}>Conectar conta de {user.user_type === 'BUSINESS' ? 'viajante' : 'estabelecimento'}</Text>
                    </Pressable>
                    <Pressable onPress={() => setLinkMode('create')} style={styles.formChoice}>
                      <Text style={styles.formChoiceText}>Criar perfil de {user.user_type === 'BUSINESS' ? 'viajante' : 'estabelecimento'}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
              {user.user_type === 'BUSINESS' && (
                <View style={styles.businessManagement}>
                  <View style={styles.businessManagementHeader}>
                    <View>
                      <Text style={styles.sectionTitle}>Meus estabelecimentos</Text>
                      <Text style={styles.businessManagementCaption}>{myPlaces.length} local(is) cadastrado(s)</Text>
                    </View>
                    <Pressable onPress={startNewPlace} style={styles.businessAddButton}>
                      <Ionicons name="add" size={18} color="#FFF" />
                      <Text style={styles.businessAddButtonText}>Novo local</Text>
                    </Pressable>
                  </View>
                  {myPlaces.length === 0 ? (
                    <View>
                      <Text style={styles.emptyBusinessText}>Perfil do estabelecimento incompleto: cadastre seu primeiro local com nome, categoria, endereço e país.</Text>
                      <Pressable onPress={startNewPlace} style={styles.profileActionButton}>
                        <Text style={styles.profileActionButtonText}>Completar perfil do estabelecimento</Text>
                      </Pressable>
                    </View>
                  ) : myPlaces.map((place) => (
                    <View key={place.id} style={styles.businessPlaceRow}>
                      <View style={styles.businessPlaceSummary}>
                        <Text style={styles.businessPlaceName}>{place.establishment_name}</Text>
                        <Text style={styles.businessPlaceLocation}>{place.city}, {place.state} · {place.total_reviews || 0} avaliação(ões)</Text>
                        {[
                          !place.establishment_name?.trim() && 'Nome',
                          !place.category?.trim() && 'Categoria',
                          !place.full_address?.trim() && 'Endereço',
                          !place.city?.trim() && 'Cidade',
                          !place.country?.trim() && 'País',
                        ].filter(Boolean).length > 0 && (
                          <Text style={styles.incompletePlaceText}>
                            Incompleto: {[
                              !place.establishment_name?.trim() && 'Nome',
                              !place.category?.trim() && 'Categoria',
                              !place.full_address?.trim() && 'Endereço',
                              !place.city?.trim() && 'Cidade',
                              !place.country?.trim() && 'País',
                            ].filter(Boolean).join(', ')}
                          </Text>
                        )}
                        <Text style={styles.businessPlaceLocation}>
                          {place.accessibility_score == null ? 'Acessibilidade sem dados' : `${place.accessibility_score}% · ${place.accessibility_level === 'ADVANCED' ? 'Avançado' : place.accessibility_level === 'INTERMEDIATE' ? 'Intermediário' : 'Inicial'}`}
                        </Text>
                      </View>
                      <Pressable onPress={() => startEditPlace(place)} style={styles.businessEditButton}>
                        <Ionicons name="create-outline" size={18} color="#087F8C" />
                        <Text style={styles.businessEditText}>Editar</Text>
                      </Pressable>
                      {confirmDeletePlaceId === place.id ? (
                        <View style={styles.deleteConfirm}>
                          <Text style={styles.deleteConfirmLabel}>Excluir?</Text>
                          <Pressable onPress={() => { void deletePlace(place.id); setConfirmDeletePlaceId(null); }}><Text style={styles.deleteConfirmYes}>Sim</Text></Pressable>
                          <Pressable onPress={() => setConfirmDeletePlaceId(null)}><Text style={styles.deleteConfirmNo}>Não</Text></Pressable>
                        </View>
                      ) : (
                        <Pressable onPress={() => setConfirmDeletePlaceId(place.id)} style={styles.businessDeleteButton}>
                          <Ionicons name="trash-outline" size={18} color="#B42318" />
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              )}
              <Pressable onPress={handleLogout} style={styles.profileLogout}>
                <Ionicons name="log-out-outline" size={19} color="#B42318" />
                <Text style={styles.profileLogoutText}>Sair da conta</Text>
              </Pressable>
            </View>
          ) : activeTab === 'home' ? (
            <View>
              {notice ? <View style={styles.noticeBox}><Text style={styles.noticeText}>{notice}</Text></View> : null}
              {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
              <View style={styles.homeLandingHero}>
                <Text style={styles.homeLandingEyebrow}>TURISMO PARA TODOS</Text>
                <Text style={styles.homeLandingTitle}>Sua próxima viagem começa com mais autonomia.</Text>
                <Text style={styles.homeLandingDescription}>Descubra lugares, compare informações de acessibilidade e planeje cada etapa no seu ritmo.</Text>
                <Pressable onPress={() => handleTabPress('explore')} style={styles.homeLandingButton}>
                  <Text style={styles.homeLandingButtonText}>Explorar destinos</Text>
                  <Ionicons name="arrow-forward" size={18} color="#052659" />
                </Pressable>
                <View style={styles.homeLandingFeatures}>
                  <View style={styles.homeLandingFeature}><Ionicons name="accessibility-outline" size={17} color="#7DE4E0" /><Text style={styles.homeLandingFeatureText}>Acessibilidade</Text></View>
                  <View style={styles.homeLandingFeature}><Ionicons name="information-circle-outline" size={17} color="#7DE4E0" /><Text style={styles.homeLandingFeatureText}>Informações claras</Text></View>
                  <View style={styles.homeLandingFeature}><Ionicons name="people-outline" size={17} color="#7DE4E0" /><Text style={styles.homeLandingFeatureText}>Experiências reais</Text></View>
                </View>
              </View>

              <View style={styles.homeSectionHeading}>
                <View>
                  <Text style={styles.homeSectionTitle}>Explore por categoria</Text>
                  <Text style={styles.homeSectionSubtitle}>Escolha o tipo de experiência</Text>
                </View>
              </View>
              <View style={styles.homeCategoryGrid}>
                {categories.filter((item) => item.value).map((item) => (
                  <Pressable key={item.value} onPress={() => openExplore(item.value)} style={styles.homeCategoryCard}>
                    <Ionicons
                      name={item.value === 'ACCOMMODATION' ? 'bed-outline' : item.value === 'GASTRONOMY' ? 'restaurant-outline' : item.value === 'TOURIST_ATTRACTION' ? 'camera-outline' : 'compass-outline'}
                      size={22}
                      color="#087F8C"
                    />
                    <Text style={styles.homeCategoryText}>{item.label}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#94A3B8" />
                  </Pressable>
                ))}
              </View>

              <View style={styles.homeSectionHeading}>
                <View>
                  <Text style={styles.homeSectionTitle}>Um lugar para conhecer</Text>
                  <Text style={styles.homeSectionSubtitle}>Destaque entre os locais cadastrados</Text>
                </View>
              </View>
              {placesLoading ? (
                <ActivityIndicator color="#2AC2D2" size="large" style={styles.spinner} />
              ) : places[0] ? (
                <Pressable onPress={() => setSelectedPlace(places[0])} style={styles.homeFeaturedCard}>
                  {places[0].main_image ? (
                    <Image source={{ uri: places[0].main_image }} style={styles.homeFeaturedImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.homeFeaturedImage, styles.homeFeaturedPlaceholder]}>
                      <Ionicons name="image-outline" size={34} color="#087F8C" />
                    </View>
                  )}
                  <View style={styles.homeFeaturedContent}>
                    <Text style={styles.homeFeaturedCategory}>{categories.find((item) => item.value === places[0].category)?.label || places[0].category}</Text>
                    <Text numberOfLines={1} style={styles.homeFeaturedTitle}>{places[0].establishment_name}</Text>
                    <View style={styles.homeFeaturedLocation}>
                      <Ionicons name="location-outline" size={14} color="#64748B" />
                      <Text numberOfLines={1} style={styles.homeFeaturedLocationText}>{places[0].city}, {places[0].state}</Text>
                    </View>
                    <View style={styles.homeFeaturedFooter}>
                      <Text style={styles.homeFeaturedScore}>
                        {places[0].accessibility_score == null
                          ? 'Acessibilidade sem dados'
                          : `${places[0].accessibility_score}% · ${places[0].accessibility_level === 'ADVANCED' ? 'Avançado' : places[0].accessibility_level === 'INTERMEDIATE' ? 'Intermediário' : 'Inicial'}`}
                      </Text>
                      <Text style={styles.homeFeaturedAction}>Ver local</Text>
                    </View>
                  </View>
                </Pressable>
              ) : (
                <View style={styles.homeEmptyState}>
                  <Ionicons name="map-outline" size={30} color="#087F8C" />
                  <Text style={styles.homeEmptyTitle}>Novos destinos estão chegando</Text>
                  <Text style={styles.homeEmptyText}>Quando houver locais cadastrados, eles aparecerão aqui e na área Explorar.</Text>
                  <Pressable onPress={() => handleTabPress('explore')} style={styles.homeEmptyButton}>
                    <Text style={styles.homeEmptyButtonText}>Buscar destinos</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            <>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>{activeTab === 'favorites' ? 'SUA LISTA PESSOAL' : 'BUSCA E FILTROS'}</Text>
            <Text style={styles.heroTitle}>{activeTab === 'favorites' ? 'Lugares salvos' : 'Encontre um destino'}</Text>
            {activeTab === 'explore' ? <Text style={styles.heroSubtitle}>Pesquise locais, escolha uma categoria e compare informações de acessibilidade.</Text> : null}
          </View>

          {notice && <View style={styles.noticeBox}><Text style={styles.noticeText}>{notice}</Text></View>}
          {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

          <View style={activeTab === 'explore' ? styles.exploreFilterPanel : undefined}>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={19} color="#087F8C" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar local ou cidade"
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
                returnKeyType="search"
                accessibilityLabel="Buscar local ou cidade"
              />
              {search ? (
                <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Limpar busca" style={styles.clearSearchButton}>
                  <Ionicons name="close-circle" size={19} color="#94A3B8" />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.filterGroupHeader}>
              <Text style={styles.filterGroupTitle}>Categorias</Text>
              <Text style={styles.filterGroupHint}>Escolha o tipo de lugar</Text>
            </View>
            <ScrollView horizontal style={styles.horizontalFilters} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {categories.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => { setCategory(item.value); setCategoryDetail(''); setShowFavorites(false); }}
                  style={[styles.filterBtn, category === item.value && !showFavorites && styles.filterActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === item.value && !showFavorites }}
                >
                  <Text style={[styles.filterText, category === item.value && !showFavorites && styles.filterTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {category && categoryDetails[category]?.length ? (
              <View style={styles.subcategoryGroup}>
                <View style={styles.filterGroupHeader}>
                  <Text style={styles.filterGroupTitle}>Tipo de local</Text>
                  {categoryDetail ? (
                    <Pressable onPress={() => setCategoryDetail('')} accessibilityRole="button" accessibilityLabel="Limpar tipo de local">
                      <Text style={styles.clearSubcategoryText}>Limpar</Text>
                    </Pressable>
                  ) : null}
                </View>
                <ScrollView horizontal style={styles.horizontalFilters} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subcategoryFilters}>
                  {categoryDetails[category].map((item) => (
                    <Pressable
                      key={item.value}
                      onPress={() => setCategoryDetail(categoryDetail === item.value ? '' : item.value)}
                      style={[styles.filterBtn, styles.subcategoryFilterBtn, categoryDetail === item.value && styles.subcategoryFilterActive]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: categoryDetail === item.value }}
                    >
                      <Text style={[styles.filterText, categoryDetail === item.value && styles.subcategoryFilterTextActive]}>{item.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>

          {placesLoading ? (
            <ActivityIndicator color="#2AC2D2" size="large" style={styles.spinner} />
          ) : filteredPlaces.length > 0 ? (
            <>
              <View style={styles.exploreResultsHeader}>
                <View style={styles.exploreResultsIcon}><Ionicons name="location-outline" size={16} color="#087F8C" /></View>
                <Text style={styles.exploreResultsCount}>
                  {filteredPlaces.length} {filteredPlaces.length === 1 ? 'local encontrado' : 'locais encontrados'}
                </Text>
              </View>
              {filteredPlaces.map(renderPlaceCard)}
            </>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="search" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>{showFavorites ? 'Nenhum local salvo.' : 'Nenhum local encontrado.'}</Text>
            </View>
          )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.bottomNav}>
        <Pressable onPress={() => handleTabPress('home')} style={styles.bottomNavItem} accessibilityRole="button" accessibilityLabel="Início">
          <Ionicons name={activeTab === 'home' ? 'home' : 'home-outline'} size={20} color={activeTab === 'home' ? '#087F8C' : '#94A3B8'} />
          <Text style={[styles.bottomNavLabel, activeTab === 'home' && styles.bottomNavLabelActive]}>Início</Text>
        </Pressable>
        <Pressable onPress={() => handleTabPress('explore')} style={styles.bottomNavItem} accessibilityRole="button" accessibilityLabel="Explorar">
          <Ionicons name={activeTab === 'explore' ? 'search' : 'search-outline'} size={20} color={activeTab === 'explore' ? '#087F8C' : '#94A3B8'} />
          <Text style={[styles.bottomNavLabel, activeTab === 'explore' && styles.bottomNavLabelActive]}>Explorar</Text>
        </Pressable>
        <Pressable onPress={() => handleTabPress('favorites')} style={styles.bottomNavItem} accessibilityRole="button" accessibilityLabel="Favoritos">
          <Ionicons name={activeTab === 'favorites' ? 'heart' : 'heart-outline'} size={20} color={activeTab === 'favorites' ? '#087F8C' : '#94A3B8'} />
          <Text style={[styles.bottomNavLabel, activeTab === 'favorites' && styles.bottomNavLabelActive]}>Favoritos</Text>
        </Pressable>
        <Pressable onPress={() => handleTabPress('profile')} style={styles.bottomNavItem} accessibilityRole="button" accessibilityLabel="Perfil">
          <Ionicons name={activeTab === 'profile' ? 'person' : 'person-outline'} size={20} color={activeTab === 'profile' ? '#087F8C' : '#94A3B8'} />
          <Text style={[styles.bottomNavLabel, activeTab === 'profile' && styles.bottomNavLabelActive]}>Perfil</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  keyboardView: { flex: 1 },
  header: { height: 60, paddingHorizontal: 20, backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  brand: { color: '#052659', fontSize: 22, fontWeight: '800' },
  brandAccent: { color: '#2AC2D2' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userName: { color: '#052659', fontSize: 14, fontWeight: '600' },
  headerLinkText: { color: '#052659', fontWeight: '600', fontSize: 14 },
  headerSignup: { backgroundColor: '#052659', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  headerSignupText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  content: { width: '100%', alignItems: 'stretch', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, flexGrow: 1 },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 9,
    paddingBottom: Platform.OS === 'ios' ? 8 : 10,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DCE5EF',
    shadowColor: '#052659',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  bottomNavItem: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  bottomNavLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  bottomNavLabelActive: {
    color: '#052659',
    fontWeight: '800',
  },
  profilePanel: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 42,
  },
  profileAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDF7F7',
    marginBottom: 16,
  },
  profileAvatarText: {
    color: '#087F8C',
    fontSize: 34,
    fontWeight: '800',
  },
  profileTitle: {
    color: '#052659',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  profileEmail: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 5,
    marginBottom: 32,
  },
  profileInfoRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DCE5EF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DCE5EF',
  },
  profileInfoLabel: {
    color: '#64748B',
    fontSize: 14,
  },
  profileInfoValue: {
    color: '#052659',
    fontSize: 14,
    fontWeight: '700',
  },
  profileCompletionCard: {
    width: '100%',
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#DCE5EF',
  },
  profileActionButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#087F8C',
  },
  profileActionButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  incompletePlaceText: { color: '#B54708', fontSize: 11, fontWeight: '700', marginTop: 4 },
  unlinkAccountButton: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 4 },
  unlinkAccountText: { color: '#B42318', fontSize: 12, fontWeight: '700' },
  businessManagement: {
    width: '100%',
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5EF',
  },
  businessManagementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  businessManagementCaption: { color: '#64748B', fontSize: 12, marginTop: 3 },
  businessAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#087F8C',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  businessAddButtonText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  emptyBusinessText: { color: '#64748B', fontSize: 13, lineHeight: 20, paddingVertical: 8 },
  businessPlaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DCE5EF',
  },
  businessPlaceSummary: { flex: 1, minWidth: 150 },
  businessPlaceName: { color: '#052659', fontSize: 14, fontWeight: '800' },
  businessPlaceLocation: { color: '#64748B', fontSize: 11, marginTop: 3 },
  businessEditButton: { flexDirection: 'row', alignItems: 'center', gap: 3, padding: 6 },
  businessEditText: { color: '#087F8C', fontWeight: '700', fontSize: 12 },
  businessDeleteButton: { padding: 7, backgroundColor: '#FFF1F0', borderRadius: 8 },
  deleteConfirm: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 5 },
  deleteConfirmLabel: { color: '#64748B', fontSize: 12 },
  deleteConfirmYes: { color: '#B42318', fontWeight: '800', fontSize: 12 },
  deleteConfirmNo: { color: '#052659', fontWeight: '700', fontSize: 12 },
  mobilePlaceRating: { color: '#64748B', fontSize: 12, marginBottom: 8 },
  detailInfo: { color: '#475569', fontSize: 13, lineHeight: 19, marginBottom: 6 },
  assessmentSummary: { marginTop: 20, padding: 14, borderRadius: 12, backgroundColor: '#F3FAFC' },
  profileLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginTop: 24,
    padding: 15,
    backgroundColor: '#FFF1F0',
    borderRadius: 12,
  },
  profileLogoutText: {
    color: '#B42318',
    fontSize: 14,
    fontWeight: '700',
  },
  hero: { width: '100%', marginBottom: 16 },
  heroPanel: {
    backgroundColor: '#052659',
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#052659',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  heroBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 18,
  },
  heroBadgeText: {
    color: '#E2F3FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitleLarge: {
    color: '#E2E8F0',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroHighlight: {
    backgroundColor: 'rgba(148, 163, 184, 0.45)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    color: '#F8FAFC',
  },
  heroDescription: {
    color: '#DBEAFE',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 16,
  },
  heroFeatures: {
    gap: 10,
    alignSelf: 'stretch',
    marginBottom: 22,
  },
  heroFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroFeatureText: {
    color: '#E2F3FF',
    fontSize: 12,
    fontWeight: '600',
  },
  heroButton: {
    backgroundColor: '#35D0D9',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    minHeight: 54,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignSelf: 'stretch',
    shadowColor: '#2AC2D2',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroButtonText: {
    color: '#052659',
    fontSize: 15,
    fontWeight: '800',
  },
  eyebrow: { color: '#2AC2D2', fontSize: 12, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  heroTitle: { color: '#052659', fontSize: 26, lineHeight: 32, fontWeight: '800', flexShrink: 1 },
  heroSubtitle: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: 5 },
  heroAccent: { color: '#2AC2D2' },
  homeLandingHero: { backgroundColor: '#052659', borderRadius: 24, padding: 20, marginBottom: 28, overflow: 'hidden' },
  homeLandingEyebrow: { color: '#7DE4E0', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 12 },
  homeLandingTitle: { color: '#FFFFFF', fontSize: 27, lineHeight: 34, fontWeight: '900' },
  homeLandingDescription: { color: '#D5E4F3', fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 18 },
  homeLandingButton: { backgroundColor: '#7DE4E0', minHeight: 48, borderRadius: 12, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  homeLandingButtonText: { color: '#052659', fontSize: 14, fontWeight: '800' },
  homeLandingFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 19 },
  homeLandingFeature: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  homeLandingFeatureText: { color: '#E2F3FF', fontSize: 11, fontWeight: '600' },
  homeSectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 2 },
  homeSectionTitle: { color: '#052659', fontSize: 19, fontWeight: '800' },
  homeSectionSubtitle: { color: '#64748B', fontSize: 12, marginTop: 4 },
  homeCategoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 27 },
  homeCategoryCard: { flexBasis: '47%', flexGrow: 1, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 11, paddingVertical: 10, backgroundColor: '#FFFFFF', borderRadius: 13, borderWidth: 1, borderColor: '#DCE5EF' },
  homeCategoryText: { color: '#052659', fontSize: 12, fontWeight: '700', flex: 1 },
  homeFeaturedCard: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#DCE5EF', marginBottom: 8 },
  homeFeaturedImage: { width: '100%', height: 150, backgroundColor: '#DDF3F3' },
  homeFeaturedPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  homeFeaturedContent: { padding: 14 },
  homeFeaturedCategory: { color: '#087F8C', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  homeFeaturedTitle: { color: '#052659', fontSize: 17, fontWeight: '800' },
  homeFeaturedLocation: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  homeFeaturedLocationText: { color: '#64748B', fontSize: 12, flex: 1 },
  homeFeaturedFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E2E8F0', marginTop: 12, paddingTop: 10 },
  homeFeaturedScore: { color: '#087F8C', fontSize: 11, fontWeight: '700', flexShrink: 1 },
  homeFeaturedAction: { color: '#052659', fontSize: 12, fontWeight: '800' },
  homeEmptyState: { alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#DCE5EF' },
  homeEmptyTitle: { color: '#052659', fontSize: 15, fontWeight: '800', textAlign: 'center', marginTop: 10 },
  homeEmptyText: { color: '#64748B', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6 },
  homeEmptyButton: { backgroundColor: '#E6F7F7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 14 },
  homeEmptyButtonText: { color: '#087F8C', fontSize: 13, fontWeight: '800' },
  exploreFilterPanel: { width: '100%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 18, padding: 13, marginBottom: 18, shadowColor: '#052659', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  searchWrap: { minHeight: 48, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#DCE5EF', borderRadius: 12, paddingHorizontal: 12, marginBottom: 14 },
  clearSearchButton: { width: 30, height: 36, alignItems: 'center', justifyContent: 'center' },
  filterGroupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 },
  filterGroupTitle: { color: '#052659', fontSize: 12, fontWeight: '800' },
  filterGroupHint: { color: '#94A3B8', fontSize: 10, fontWeight: '600' },
  horizontalFilters: { height: 42, flexGrow: 0, flexShrink: 0, alignSelf: 'stretch' },
  subcategoryGroup: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E2E8F0', marginTop: 8, paddingTop: 10 },
  clearSubcategoryText: { color: '#087F8C', fontSize: 11, fontWeight: '700' },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statNumber: {
    color: '#2AC2D2',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 6,
  },
  statLabel: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 10, fontSize: 14, color: '#0F172A', marginLeft: 9 },
  filters: { alignItems: 'center', gap: 7, paddingRight: 4 },
  subcategoryFilters: { alignItems: 'center', gap: 7, paddingRight: 4 },
  filterBtn: { minHeight: 34, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 13, backgroundColor: '#F1F5F9', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  filterActive: { backgroundColor: '#052659', borderColor: '#052659' },
  subcategoryFilterBtn: { backgroundColor: '#FFFFFF', borderColor: '#DCE5EF' },
  subcategoryFilterActive: { backgroundColor: '#E6F7F7', borderColor: '#8DD9D7' },
  filterText: { color: '#475569', fontWeight: '700', fontSize: 12 },
  filterTextActive: { color: '#FFF' },
  subcategoryFilterTextActive: { color: '#087F8C' },
  favToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F0F9FF', borderRadius: 10, paddingVertical: 12, marginBottom: 16, borderWidth: 1, borderColor: '#BAE6FD' },
  favToggleActive: { backgroundColor: '#052659', borderColor: '#052659' },
  favToggleText: { color: '#052659', fontWeight: '700', fontSize: 14 },
  favToggleTextActive: { color: '#FFF' },
  exploreResultsHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  exploreResultsIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#E6F7F7', alignItems: 'center', justifyContent: 'center' },
  exploreResultsCount: { color: '#475569', fontSize: 12, fontWeight: '800' },

  // Card
  card: { width: '100%', backgroundColor: '#FFF', borderRadius: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', shadowColor: '#052659', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  cardImageContainer: { width: '100%', height: 170, backgroundColor: '#E2E8F0', overflow: 'hidden', position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  cardImagePlaceholderText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  cardBadges: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 },
  cardBadgeFree: { backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  cardBadgeFreeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  cardBadgePublic: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  cardBadgePublicText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardCat: { color: '#087F8C', textTransform: 'uppercase', fontSize: 11, fontWeight: '800' },
  cardName: { color: '#052659', fontWeight: '700', fontSize: 17, marginBottom: 6 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  locText: { color: '#64748B', fontSize: 13 },
  cardPrice: { color: '#052659', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  cardPriceFree: { color: '#059669' },
  desc: { color: '#475569', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  seeMore: { color: '#2AC2D2', fontSize: 13, fontWeight: '700' },

  spinner: { marginTop: 40 },
  empty: { alignItems: 'center', marginTop: 40, padding: 20 },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 12, fontSize: 15 },

  // Detalhes
  detailsContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  detailsHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, gap: 10, minHeight: 52, backgroundColor: '#F8FAFC', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DCE5EF' },
  detailsCategoryPill: { flex: 1, minWidth: 0, alignItems: 'flex-start' },
  detailsCategory: { overflow: 'hidden', color: '#087F8C', textTransform: 'uppercase', fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  detailsFavoriteButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DCE5EF' },
  detailsImageContainer: { height: 180, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  detailsImage: { width: '100%', height: '100%' },
  detailsImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  detailsImageText: { color: '#94A3B8', fontWeight: '600' },
  detailsContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  detailsTitle: { color: '#052659', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  section: { marginTop: 24 },
  sectionTitle: { color: '#052659', fontWeight: '700', fontSize: 18, marginBottom: 12 },

  // Badges na tela de detalhes
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 8 },
  badgeFree: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeFreeText: { color: '#059669', fontSize: 13, fontWeight: '700' },
  badgePublic: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgePublicText: { color: '#0284C7', fontSize: 13, fontWeight: '700' },

  // Resumo
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: { color: '#052659', fontSize: 18, fontWeight: '800', marginBottom: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, gap: 10 },
  summaryLabel: { color: '#64748B', fontSize: 12, fontWeight: '500' },
  summaryValue: { color: '#052659', fontSize: 12, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
  summaryPrice: { color: '#052659', fontSize: 14, fontWeight: '800' },
  summaryPriceFree: { color: '#059669', fontSize: 14, fontWeight: '800' },
  summaryDivider: { height: 1, backgroundColor: '#F1F5F9' },
  accessibilityRating: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  accessibilityScore: { color: '#087F8C', fontSize: 12, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  levelTrack: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 8, overflow: 'hidden', marginTop: 3 },
  levelFill: { height: '100%', backgroundColor: '#16A085', borderRadius: 8 },
  levelFillEmpty: { width: '0%' },
  levelLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  levelLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '600' },
  levelLabelActive: { color: '#087F8C', fontWeight: '800' },
  reviewSection: { marginTop: 24 },
  reviewHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  reviewCount: { color: '#64748B', fontSize: 12, marginTop: -7 },
  reviewButton: { backgroundColor: '#087F8C', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  reviewButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  reviewError: { color: '#B42318', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  reviewForm: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#DCE5EF', marginBottom: 12 },
  reviewFormLabel: { color: '#334155', fontSize: 12, fontWeight: '700', marginBottom: 7 },
  reviewAccessibilityHelp: { color: '#64748B', fontSize: 11, lineHeight: 16, marginBottom: 6 },
  reviewAccessibilitySummary: { marginTop: 12, padding: 11, borderRadius: 10, backgroundColor: '#F0F9FA' },
  reviewStars: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  reviewInput: { minHeight: 82, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 11, color: '#0F172A', fontSize: 13, textAlignVertical: 'top', marginBottom: 10 },
  reviewSubmitButton: { minHeight: 42, borderRadius: 10, backgroundColor: '#052659', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  reviewSubmitDisabled: { opacity: 0.5 },
  reviewSubmitText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  reviewLoading: { marginVertical: 20 },
  reviewCard: { backgroundColor: '#FFFFFF', padding: 13, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  reviewCardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  reviewAuthor: { color: '#052659', fontSize: 13, fontWeight: '800', flexShrink: 1 },
  reviewDate: { color: '#94A3B8', fontSize: 10 },
  reviewRatingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  reviewRatingLabel: { color: '#64748B', fontSize: 11 },
  reviewStarsText: { color: '#F59E0B', fontSize: 13 },
  reviewComment: { color: '#334155', fontSize: 13, lineHeight: 19, marginTop: 7 },
  reviewNoComment: { color: '#94A3B8', fontSize: 12, fontStyle: 'italic', marginTop: 7 },
  reviewEmpty: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, backgroundColor: '#F0F9FA' },
  reviewEmptyText: { color: '#475569', fontSize: 12, lineHeight: 18, flex: 1 },

  // Tags
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0F9FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#BAE6FD' },
  tagText: { color: '#052659', fontSize: 13, fontWeight: '600' },
  noInfoText: { color: '#94A3B8', fontSize: 14, fontStyle: 'italic', padding: 8 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#052659', borderRadius: 12, paddingVertical: 16, marginTop: 32 },
  saveBtnActive: { backgroundColor: '#052659' },
  saveBtnText: { color: '#052659', fontSize: 16, fontWeight: '700' },
  saveBtnTextActive: { color: '#FFF' },

  // Auth
  authContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  placeFormContainer: { padding: 18, paddingBottom: 42, flexGrow: 1 },
  placeFormTitle: { color: '#052659', fontSize: 26, lineHeight: 32, fontWeight: '900', marginBottom: 6 },
  placeFormIntro: { color: '#64748B', fontSize: 14, lineHeight: 20, marginBottom: 18 },
  formLabel: { color: '#334155', fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 8 },
  formInput: {
    minHeight: 48,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFF',
    color: '#0F172A',
    fontSize: 14,
    marginBottom: 8,
  },
  formTextArea: { minHeight: 96, textAlignVertical: 'top' },
  formChoiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 },
  formChoice: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#DCE5EF', backgroundColor: '#FFF' },
  formChoiceActive: { backgroundColor: '#087F8C', borderColor: '#087F8C' },
  formChoiceText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  formChoiceTextActive: { color: '#FFF' },
  roleChoiceRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  roleChoice: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingVertical: 12, backgroundColor: '#FFF' },
  roleChoiceActive: { backgroundColor: '#087F8C', borderColor: '#087F8C' },
  roleChoiceText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  roleChoiceTextActive: { color: '#FFF' },
  questionnaireCard: { marginTop: 18, padding: 14, borderRadius: 14, backgroundColor: '#F2FAFC', borderWidth: 1, borderColor: '#D5EEF1' },
  questionnaireNotice: { color: '#475569', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  pendingPhoto: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#D5EEF1' },
  pendingPhotoImage: { width: 76, height: 76, borderRadius: 10, backgroundColor: '#E2E8F0' },
  pendingPhotoInfo: { flex: 1, gap: 8 },
  pendingPhotoName: { color: '#052659', fontSize: 13, fontWeight: '700' },
  removePhotoText: { color: '#B42318', fontSize: 13, fontWeight: '700', paddingVertical: 6 },
  photoGallery: { marginTop: 16, gap: 10 },
  galleryPhoto: { gap: 8, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 12 },
  galleryPhotoImage: { width: '100%', height: 190, borderRadius: 10, backgroundColor: '#E2E8F0' },
  mobileQuestion: { paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#DCE5EF' },
  mobileQuestionText: { color: '#1E293B', fontSize: 13, lineHeight: 19, fontWeight: '700', marginBottom: 8 },
  authCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: '#E2E8F0' },
  logoText: { fontSize: 32, fontWeight: '800', color: '#052659', textAlign: 'center', marginBottom: 8 },
  logoAccent: { color: '#2AC2D2' },
  authTitle: { color: '#052659', fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, marginBottom: 14 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#0F172A', marginLeft: 10 },
  primaryBtn: { backgroundColor: '#052659', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 12 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },
  switchBtn: { alignItems: 'center', marginTop: 16, padding: 12 },
  switchBtnText: { color: '#052659', fontWeight: '600', fontSize: 14 },
  authBackBtn: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#DCE5EF', backgroundColor: '#F8FAFC' },
  authBackBtnPressed: { backgroundColor: '#EAF3FA', opacity: 0.8 },
  authBackBtnText: { color: '#052659', fontSize: 14, fontWeight: '700' },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, padding: 12 },
  backBtnText: { color: '#64748B', fontSize: 14 },
  noticeBox: { backgroundColor: '#E0F2FE', padding: 14, borderRadius: 10, marginBottom: 16 },
  noticeText: { color: '#075985', fontSize: 14 },
  errorBox: { backgroundColor: '#FEE2E2', padding: 14, borderRadius: 10, marginBottom: 16 },
  errorText: { color: '#991B1B', fontSize: 14 },
});
