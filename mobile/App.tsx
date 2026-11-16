import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

// ⚠️ IP REAL DO SEU COMPUTADOR
const API_URL = 'http://10.75.154.249:3000/api';
const api = axios.create({ baseURL: API_URL, timeout: 10000 });

type User = { id: number; email: string; full_name: string; user_type: string };
type Place = {
  id: number;
  establishment_name: string;
  category: string;
  city: string;
  state: string;
  description?: string;
  full_address?: string;
  price: number;
  main_image?: string | null;
  is_public?: boolean;
  has_access_ramp: boolean;
  has_adapted_bathroom: boolean;
  allows_guide_dog: boolean;
  has_braille_signage: boolean;
  has_sign_language_interpreter: boolean;
  has_asd_friendly_space: boolean;
};
type Screen = 'home' | 'login' | 'register';

const categories = [
  { value: '', label: 'Todos' },
  { value: 'ACCOMMODATION', label: 'Hospedagem' },
  { value: 'GASTRONOMY', label: 'Gastronomia' },
  { value: 'TOURIST_ATTRACTION', label: 'Atrações turísticas' },
  { value: 'OTHERS', label: 'Outros' },
];

const favoriteStorageKey = (userId: number) => `TruAcessFavoritos${userId}`;

// ✅ FORMATAÇÃO DE PREÇO CORRIGIDA
const formatPrice = (price: number | null | undefined): string => {
  if (price == null || price === 0 || price === 0.0) return 'Gratuito';
  // Se o valor for muito pequeno (ex: 0.70), provavelmente está em reais com centavos
  if (price < 10) return `R$ ${price.toFixed(2).replace('.', ',')}`;
  // Se for um valor normal (ex: 70, 150, 250), está em reais
  if (price < 10000) return `R$ ${price.toFixed(2).replace('.', ',')}`;
  // Se for muito grande (ex: 7000), provavelmente está em centavos
  return `R$ ${(price / 100).toFixed(2).replace('.', ',')}`;
};

