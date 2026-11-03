import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- TIPOS ---
type User = {
  id: number;
  email: string;
  full_name: string;
  user_type: 'TRAVELER' | 'BUSINESS';
};

type Place = {
  id: number;
  establishment_name: string;
  category: string;
  city: string;
  state: string;
  description?: string | null;
  full_address?: string | null;
  price: number | null;
  main_image?: string | null;
  has_access_ramp: boolean;
  has_adapted_bathroom: boolean;
  allows_guide_dog: boolean;
  has_braille_signage: boolean;
  has_sign_language_interpreter: boolean;
  has_asd_friendly_space: boolean;
};

type ApiError = { message?: string };

type Screen = 'home' | 'login' | 'register';

// --- CONFIGURAÇÃO DA API ---
const API_URL = 'http://192.168.1.15:3000/api'; 
const api = axios.create({ baseURL: API_URL, timeout: 10000 });

const categories = [
  { value: '', label: 'Todos' },
  { value: 'ACCOMMODATION', label: 'Hospedagem' },
  { value: 'GASTRONOMY', label: 'Gastronomia' },
  { value: 'TOURIST_ATTRACTION', label: 'Atrações' },
  { value: 'OTHERS', label: 'Outros' },
];

const categoryLabel = (category: string) => categories.find((item) => item.value === category)?.label ?? category;
const favoriteStorageKey = (userId: number) => `@TruAcess:favoritos:${userId}`;

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiError>(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [user, setUser] = useState<User | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
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

  const loadPlaces = async () => {
    setPlacesLoading(true);
    try {
      const response = await api.get<{ places: Place[] }>('/places', { params: { limit: 100 } });
      setPlaces(response.data.places);
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Não foi possível carregar os locais.'));
    } finally {
      setPlacesLoading(false);
    }
  };

  const restoreSession = async () => {
    try {
      const token = await SecureStore.getItemAsync('@TruAcess:token');
      if (!token) return;
      const response = await api.get<{ user: User }>('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      setUser(response.data.user);
    } catch (restoreError) {
      await SecureStore.deleteItemAsync('@TruAcess:token');
    }
  };

  const loadFavorites = async (userId: number) => {
    try {
      const saved = await AsyncStorage.getItem(favoriteStorageKey(userId));
      setFavorites(saved ? (JSON.parse(saved) as number[]) : []);
    } catch (err) {
      console.error('Erro ao carregar favoritos', err);
    }
  };

  const filteredPlaces = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return places.filter((place) => {
      const matchesCategory = !category || place.category === category;
      const matchesSearch = !query || [place.establishment_name, place.city, place.state, place.description ?? ''].some((value) => value.toLocaleLowerCase('pt-BR').includes(query));
      const matchesFavorites = !showFavorites || favorites.includes(place.id);
      return matchesCategory && matchesSearch && matchesFavorites;
    });
  }, [category, favorites, places, search, showFavorites]);

  const toggleFavorite = async (placeId: number) => {
    if (!user) {
      setNotice('Entre na sua conta para salvar locais.');
      setScreen('login');
      return;
    }
    const nextFavorites = favorites.includes(placeId) ? favorites.filter((id) => id !== placeId) : [...favorites, placeId];
    setFavorites(nextFavorites);
    try {
      await AsyncStorage.setItem(favoriteStorageKey(user.id), JSON.stringify(nextFavorites));
    } catch (err) {
      setFavorites(favorites);
      setError('Não foi possível salvar este local.');
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const response = await api.post<{ token: string; user: User }>('/auth/login', { email, password, expected_role: 'TRAVELER' });
      await SecureStore.setItemAsync('@TruAcess:token', response.data.token);
      setUser(response.data.user);
      setPassword('');
      setScreen('home');
    } catch (loginError) {
      const apiError = axios.isAxiosError<ApiError>(loginError) ? loginError.response?.data : undefined;
      setError(apiError?.message ?? 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim()) { setError('Informe seu nome.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const response = await api.post<{ token: string; user: User }>('/auth/register', { full_name: fullName.trim(), email, password, user_type: 'TRAVELER' });
      await SecureStore.setItemAsync('@TruAcess:token', response.data.token);
      setUser(response.data.user);
      setPassword('');
      setScreen('home');
    } catch (registerError) {
      setError(getErrorMessage(registerError, 'Não foi possível criar sua conta.'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('@TruAcess:token');
    setUser(null);
    setFavorites([]);
    setShowFavorites(false);
    setSelectedPlace(null);
    setNotice('Você saiu da sua conta.');
  };

  // Ícones corrigidos para a tela de detalhes
  const renderPlaceDetails = (place: Place) => (
    <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.detailsHeader}>
        <Pressable onPress={() => setSelectedPlace(null)} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#052659" />
        </Pressable>
        <Text style={styles.detailsCategory}>{categoryLabel(place.category)}</Text>
      </View>
      
      <View style={styles.detailsImagePlaceholder}>
        <Ionicons name="image-outline" size={48} color="#CBD5E1" />
        <Text style={styles.detailsImageText}>Foto do local</Text>
      </View>

      <View style={styles.detailsContent}>
        <Text style={styles.detailsTitle}>{place.establishment_name}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color="#64748B" />
          <Text style={styles.locationText}>{place.full_address || `${place.city}, ${place.state}`}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre o local</Text>
          <Text style={styles.description}>{place.description || 'Descrição não disponível.'}</Text>
          <Text style={styles.price}>
            {place.price == null || place.price === 0 ? 'Gratuito' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(place.price / 100)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acessibilidade</Text>
          <View style={styles.tagsContainer}>
            {place.has_access_ramp && (
              <View style={styles.tag}>
                <Ionicons name="accessibility" size={14} color="#087F8C" />
                <Text style={styles.tagText}>Rampa de acesso</Text>
              </View>
            )}
            {place.has_adapted_bathroom && (
              <View style={styles.tag}>
                <Ionicons name="water-outline" size={14} color="#087F8C" />
                <Text style={styles.tagText}>Banheiro adaptado</Text>
              </View>
            )}
            {place.allows_guide_dog && (
              <View style={styles.tag}>
                <Ionicons name="dog" size={14} color="#087F8C" />
                <Text style={styles.tagText}>Permite cão-guia</Text>
              </View>
            )}
            {place.has_braille_signage && (
              <View style={styles.tag}>
                <Ionicons name="eye-outline" size={14} color="#087F8C" />
                <Text style={styles.tagText}>Sinalização Braille</Text>
              </View>
            )}
            {place.has_sign_language_interpreter && (
              <View style={styles.tag}>
                <Ionicons name="hand-left-outline" size={14} color="#087F8C" />
                <Text style={styles.tagText}>Intérprete de Libras</Text>
              </View>
            )}
            {place.has_asd_friendly_space && (
              <View style={styles.tag}>
                <Ionicons name="people-outline" size={14} color="#087F8C" />
                <Text style={styles.tagText}>Espaço TEA</Text>
              </View>
            )}
            {!place.has_access_ramp && !place.has_adapted_bathroom && !place.allows_guide_dog && !place.has_braille_signage && !place.has_sign_language_interpreter && !place.has_asd_friendly_space && (
              <Text style={styles.noInfoText}>Nenhum recurso de acessibilidade informado.</Text>
            )}
          </View>
        </View>

        <Pressable onPress={() => void toggleFavorite(place.id)} style={[styles.saveButtonLarge, favorites.includes(place.id) && styles.saveButtonLargeActive]}>
          <Ionicons name={favorites.includes(place.id) ? 'heart' : 'heart-outline'} size={20} color={favorites.includes(place.id) ? '#FFF' : '#052659'} />
          <Text style={[styles.saveButtonTextLarge, favorites.includes(place.id) && styles.saveButtonTextLargeActive]}>
            {favorites.includes(place.id) ? 'Remover dos salvos' : 'Salvar local'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  // --- RENDERIZAÇÃO PRINCIPAL ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Pressable onPress={() => { setSelectedPlace(null); setShowFavorites(false); setScreen('home'); }}>
          <Text style={styles.brand}>Tru<Text style={styles.brandAccent}>Acess</Text></Text>
        </Pressable>
        {user ? (
          <View style={styles.headerActions}>
            <View style={styles.userBadge}>
              <Ionicons name="person-circle" size={20} color="#052659" />
              <Text numberOfLines={1} style={styles.userName}>{user.full_name.split(' ')[0]}</Text>
            </View>
            <Pressable onPress={() => void handleLogout()} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.headerActions}>
            <Pressable onPress={() => { setScreen('login'); setError(''); setNotice(''); }} style={styles.headerLink}>
              <Text style={styles.headerLinkText}>Entrar</Text>
            </Pressable>
            <Pressable onPress={() => { setScreen('register'); setError(''); setNotice(''); }} style={styles.headerSignup}>
              <Text style={styles.headerSignupText}>Cadastrar</Text>
            </Pressable>
          </View>
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        {screen !== 'home' ? (
          <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.authCard}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>Tru<Text style={styles.logoAccent}>Acess</Text></Text>
              </View>
              <Text style={styles.authTitle}>
                {screen === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
              </Text>
              <Text style={styles.authSubtitle}>
                {screen === 'login' ? 'Acesse seus locais salvos.' : 'Cadastre-se para salvar destinos.'}
              </Text>
              
              {notice ? <View style={styles.noticeBox}><Ionicons name="information-circle" size={18} color="#075985" /><Text style={styles.noticeText}>{notice}</Text></View> : null}
              {error ? <View style={styles.errorBox}><Ionicons name="alert-circle" size={18} color="#991B1B" /><Text style={styles.errorText}>{error}</Text></View> : null}

              {screen === 'register' && (
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#94A3B8" />
                  <TextInput value={fullName} onChangeText={setFullName} placeholder="Nome completo" style={styles.input} autoCapitalize="words" />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" />
                <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" style={styles.input} keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                <TextInput value={password} onChangeText={setPassword} placeholder="Senha (mínimo 6 caracteres)" style={styles.input} secureTextEntry />
              </View>
              
              <Pressable onPress={() => void (screen === 'login' ? handleLogin() : handleRegister())} disabled={loading} style={[styles.primaryButton, loading && styles.disabledButton]}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>{screen === 'login' ? 'Entrar' : 'Cadastrar'}</Text>}
              </Pressable>

              <Pressable onPress={() => { setError(''); setNotice(''); setScreen(screen === 'login' ? 'register' : 'login'); }} style={styles.switchAuthButton}>
                <Text style={styles.switchAuthText}>{screen === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}</Text>
              </Pressable>
              
              <Pressable onPress={() => { setSelectedPlace(null); setScreen('home'); setError(''); setNotice(''); }} style={styles.backHomeButton}>
                <Ionicons name="arrow-back" size={16} color="#64748B" />
                <Text style={styles.backHomeText}>Voltar aos locais</Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : selectedPlace ? (
          renderPlaceDetails(selectedPlace)
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.heroSection}>
              <Text style={styles.eyebrow}>TURISMO ACESSÍVEL</Text>
              <Text style={styles.heroTitle}>Encontre seu próximo <Text style={styles.heroTitleAccent}>destino</Text></Text>
              <Text style={styles.heroSubtitle}>Locais com informações para planejar sua viagem.</Text>
            </View>

            {notice && <View style={styles.noticeBox}><Ionicons name="information-circle" size={18} color="#075985" /><Text style={styles.noticeText}>{notice}</Text></View>}
            {error && <View style={styles.errorBox}><Ionicons name="alert-circle" size={18} color="#991B1B" /><Text style={styles.errorText}>{error}</Text></View>}

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Buscar por local ou cidade" style={styles.searchInput} />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {categories.map((item) => (
                <Pressable key={item.value || 'all'} onPress={() => { setCategory(item.value); setShowFavorites(false); }} style={[styles.filterButton, category === item.value && !showFavorites && styles.activeFilter]}>
                  <Text style={[styles.filterText, category === item.value && !showFavorites && styles.activeFilterText]}>{item.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {user && (
              <Pressable onPress={() => setShowFavorites((current) => !current)} style={[styles.favoritesToggle, showFavorites && styles.favoritesToggleActive]}>
                <Ionicons name={showFavorites ? 'heart' : 'heart-outline'} size={18} color={showFavorites ? '#FFF' : '#052659'} />
                <Text style={[styles.favoritesToggleText, showFavorites && styles.favoritesToggleTextActive]}>
                  {showFavorites ? 'Ver todos' : `Salvos (${favorites.length})`}
                </Text>
              </Pressable>
            )}

            {placesLoading ? (
              <ActivityIndicator color="#2AC2D2" size="large" style={styles.spinner} />
            ) : filteredPlaces.length > 0 ? (
              filteredPlaces.map((place) => (
                <Pressable key={place.id} onPress={() => setSelectedPlace(place)} style={styles.placeCard}>
                  <View style={styles.placeCardHeader}>
                    <Text style={styles.category}>{categoryLabel(place.category)}</Text>
                    <Pressable onPress={(e) => { e.stopPropagation(); void toggleFavorite(place.id); }} style={styles.heartButton}>
                      <Ionicons name={favorites.includes(place.id) ? 'heart' : 'heart-outline'} size={22} color={favorites.includes(place.id) ? '#EF4444' : '#94A3B8'} />
                    </Pressable>
                  </View>
                  <Text style={styles.placeName} numberOfLines={1}>{place.establishment_name}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color="#64748B" />
                    <Text style={styles.placeLocation} numberOfLines={1}>{place.city}, {place.state}</Text>
                  </View>
                  {place.description && <Text numberOfLines={2} style={styles.description}>{place.description}</Text>}
                  <View style={styles.cardFooter}>
                    <View style={styles.accessibilityRow}>
                      {place.has_access_ramp && <Ionicons name="accessibility" size={14} color="#087F8C" />}
                      {place.has_asd_friendly_space && <Ionicons name="people" size={14} color="#087F8C" />}
                      <Text style={styles.accessibilityText}>
                        {[place.has_access_ramp && 'Rampa', place.has_asd_friendly_space && 'TEA'].filter(Boolean).join(' · ') || 'Acessível'}
                      </Text>
                    </View>
                    <Text style={styles.seeMoreText}>Ver detalhes ›</Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyStateText}>{showFavorites ? 'Você ainda não salvou locais.' : 'Nenhum local encontrado.'}</Text>
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  keyboardView: { flex: 1 },
  header: { height: 60, paddingHorizontal: 20, backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  brand: { color: '#052659', fontSize: 22, fontWeight: '800' },
  brandAccent: { color: '#2AC2D2' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  userName: { color: '#052659', fontSize: 13, fontWeight: '600', maxWidth: 100 },
  logoutButton: { padding: 8 },
  headerLink: { padding: 8 },
  headerLinkText: { color: '#052659', fontWeight: '600', fontSize: 14 },
  headerSignup: { backgroundColor: '#052659', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  headerSignupText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  
  content: { padding: 20, paddingBottom: 40 },
  heroSection: { marginBottom: 20 },
  eyebrow: { color: '#2AC2D2', fontSize: 12, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  heroTitle: { color: '#052659', fontSize: 28, lineHeight: 34, fontWeight: '800', marginBottom: 8 },
  heroTitleAccent: { color: '#2AC2D2' },
  heroSubtitle: { color: '#64748B', fontSize: 15, lineHeight: 22 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, marginBottom: 16 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#0F172A' },
  
  filters: { gap: 8, marginBottom: 16 },
  filterButton: { borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: 'transparent' },
  activeFilter: { backgroundColor: '#052659', borderColor: '#052659' },
  filterText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  activeFilterText: { color: '#FFFFFF' },

  favoritesToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F0F9FF', borderRadius: 10, paddingVertical: 12, marginBottom: 16, borderWidth: 1, borderColor: '#BAE6FD' },
  favoritesToggleActive: { backgroundColor: '#052659', borderColor: '#052659' },
  favoritesToggleText: { color: '#052659', fontWeight: '700', fontSize: 14 },
  favoritesToggleTextActive: { color: '#FFFFFF' },

  placeCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  placeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  category: { color: '#087F8C', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.6, fontWeight: '800' },
  heartButton: { padding: 4 },
  placeName: { color: '#052659', fontWeight: '700', fontSize: 17, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  placeLocation: { color: '#64748B', fontSize: 13 },
  description: { color: '#475569', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  accessibilityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  accessibilityText: { color: '#475569', fontSize: 12, fontWeight: '500' },
  seeMoreText: { color: '#2AC2D2', fontSize: 13, fontWeight: '700' },

  spinner: { marginTop: 40 },
  emptyState: { alignItems: 'center', marginTop: 40, padding: 20 },
  emptyStateText: { textAlign: 'center', color: '#64748B', marginTop: 12, fontSize: 15, lineHeight: 22 },

  detailsContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  detailsHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  detailsCategory: { color: '#2AC2D2', textTransform: 'uppercase', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  detailsImagePlaceholder: { height: 200, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', gap: 8 },
  detailsImageText: { color: '#94A3B8', fontWeight: '600' },
  detailsContent: { padding: 20 },
  detailsTitle: { color: '#052659', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  locationText: { color: '#64748B', fontSize: 14 },
  section: { marginTop: 24 },
  sectionTitle: { color: '#052659', fontWeight: '700', fontSize: 18, marginBottom: 12 },
  price: { color: '#052659', fontSize: 22, fontWeight: '800', marginTop: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0F9FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#BAE6FD' },
  tagText: { color: '#052659', fontSize: 13, fontWeight: '600' },
  noInfoText: { color: '#94A3B8', fontSize: 14, fontStyle: 'italic' },
  saveButtonLarge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#052659', borderRadius: 12, paddingVertical: 16, marginTop: 32 },
  saveButtonLargeActive: { backgroundColor: '#052659' },
  saveButtonTextLarge: { color: '#052659', fontSize: 16, fontWeight: '700' },
  saveButtonTextLargeActive: { color: '#FFFFFF' },

  authContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  authCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4 },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logoText: { fontSize: 32, fontWeight: '800', color: '#052659' },
  logoAccent: { color: '#2AC2D2' },
  authTitle: { color: '#052659', fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  authSubtitle: { color: '#64748B', fontSize: 15, lineHeight: 22, marginBottom: 24, textAlign: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, marginBottom: 14 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#0F172A', marginLeft: 10 },
  primaryButton: { backgroundColor: '#052659', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 12 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  switchAuthButton: { alignItems: 'center', marginTop: 16, padding: 12 },
  switchAuthText: { color: '#052659', fontWeight: '600', fontSize: 14 },
  backHomeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, padding: 12 },
  backHomeText: { color: '#64748B', fontSize: 14 },
  noticeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E0F2FE', padding: 14, borderRadius: 10, marginBottom: 16 },
  noticeText: { color: '#075985', fontSize: 14, flex: 1 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEE2E2', padding: 14, borderRadius: 10, marginBottom: 16 },
  errorText: { color: '#991B1B', fontSize: 14, flex: 1 },
});