// Verifica se é gratuito
const isFree = (price: number | null | undefined): boolean => {
  return price == null || price === 0 || price === 0.0;
};

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
      const res = await api.get<any>('/places', { params: { limit: 100 } });
      const data = res.data;
      const placesArray = Array.isArray(data) ? data : (data.places || []);
      console.log('📍 Locais carregados:', placesArray.length);
      placesArray.forEach(p => {
        console.log(`- ${p.establishment_name} | Preço: ${p.price} | Formatado: ${formatPrice(p.price)} | Público: ${p.is_public}`);
      });
      setPlaces(placesArray);
      setError('');
    } catch (err: any) {
      console.error('❌ Erro ao carregar locais:', err.message);
      setError('Erro ao carregar locais. Verifique o IP da API: ' + API_URL);
    } finally {
      setPlacesLoading(false);
    }
  };

  const restoreSession = async () => {
    try {
      const token = await SecureStore.getItemAsync('TruAcessToken');
      if (!token) return;
      const res = await api.get<any>('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
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
      const matchSearch = !q || [p.establishment_name, p.city, p.state].some(v => v.toLowerCase().includes(q));
      const matchFav = !showFavorites || favorites.includes(p.id);
      return matchCat && matchSearch && matchFav;
    });
  }, [category, favorites, places, search, showFavorites]);

  const toggleFavorite = async (placeId: number) => {
    if (!user) { setNotice('Faça login para salvar.'); setScreen('login'); return; }
    const next = favorites.includes(placeId) ? favorites.filter(id => id !== placeId) : [...favorites, placeId];
    setFavorites(next);
    await AsyncStorage.setItem(favoriteStorageKey(user.id), JSON.stringify(next));
  };

  const handleLogin = async () => {
    setLoading(true); setError(''); setNotice('');
    try {
      const res = await api.post<any>('/auth/login', { email, password, expected_role: 'TRAVELER' });
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
      const res = await api.post<any>('/auth/register', { full_name: fullName.trim(), email, password, user_type: 'TRAVELER' });
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
    setNotice('Você saiu da conta.');
  };

  // --- TELA DE AUTENTICAÇÃO ---
  if (screen !== 'home') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.authCard}>
            <Text style={styles.logoText}>Tru<Text style={styles.logoAccent}>Acess</Text></Text>
            <Text style={styles.authTitle}>{screen === 'login' ? 'Bem-vindo!' : 'Crie sua conta'}</Text>

            {notice ? <View style={styles.noticeBox}><Text style={styles.noticeText}>{notice}</Text></View> : null}
            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            {screen === 'register' && (
              <View style={styles.inputWrap}>
                <Ionicons name="person" size={20} color="#94A3B8" />
                <TextInput value={fullName} onChangeText={setFullName} placeholder="Nome completo" style={styles.input} />
              </View>
            )}

            <View style={styles.inputWrap}>
              <Ionicons name="mail" size={20} color="#94A3B8" />
              <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" style={styles.input} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed" size={20} color="#94A3B8" />
              <TextInput value={password} onChangeText={setPassword} placeholder="Senha (mín. 6)" style={styles.input} secureTextEntry />
            </View>

            <Pressable onPress={() => screen === 'login' ? handleLogin() : handleRegister()} disabled={loading} style={[styles.primaryBtn, loading && styles.disabledBtn]}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>{screen === 'login' ? 'Entrar' : 'Cadastrar'}</Text>}
            </Pressable>

            <Pressable onPress={() => { setError(''); setNotice(''); setScreen(screen === 'login' ? 'register' : 'login'); }} style={styles.switchBtn}>
              <Text style={styles.switchBtnText}>{screen === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}</Text>
            </Pressable>

            <Pressable onPress={() => { setScreen('home'); setError(''); setNotice(''); }} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={16} color="#64748B" />
              <Text style={styles.backBtnText}>Voltar</Text>
            </Pressable>
          </View>
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

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.detailsHeader}>
            <Pressable onPress={() => setSelectedPlace(null)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#052659" />
            </Pressable>
            <Text style={styles.detailsCategory}>{placeCategoryLabel}</Text>
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
              <Text style={styles.locText}>{selectedPlace.full_address || `${selectedPlace.city}, ${selectedPlace.state}`}</Text>
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
                <Text style={styles.summaryValue}>1</Text>
              </View>
              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Acessibilidade</Text>
                <View style={styles.accessibilityRating}>
                  <Ionicons name="accessibility" size={16} color="#2AC2D2" />
                  <Text style={styles.accessibilityScore}>5.0/5</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sobre</Text>
              <Text style={styles.desc}>{selectedPlace.description || 'Descrição não disponível.'}</Text>
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
        {user ? (
          <View style={styles.headerActions}>
            <Text style={styles.userName}>{user.full_name.split(' ')[0]}</Text>
            <Pressable onPress={handleLogout}><Ionicons name="log-out" size={20} color="#EF4444" /></Pressable>
          </View>
        ) : (
          <View style={styles.headerActions}>
            <Pressable onPress={() => setScreen('login')}><Text style={styles.headerLinkText}>Entrar</Text></Pressable>
            <Pressable onPress={() => setScreen('register')} style={styles.headerSignup}><Text style={styles.headerSignupText}>Cadastrar</Text></Pressable>
          </View>
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>TURISMO ACESSÍVEL</Text>
            <Text style={styles.heroTitle}>Encontre seu <Text style={styles.heroAccent}>destino</Text></Text>
          </View>

          {notice && <View style={styles.noticeBox}><Text style={styles.noticeText}>{notice}</Text></View>}
          {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput value={search} onChangeText={setSearch} placeholder="Buscar local ou cidade" style={styles.searchInput} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {categories.map((item) => (
              <Pressable key={item.value} onPress={() => { setCategory(item.value); setShowFavorites(false); }} style={[styles.filterBtn, category === item.value && !showFavorites && styles.filterActive]}>
                <Text style={[styles.filterText, category === item.value && !showFavorites && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {user && (
            <Pressable onPress={() => setShowFavorites(c => !c)} style={[styles.favToggle, showFavorites && styles.favToggleActive]}>
              <Ionicons name={showFavorites ? 'heart' : 'heart-outline'} size={18} color={showFavorites ? '#FFF' : '#052659'} />
              <Text style={[styles.favToggleText, showFavorites && styles.favToggleTextActive]}>
                {showFavorites ? 'Ver todos' : `Salvos (${favorites.length})`}
              </Text>
            </Pressable>
          )}

          {placesLoading ? (
            <ActivityIndicator color="#2AC2D2" size="large" style={styles.spinner} />
          ) : filteredPlaces.length > 0 ? (
            filteredPlaces.map((place) => {
              const free = isFree(place.price);
              const isPublic = place.is_public === true;
              return (
                <Pressable key={place.id} onPress={() => setSelectedPlace(place)} style={styles.card}>
                  <View style={styles.cardImageContainer}>
                    {place.main_image ? (
                      <Image
                        source={{ uri: place.main_image }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.cardImagePlaceholder}>
                        <Ionicons name="image-outline" size={40} color="#CBD5E1" />
                        <Text style={styles.cardImagePlaceholderText}>Sem foto</Text>
                      </View>
                    )}
                    {/* ✅ BADGES NO CARD */}
                    {(free || isPublic) && (
                      <View style={styles.cardBadges}>
                        {free && <View style={styles.cardBadgeFree}><Text style={styles.cardBadgeFreeText}>Grátis</Text></View>}
                        {isPublic && <View style={styles.cardBadgePublic}><Text style={styles.cardBadgePublicText}>Público</Text></View>}
                      </View>
                    )}
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardCat}>{categories.find(c => c.value === place.category)?.label || place.category}</Text>
                      <Pressable onPress={(e) => { e.stopPropagation(); toggleFavorite(place.id); }}>
                        <Ionicons name={favorites.includes(place.id) ? 'heart' : 'heart-outline'} size={22} color={favorites.includes(place.id) ? '#EF4444' : '#94A3B8'} />
                      </Pressable>
                    </View>
                    <Text style={styles.cardName}>{place.establishment_name}</Text>
                    <View style={styles.locRow}>
                      <Ionicons name="location" size={14} color="#64748B" />
                      <Text style={styles.locText}>{place.city}, {place.state}</Text>
                    </View>
                    {/* ✅ PREÇO NO CARD */}
                    <Text style={[styles.cardPrice, free && styles.cardPriceFree]}>
                      {formatPrice(place.price)}
                    </Text>
                    {place.description && <Text numberOfLines={2} style={styles.desc}>{place.description}</Text>}
                    <View style={styles.cardFooter}>
                      <Text style={styles.seeMore}>Ver detalhes ›</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.empty}>
              <Ionicons name="search" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>{showFavorites ? 'Nenhum local salvo.' : 'Nenhum local encontrado.'}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: { padding: 20, paddingBottom: 40 },
  hero: { marginBottom: 20 },
  eyebrow: { color: '#2AC2D2', fontSize: 12, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  heroTitle: { color: '#052659', fontSize: 28, fontWeight: '800' },
  heroAccent: { color: '#2AC2D2' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, marginBottom: 16 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#0F172A', marginLeft: 10 },
  filters: { gap: 8, marginBottom: 16 },
  filterBtn: { borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#F1F5F9' },
  filterActive: { backgroundColor: '#052659' },
  filterText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  filterTextActive: { color: '#FFF' },
  favToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F0F9FF', borderRadius: 10, paddingVertical: 12, marginBottom: 16, borderWidth: 1, borderColor: '#BAE6FD' },
  favToggleActive: { backgroundColor: '#052659', borderColor: '#052659' },
  favToggleText: { color: '#052659', fontWeight: '700', fontSize: 14 },
  favToggleTextActive: { color: '#FFF' },

  // Card
  card: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  cardImageContainer: { width: '100%', height: 160, backgroundColor: '#E2E8F0', overflow: 'hidden', position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  cardImagePlaceholderText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  cardBadges: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 },
  cardBadgeFree: { backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  cardBadgeFreeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  cardBadgePublic: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  cardBadgePublicText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 16 },
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
  detailsHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  detailsCategory: { color: '#2AC2D2', textTransform: 'uppercase', fontSize: 12, fontWeight: '800' },
  detailsImageContainer: { height: 220, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  detailsImage: { width: '100%', height: '100%' },
  detailsImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  detailsImageText: { color: '#94A3B8', fontWeight: '600' },
  detailsContent: { padding: 20 },
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
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: { color: '#052659', fontSize: 22, fontWeight: '800', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  summaryLabel: { color: '#64748B', fontSize: 15, fontWeight: '500' },
  summaryValue: { color: '#052659', fontSize: 15, fontWeight: '700' },
  summaryPrice: { color: '#052659', fontSize: 18, fontWeight: '800' },
  summaryPriceFree: { color: '#059669', fontSize: 18, fontWeight: '800' },
  summaryDivider: { height: 1, backgroundColor: '#F1F5F9' },
  accessibilityRating: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accessibilityScore: { color: '#2AC2D2', fontSize: 16, fontWeight: '800' },

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
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, padding: 12 },
  backBtnText: { color: '#64748B', fontSize: 14 },
  noticeBox: { backgroundColor: '#E0F2FE', padding: 14, borderRadius: 10, marginBottom: 16 },
  noticeText: { color: '#075985', fontSize: 14 },
  errorBox: { backgroundColor: '#FEE2E2', padding: 14, borderRadius: 10, marginBottom: 16 },
  errorText: { color: '#991B1B', fontSize: 14 },
});