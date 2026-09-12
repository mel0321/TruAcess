import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons } from '@expo/vector-icons';

// ================= CONFIGURAÇÃO =================
const API_URL = 'http://192.168.0.196:3000/api'; // Ajuste para seu IP

// ================= TIPOS TYPESCRIPT =================
interface Place {
  id: number;
  establishment_name: string;
  category: string;
  full_address: string;
  city: string;
  state: string;
  description: string;
  main_image: string | null;
  average_rating: number;
  total_reviews: number;
  has_access_ramp: boolean;
  has_adapted_bathroom: boolean;
  allows_guide_dog: boolean;
  has_braille_signage: boolean;
  has_sign_language_interpreter: boolean;
  has_asd_friendly_space: boolean;
  reviews?: Review[];
}

interface Review {
  id: number;
  user_name: string;
  experience_rating: number;
  accessibility_level: string;
  comment_text: string;
  owner_reply: string | null;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  user_type: 'TRAVELER' | 'BUSINESS';
  avatar_url?: string;
}

interface Destino {
  id: string;
  nome: string;
  categoria: string;
  endereco: string;
  cidade: string;
  estado: string;
  desc: string;
  img: string;
  nMotora: number;
  totalReviews: number;
  acessibilidade: {
    rampa: boolean;
    banheiro: boolean;
    caoGuia: boolean;
    braille: boolean;
    libras: boolean;
    tea: boolean;
  };
  raw: Place;
}

// ================= COMPONENTE PRINCIPAL =================
export default function Index() {
  // Estados de Navegação
  const [telaAtual, setTelaAtual] = useState<string>('Inicio');
  const [tipoLogado, setTipoLogado] = useState<string | null>(null);
  const [usuarioLogado, setUsuarioLogado] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Estados de Modais
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [abaModal, setAbaModal] = useState<string>('entrar');
  const [perfilModal, setPerfilModal] = useState<string>('usuario');
  const [destinoSelecionado, setDestinoSelecionado] = useState<Destino | null>(null);
  const [modalDestinoVisible, setModalDestinoVisible] = useState<boolean>(false);
  const [modalVerificarVisible, setModalVerificarVisible] = useState<boolean>(false);
  const [emailVerificar, setEmailVerificar] = useState<string>('');
  const [codigoVerificar, setCodigoVerificar] = useState<string>('');

  // Estados de Pilares (Accordion)
  const [pilarAberto, setPilarAberto] = useState<string | null>(null);

  // Estados de Formulário Auth
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [nome, setNome] = useState<string>('');
  const [confirmarSenha, setConfirmarSenha] = useState<string>('');
  const [loadingAuth, setLoadingAuth] = useState<boolean>(false);

  // Estados de Destinos
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todos');
  const [busca, setBusca] = useState<string>('');
  const [loadingDestinos, setLoadingDestinos] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Estados de Avaliação
  const [novoComentario, setNovoComentario] = useState<string>('');
  const [novaNota, setNovaNota] = useState<string>('5');
  const [nivelAcessibilidade, setNivelAcessibilidade] = useState<string>('GOOD');
  const [loadingReview, setLoadingReview] = useState<boolean>(false);

  // Estados de Cadastro de Local (Business)
  const [novoNome, setNovoNome] = useState<string>('');
  const [novoEnd, setNovoEnd] = useState<string>('');
  const [novoDesc, setNovoDesc] = useState<string>('');
  const [novaCat, setNovaCat] = useState<string>('GASTRONOMY');
  const [novoCidade, setNovoCidade] = useState<string>('');
  const [novoEstado, setNovoEstado] = useState<string>('');
  const [novoPreco, setNovoPreco] = useState<string>('');
  const [rampa, setRampa] = useState<boolean>(true);
  const [banheiro, setBanheiro] = useState<boolean>(true);
  const [caoGuia, setCaoGuia] = useState<boolean>(true);
  const [libras, setLibras] = useState<boolean>(false);
  const [braille, setBraille] = useState<boolean>(false);
  const [tea, setTea] = useState<boolean>(false);
  const [loadingLocal, setLoadingLocal] = useState<boolean>(false);

  // Estados de Dashboard Business
  const [stats, setStats] = useState<{
    total_places: number;
    total_reviews: number;
    average_rating: number;
    pending_replies: number;
  } | null>(null);
  const [meusLocais, setMeusLocais] = useState<Place[]>([]);

  // ================= FUNÇÕES DE API =================

  // Carregar dados iniciais
  useEffect(() => {
    const iniciar = async () => {
      try {
        const usuarioSalvo = await AsyncStorage.getItem('usuario');
        const tokenSalvo = await AsyncStorage.getItem('token');
        
        if (usuarioSalvo && tokenSalvo) {
          const user: User = JSON.parse(usuarioSalvo);
          setUsuarioLogado(user);
          setToken(tokenSalvo);
          setTipoLogado(user.user_type === 'BUSINESS' ? 'empresa' : 'usuario');
        }
      } catch (error) {
        console.error('Erro ao carregar sessão:', error);
      }
      carregarDestinos();
    };
    iniciar();
  }, []);

  // Carregar destinos do backend
  const carregarDestinos = useCallback(async () => {
    setLoadingDestinos(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.append('search', busca);
      if (categoriaFiltro !== 'Todos') {
        const catMap: Record<string, string> = {
          'Restaurante': 'GASTRONOMY',
          'Hospedagem': 'ACCOMMODATION',
          'Ponto Turístico': 'TOURIST_ATTRACTION',
        };
        if (catMap[categoriaFiltro]) params.append('category', catMap[categoriaFiltro]);
      }

      const resposta = await fetch(`${API_URL}/places?${params.toString()}`);
      if (!resposta.ok) throw new Error('Falha ao carregar locais');
      
      const dados = await resposta.json();
      const lista: Place[] = Array.isArray(dados) ? dados : (dados.data || []);

      const destinosFormatados: Destino[] = lista.map((place) => ({
        id: place.id.toString(),
        nome: place.establishment_name || 'Sem nome',
        categoria:
          place.category === 'ACCOMMODATION' ? 'Hospedagem' :
          place.category === 'GASTRONOMY' ? 'Restaurante' :
          place.category === 'TOURIST_ATTRACTION' ? 'Ponto Turístico' : 'Outros',
        endereco: place.full_address || '',
        cidade: place.city || '',
        estado: place.state || '',
        desc: place.description || '',
        img: place.main_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500',
        nMotora: place.average_rating || 0,
        totalReviews: place.total_reviews || 0,
        acessibilidade: {
          rampa: place.has_access_ramp,
          banheiro: place.has_adapted_bathroom,
          caoGuia: place.allows_guide_dog,
          braille: place.has_braille_signage,
          libras: place.has_sign_language_interpreter,
          tea: place.has_asd_friendly_space,
        },
        raw: place,
      }));

      setDestinos(destinosFormatados);
    } catch (error) {
      console.error('Erro ao carregar destinos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os locais. Verifique sua conexão.');
    } finally {
      setLoadingDestinos(false);
      setRefreshing(false);
    }
  }, [busca, categoriaFiltro]);

  // Recarregar ao mudar filtros
  useEffect(() => {
    carregarDestinos();
  }, [carregarDestinos]);

  // Login
  const lidarComAutenticacao = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Preencha email e senha.');
      return;
    }
    
    setLoadingAuth(true);
    try {
      const resposta = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: senha,
          expected_role: perfilModal === 'empresa' ? 'BUSINESS' : 'TRAVELER',
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert('Erro', dados.message || 'Falha no login');
        return;
      }

      await AsyncStorage.setItem('usuario', JSON.stringify(dados.user));
      await AsyncStorage.setItem('token', dados.token);

      setUsuarioLogado(dados.user);
      setToken(dados.token);
      setTipoLogado(dados.user.user_type === 'BUSINESS' ? 'empresa' : 'usuario');

      Alert.alert('Sucesso', `Bem-vindo ${dados.user.full_name}!`);
      setModalVisible(false);
      setEmail('');
      setSenha('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoadingAuth(false);
    }
  };

  // Criar Conta
  const criarConta = async () => {
    if (!nome || !email || !senha) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    setLoadingAuth(true);
    try {
      const resposta = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: nome,
          email,
          password: senha,
          user_type: perfilModal === 'empresa' ? 'BUSINESS' : 'TRAVELER',
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert('Erro', dados.message || 'Falha ao cadastrar');
        return;
      }

      Alert.alert(
        'Código Enviado!',
        `Enviamos um código de 4 dígitos para ${email}. Verifique seu e-mail.`,
        [
          {
            text: 'Verificar Agora',
            onPress: () => {
              setAbaModal('entrar');
              setModalVisible(false);
              setEmailVerificar(email);
              setModalVerificarVisible(true);
            },
          },
        ]
      );
      setNome('');
      setEmail('');
      setSenha('');
      setConfirmarSenha('');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar conta.');
    } finally {
      setLoadingAuth(false);
    }
  };

  // Verificar Email
  const verificarEmail = async () => {
    if (codigoVerificar.length !== 4) {
      Alert.alert('Erro', 'O código deve ter 4 dígitos.');
      return;
    }

    setLoadingAuth(true);
    try {
      const resposta = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailVerificar,
          code: codigoVerificar,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert('Erro', dados.message || 'Código inválido');
        return;
      }

      await AsyncStorage.setItem('usuario', JSON.stringify(dados.user));
      await AsyncStorage.setItem('token', dados.token);

      setUsuarioLogado(dados.user);
      setToken(dados.token);
      setTipoLogado(dados.user.user_type === 'BUSINESS' ? 'empresa' : 'usuario');

      Alert.alert('Sucesso', 'E-mail verificado! Bem-vindo!');
      setModalVerificarVisible(false);
      setCodigoVerificar('');
    } catch (error) {
      Alert.alert('Erro', 'Falha na verificação.');
    } finally {
      setLoadingAuth(false);
    }
  };

  // Logout
  const fazerLogout = async () => {
    await AsyncStorage.removeItem('usuario');
    await AsyncStorage.removeItem('token');
    setUsuarioLogado(null);
    setToken(null);
    setTipoLogado(null);
    setTelaAtual('Inicio');
    Alert.alert('Logout', 'Sessão encerrada.');
  };

  // Abrir detalhes do destino
  const abrirDetalhesDestino = async (item: Destino) => {
    setDestinoSelecionado(item);
    setModalDestinoVisible(true);

    // Carregar detalhes completos com reviews
    try {
      const resposta = await fetch(`${API_URL}/places/${item.raw.id}`);
      if (resposta.ok) {
        const dados = await resposta.json();
        setDestinoSelecionado({
          ...item,
          raw: dados,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    }
  };

  // Adicionar Avaliação
  const adicionarAvaliacao = async () => {
    if (!token) {
      Alert.alert('Aviso', 'Você precisa estar logado para avaliar.');
      setModalDestinoVisible(false);
      setModalVisible(true);
      return;
    }
    if (tipoLogado !== 'usuario') {
      Alert.alert('Aviso', 'Apenas viajantes podem avaliar.');
      return;
    }
    if (!novoComentario.trim()) {
      Alert.alert('Erro', 'Escreva um comentário antes de enviar.');
      return;
    }

    setLoadingReview(true);
    try {
      const resposta = await fetch(`${API_URL}/places/${destinoSelecionado?.raw.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          experience_rating: parseInt(novaNota),
          accessibility_level: nivelAcessibilidade,
          comment_text: novoComentario,
        }),
      });

      if (!resposta.ok) {
        const dados = await resposta.json();
        Alert.alert('Erro', dados.message || 'Falha ao enviar avaliação');
        return;
      }

      Alert.alert('Sucesso', 'Obrigado pela sua avaliação!');
      setNovoComentario('');
      setModalDestinoVisible(false);
      carregarDestinos();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar avaliação.');
    } finally {
      setLoadingReview(false);
    }
  };

  // Cadastrar Novo Local (Business)
  const cadastrarNovoLocal = async () => {
    if (!novoNome || !novoEnd || !novoDesc) {
      Alert.alert('Erro', 'Preencha todos os campos do local.');
      return;
    }
    if (!token) {
      Alert.alert('Erro', 'Faça login como empresa.');
      return;
    }

    setLoadingLocal(true);
    try {
      const resposta = await fetch(`${API_URL}/places`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          establishment_name: novoNome,
          category: novaCat,
          full_address: novoEnd,
          city: novoCidade || 'São Paulo',
          state: novoEstado || 'SP',
          description: novoDesc,
          price: novoPreco ? parseInt(novoPreco) * 100 : 0,
          has_access_ramp: rampa ? 1 : 0,
          has_adapted_bathroom: banheiro ? 1 : 0,
          allows_guide_dog: caoGuia ? 1 : 0,
          has_braille_signage: braille ? 1 : 0,
          has_sign_language_interpreter: libras ? 1 : 0,
          has_asd_friendly_space: tea ? 1 : 0,
        }),
      });

      if (!resposta.ok) {
        const dados = await resposta.json();
        Alert.alert('Erro', dados.message || 'Falha ao cadastrar');
        return;
      }

      Alert.alert('Sucesso', 'Estabelecimento publicado!');
      setNovoNome('');
      setNovoEnd('');
      setNovoDesc('');
      setNovoCidade('');
      setNovoEstado('');
      setNovoPreco('');
      setRampa(true);
      setBanheiro(true);
      setCaoGuia(true);
      setLibras(false);
      setBraille(false);
      setTea(false);
      setTelaAtual('Destinos');
      carregarDestinos();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao cadastrar local.');
    } finally {
      setLoadingLocal(false);
    }
  };

  // Carregar Stats Business
  const carregarStatsBusiness = useCallback(async () => {
    if (!token) return;
    try {
      const [statsRes, locaisRes] = await Promise.all([
        fetch(`${API_URL}/business/stats`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/business/places`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (locaisRes.ok) {
        const locaisData = await locaisRes.json();
        setMeusLocais(Array.isArray(locaisData) ? locaisData : []);
      }
    } catch (error) {
      console.error('Erro ao carregar stats:', error);
    }
  }, [token]);

  useEffect(() => {
    if (telaAtual === 'Dashboard') {
      carregarStatsBusiness();
    }
  }, [telaAtual, carregarStatsBusiness]);

  // Toggle Pilar
  const togglePilar = (pilar: string) => {
    setPilarAberto(pilarAberto === pilar ? null : pilar);
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    carregarDestinos();
  };

  // ================= RENDERIZAÇÃO =================
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoTextoAzul}>Viagens sem </Text>
          <Text style={styles.logoTextoEscuro}>Barreiras</Text>
        </View>
        {tipoLogado ? (
          <TouchableOpacity
            style={[
              styles.avatar,
              tipoLogado === 'empresa' ? styles.avatarEmpresa : styles.avatarUsuario,
            ]}
            onPress={() => {
              Alert.alert(
                'Minha Conta',
                `Logado como ${usuarioLogado?.full_name || tipoLogado.toUpperCase()}`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  ...(tipoLogado === 'empresa'
                    ? [{ text: 'Painel Empresa', onPress: () => setTelaAtual('Dashboard') }]
                    : []),
                  { text: 'Sair', onPress: fazerLogout, style: 'destructive' },
                ]
              );
            }}
          >
            <Text style={styles.avatarText}>{tipoLogado === 'empresa' ? 'E' : 'U'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnEntrarHeader} onPress={() => setModalVisible(true)}>
            <Text style={styles.btnEntrarText}>Entrar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CONTEÚDO */}
      <ScrollView
        style={styles.conteudo}
        refreshControl={
          telaAtual === 'Destinos' ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {/* TELA: INÍCIO */}
        {telaAtual === 'Inicio' && (
          <View style={styles.containerInicio}>
            <View style={styles.cardHero}>
              <Feather name="compass" size={40} color="#ffffff" style={{ marginBottom: 15 }} />
              <Text style={styles.tituloBoasVindas}>Explore o mundo sem barreiras</Text>
              <Text style={styles.subtituloHero}>
                Encontre hotéis, restaurantes e pontos turísticos totalmente adaptados para o que
                você precisa.
              </Text>
            </View>
            <View style={styles.secaoRecursos}>
              <Text style={styles.tituloSecao}>Por que usar o app?</Text>
              <View style={styles.recursoItem}>
                <View style={styles.wrapperIcone}>
                  <Feather name="search" size={22} color="#0055ff" />
                </View>
                <View style={styles.recursoTextoContainer}>
                  <Text style={styles.recursoTitulo}>Busca Inteligente</Text>
                  <Text style={styles.recursoDesc}>
                    Filtre os destinos por categorias e localização.
                  </Text>
                </View>
              </View>
              <View style={styles.recursoItem}>
                <View style={styles.wrapperIcone}>
                  <Feather name="award" size={22} color="#0055ff" />
                </View>
                <View style={styles.recursoTextoContainer}>
                  <Text style={styles.recursoTitulo}>Avaliações Reais</Text>
                  <Text style={styles.recursoDesc}>
                    Notas específicas para acessibilidade motora e visual.
                  </Text>
                </View>
              </View>
              <View style={styles.recursoItem}>
                <View style={styles.wrapperIcone}>
                  <Ionicons name="accessibility" size={22} color="#0055ff" />
                </View>
                <View style={styles.recursoTextoContainer}>
                  <Text style={styles.recursoTitulo}>Filtros de Acessibilidade</Text>
                  <Text style={styles.recursoDesc}>
                    Rampa, Libras, Braille, cão-guia, banheiro adaptado e espaço TEA.
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.btnPrincipalInicio}
              onPress={() => setTelaAtual('Destinos')}
            >
              <Text style={styles.btnPrincipalText}>Começar a Buscar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TELA: DESTINOS */}
        {telaAtual === 'Destinos' && (
          <View style={{ padding: 15 }}>
            <View style={styles.searchSection}>
              <Feather style={styles.searchIcon} name="search" size={18} color="#64748b" />
              <TextInput
                style={styles.inputBuscaMinimalista}
                placeholder="Digite o nome ou endereço..."
                value={busca}
                onChangeText={setBusca}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginVertical: 15 }}
            >
              {['Todos', 'Restaurante', 'Hospedagem', 'Ponto Turístico'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.btnFiltro, categoriaFiltro === cat && styles.btnFiltroAtivo]}
                  onPress={() => setCategoriaFiltro(cat)}
                >
                  <Text
                    style={[
                      styles.btnFiltroText,
                      categoriaFiltro === cat && styles.btnFiltroTextAtivo,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loadingDestinos ? (
              <ActivityIndicator size="large" color="#0055ff" style={{ marginTop: 40 }} />
            ) : destinos.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 40 }}>
                Nenhum local encontrado
              </Text>
            ) : (
              destinos.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => abrirDetalhesDestino(item)}
                >
                  <Image source={{ uri: item.img }} style={styles.cardImg} />
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTag}>{item.categoria}</Text>
                    <Text style={styles.cardTitulo}>{item.nome}</Text>
                    <View style={styles.inlineInfoRow}>
                      <Feather name="map-pin" size={13} color="#64748b" />
                      <Text style={styles.cardEnderecoMinimalista}>
                        {item.endereco} {item.cidade ? `- ${item.cidade}/${item.estado}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.desc}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={styles.miniBadge}>
                        <Ionicons name="accessibility" size={14} color="#0055ff" />
                        <Text style={styles.miniBadgeText}>
                          {' '}Motora: {item.nMotora?.toFixed(1) || '0.0'}
                        </Text>
                      </View>
                      <View style={styles.miniBadge}>
                        <Feather name="message-circle" size={14} color="#d97706" />
                        <Text style={styles.miniBadgeText}>
                          {' '}{item.totalReviews} reviews
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.miniBadge,
                          { marginLeft: 'auto', backgroundColor: '#e0eaff' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.miniBadgeText,
                            { color: '#0055ff', fontWeight: '700' },
                          ]}
                        >
                          Ver Detalhes
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* TELA: PILARES */}
        {telaAtual === 'Acessibilidade' && (
          <View style={{ padding: 20 }}>
            <Text style={styles.tituloPage}>Guia de Acessibilidade</Text>
            <Text style={[styles.subtituloPage, { textAlign: 'left', marginBottom: 20 }]}>
              Selecione uma das frentes para entender os critérios estruturais de inclusão urbana.
            </Text>

            {/* MOTOR */}
            <TouchableOpacity
              style={[
                styles.pilarBox,
                { borderLeftColor: '#0055ff' },
                pilarAberto === 'motora' && styles.pilarAtivoBox,
              ]}
              onPress={() => togglePilar('motora')}
            >
              <View style={styles.pilarHeaderRow}>
                <View style={styles.pilarTituloComIcone}>
                  <Ionicons
                    name="accessibility-outline"
                    size={20}
                    color="#0055ff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.pilarTitulo}>Acessibilidade Motora</Text>
                </View>
                <Feather
                  name={pilarAberto === 'motora' ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#64748b"
                />
              </View>
              <Text style={styles.pilarDescShort}>
                Garantia de livre circulação física e eliminação de barreiras arquitetônicas.
              </Text>
              {pilarAberto === 'motora' && (
                <View style={styles.pilarDropdown}>
                  <Text style={styles.pilarTopico}>
                    • Infraestrutura: Rampas de acesso com inclinação padrão ABNT (NBR 9050),
                    portas com vãos mínimos de 80cm e corredores amplos.
                  </Text>
                  <Text style={styles.pilarTopico}>
                    • Sanitários: Banheiros adaptados contendo barras de apoio firmes, bacia
                    sanitária elevada e alarmes de emergência no chão.
                  </Text>
                  <Text style={styles.pilarTopico}>
                    • Mobiliário: Mesas e balcões com altura livre inferior para encaixe perfeito
                    de cadeiras de rodas.
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* VISUAL */}
            <TouchableOpacity
              style={[
                styles.pilarBox,
                { borderLeftColor: '#d97706' },
                pilarAberto === 'visual' && styles.pilarAtivoBox,
              ]}
              onPress={() => togglePilar('visual')}
            >
              <View style={styles.pilarHeaderRow}>
                <View style={styles.pilarTituloComIcone}>
                  <Feather name="eye" size={20} color="#d97706" style={{ marginRight: 8 }} />
                  <Text style={styles.pilarTitulo}>Acessibilidade Visual</Text>
                </View>
                <Feather
                  name={pilarAberto === 'visual' ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#64748b"
                />
              </View>
              <Text style={styles.pilarDescShort}>
                Autonomia direcional, sinalização tátil e canais de comunicação alternativos.
              </Text>
              {pilarAberto === 'visual' && (
                <View style={styles.pilarDropdown}>
                  <Text style={styles.pilarTopico}>
                    • Piso Tátil: Aplicação correta de pisos direcionais e de alerta.
                  </Text>
                  <Text style={styles.pilarTopico}>
                    • Comunicação: Textos em Braille em corrimãos, elevadores e cardápios
                    turísticos digitais.
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* AUDITIVA */}
            <TouchableOpacity
              style={[
                styles.pilarBox,
                { borderLeftColor: '#10b981' },
                pilarAberto === 'auditiva' && styles.pilarAtivoBox,
              ]}
              onPress={() => togglePilar('auditiva')}
            >
              <View style={styles.pilarHeaderRow}>
                <View style={styles.pilarTituloComIcone}>
                  <Feather name="volume-2" size={20} color="#10b981" style={{ marginRight: 8 }} />
                  <Text style={styles.pilarTitulo}>Acessibilidade Auditiva</Text>
                </View>
                <Feather
                  name={pilarAberto === 'auditiva' ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#64748b"
                />
              </View>
              <Text style={styles.pilarDescShort}>
                Intérpretes de Libras, legendas e recursos visuais de apoio.
              </Text>
              {pilarAberto === 'auditiva' && (
                <View style={styles.pilarDropdown}>
                  <Text style={styles.pilarTopico}>
                    • Intérpretes: Profissionais de Libras disponíveis para atendimento e eventos.
                  </Text>
                  <Text style={styles.pilarTopico}>
                    • Sinalização: Indicadores visuais claros e iluminação adequada.
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* TEA */}
            <TouchableOpacity
              style={[
                styles.pilarBox,
                { borderLeftColor: '#8b5cf6' },
                pilarAberto === 'tea' && styles.pilarAtivoBox,
              ]}
              onPress={() => togglePilar('tea')}
            >
              <View style={styles.pilarHeaderRow}>
                <View style={styles.pilarTituloComIcone}>
                  <Ionicons name="heart-outline" size={20} color="#8b5cf6" style={{ marginRight: 8 }} />
                  <Text style={styles.pilarTitulo}>Espaço TEA</Text>
                </View>
                <Feather
                  name={pilarAberto === 'tea' ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#64748b"
                />
              </View>
              <Text style={styles.pilarDescShort}>
                Ambientes adaptados para pessoas com Transtorno do Espectro Autista.
              </Text>
              {pilarAberto === 'tea' && (
                <View style={styles.pilarDropdown}>
                  <Text style={styles.pilarTopico}>
                    • Ambiente: Espaços com redução de estímulos sensoriais.
                  </Text>
                  <Text style={styles.pilarTopico}>
                    • Atendimento: Profissionais treinados para acolhimento especializado.
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* TELA: DASHBOARD BUSINESS */}
        {telaAtual === 'Dashboard' && (
          <View style={{ padding: 20 }}>
            <Text style={styles.tituloPage}>Painel da Empresa</Text>
            <Text style={styles.subtituloPage}>
              Cadastre e gerencie seus locais no mapa acessível
            </Text>

            {stats && (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.total_places || 0}</Text>
                  <Text style={styles.statLabel}>Locais</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.total_reviews || 0}</Text>
                  <Text style={styles.statLabel}>Avaliações</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {stats.average_rating?.toFixed(1) || '0.0'}
                  </Text>
                  <Text style={styles.statLabel}>Nota Média</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.pending_replies || 0}</Text>
                  <Text style={styles.statLabel}>Pendentes</Text>
                </View>
              </View>
            )}

            <Text style={[styles.tituloSecao, { marginTop: 20, marginBottom: 15 }]}>
              Cadastrar Novo Local
            </Text>

            <TextInput
              style={styles.inputForm}
              placeholder="Nome do Estabelecimento"
              value={novoNome}
              onChangeText={setNovoNome}
            />
            <TextInput
              style={styles.inputForm}
              placeholder="Endereço Completo"
              value={novoEnd}
              onChangeText={setNovoEnd}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.inputForm, { flex: 1 }]}
                placeholder="Cidade"
                value={novoCidade}
                onChangeText={setNovoCidade}
              />
              <TextInput
                style={[styles.inputForm, { width: 80 }]}
                placeholder="UF"
                value={novoEstado}
                onChangeText={setNovoEstado}
                maxLength={2}
              />
            </View>
            <TextInput
              style={styles.inputForm}
              placeholder="Descrição das Acessibilidades"
              value={novoDesc}
              onChangeText={setNovoDesc}
              multiline
            />
            <TextInput
              style={styles.inputForm}
              placeholder="Preço médio (em R$)"
              value={novoPreco}
              onChangeText={setNovoPreco}
              keyboardType="numeric"
            />

            <Text style={[styles.labelForm, { marginTop: 10 }]}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
              {[
                { value: 'GASTRONOMY', label: 'Restaurante' },
                { value: 'ACCOMMODATION', label: 'Hospedagem' },
                { value: 'TOURIST_ATTRACTION', label: 'Ponto Turístico' },
                { value: 'OTHERS', label: 'Outros' },
              ].map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.btnFiltro,
                    novaCat === cat.value && styles.btnFiltroAtivo,
                    { marginRight: 10 },
                  ]}
                  onPress={() => setNovaCat(cat.value)}
                >
                  <Text
                    style={[
                      styles.btnFiltroText,
                      novaCat === cat.value && styles.btnFiltroTextAtivo,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.labelForm}>Recursos de Acessibilidade</Text>
            <View style={styles.checkboxGrid}>
              {[
                { label: 'Rampa de acesso', value: rampa, setter: setRampa },
                { label: 'Banheiro adaptado', value: banheiro, setter: setBanheiro },
                { label: 'Permite cão-guia', value: caoGuia, setter: setCaoGuia },
                { label: 'Intérprete de Libras', value: libras, setter: setLibras },
                { label: 'Sinalização Braille', value: braille, setter: setBraille },
                { label: 'Espaço TEA', value: tea, setter: setTea },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.checkboxItem, item.value && styles.checkboxAtivo]}
                  onPress={() => item.setter(!item.value)}
                >
                  <Ionicons
                    name={item.value ? 'checkmark-circle' : 'checkmark-circle-outline'}
                    size={18}
                    color={item.value ? '#fff' : '#0055ff'}
                  />
                  <Text style={[styles.checkboxText, item.value && styles.checkboxTextAtivo]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.btnPrincipal}
              onPress={cadastrarNovoLocal}
              disabled={loadingLocal}
            >
              {loadingLocal ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnPrincipalText}>Publicar Local</Text>
              )}
            </TouchableOpacity>

            {meusLocais.length > 0 && (
              <>
                <Text style={[styles.tituloSecao, { marginTop: 30, marginBottom: 15 }]}>
                  Meus Estabelecimentos ({meusLocais.length})
                </Text>
                {meusLocais.map((local) => (
                  <View key={local.id} style={styles.localCard}>
                    <Text style={styles.localNome}>{local.establishment_name}</Text>
                    <Text style={styles.localInfo}>
                      {local.city}, {local.state} • {local.category}
                    </Text>
                    <Text style={styles.localInfo}>
                      ⭐ {local.average_rating?.toFixed(1) || '0.0'} •{' '}
                      {local.total_reviews || 0} avaliações
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL DETALHES DO DESTINO */}
      <Modal visible={modalDestinoVisible} animationType="slide" transparent={false}>
        {destinoSelecionado && (
          <View style={{ flex: 1, backgroundColor: '#f3f6fa' }}>
            <ScrollView>
              <Image source={{ uri: destinoSelecionado.img }} style={{ width: '100%', height: 240 }} />
              <TouchableOpacity
                style={styles.btnFecharDestino}
                onPress={() => setModalDestinoVisible(false)}
              >
                <Feather name="arrow-left" size={24} color="#051334" />
              </TouchableOpacity>
              <View style={{ padding: 20 }}>
                <Text style={styles.cardTag}>{destinoSelecionado.categoria}</Text>
                <Text style={[styles.cardTitulo, { fontSize: 24, marginBottom: 5 }]}>
                  {destinoSelecionado.nome}
                </Text>
                <View style={[styles.inlineInfoRow, { marginBottom: 15 }]}>
                  <Feather name="map-pin" size={14} color="#64748b" style={{ marginRight: 5 }} />
                  <Text style={{ fontSize: 13, color: '#64748b' }}>
                    {destinoSelecionado.endereco}
                    {destinoSelecionado.cidade
                      ? ` - ${destinoSelecionado.cidade}/${destinoSelecionado.estado}`
                      : ''}
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 25 }}
                >
                  {destinoSelecionado.desc}
                </Text>

                {/* Badges de acessibilidade */}
                <View style={styles.divisor} />
                <Text style={[styles.tituloSecao, { marginBottom: 15 }]}>
                  Recursos de Acessibilidade
                </Text>
                <View style={styles.acessibilidadeGrid}>
                  {destinoSelecionado.acessibilidade.rampa && (
                    <View style={styles.acessibilidadeBadge}>
                      <Ionicons name="accessibility" size={18} color="#0055ff" />
                      <Text style={styles.acessibilidadeText}>Rampa</Text>
                    </View>
                  )}
                  {destinoSelecionado.acessibilidade.banheiro && (
                    <View style={styles.acessibilidadeBadge}>
                      <Feather name="droplet" size={18} color="#0055ff" />
                      <Text style={styles.acessibilidadeText}>Banheiro Adaptado</Text>
                    </View>
                  )}
                  {destinoSelecionado.acessibilidade.caoGuia && (
                    <View style={styles.acessibilidadeBadge}>
                      <Ionicons name="paw" size={18} color="#0055ff" />
                      <Text style={styles.acessibilidadeText}>Cão-Guia</Text>
                    </View>
                  )}
                  {destinoSelecionado.acessibilidade.libras && (
                    <View style={styles.acessibilidadeBadge}>
                      <Feather name="hand" size={18} color="#0055ff" />
                      <Text style={styles.acessibilidadeText}>Libras</Text>
                    </View>
                  )}
                  {destinoSelecionado.acessibilidade.braille && (
                    <View style={styles.acessibilidadeBadge}>
                      <Feather name="eye" size={18} color="#0055ff" />
                      <Text style={styles.acessibilidadeText}>Braille</Text>
                    </View>
                  )}
                  {destinoSelecionado.acessibilidade.tea && (
                    <View style={styles.acessibilidadeBadge}>
                      <Ionicons name="heart" size={18} color="#8b5cf6" />
                      <Text style={styles.acessibilidadeText}>Espaço TEA</Text>
                    </View>
                  )}
                </View>

                <View style={styles.divisor} />
                <Text style={[styles.tituloSecao, { marginBottom: 15 }]}>
                  Níveis de Acessibilidade
                </Text>
                <View style={{ marginBottom: 15 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 5,
                    }}
                  >
                    <Text style={{ fontWeight: '600', color: '#051334' }}>♿ Nota Geral</Text>
                    <Text style={{ fontWeight: '700', color: '#0055ff' }}>
                      {destinoSelecionado.nMotora?.toFixed(1) || '0.0'} / 5.0
                    </Text>
                  </View>
                  <View style={styles.barraGraficoFundo}>
                    <View
                      style={[
                        styles.barraGraficoPreenchimento,
                        {
                          width: `${((destinoSelecionado.nMotora || 0) / 5) * 100}%`,
                          backgroundColor: '#0055ff',
                        },
                      ]}
                    />
                  </View>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 5 }}>
                    Baseado em {destinoSelecionado.totalReviews || 0} avaliações
                  </Text>
                </View>

                {/* Reviews */}
                {destinoSelecionado.raw.reviews &&
                  destinoSelecionado.raw.reviews.length > 0 && (
                    <>
                      <View style={styles.divisor} />
                      <Text style={[styles.tituloSecao, { marginBottom: 15 }]}>
                        Avaliações ({destinoSelecionado.raw.reviews.length})
                      </Text>
                      {destinoSelecionado.raw.reviews.map((review) => (
                        <View key={review.id} style={styles.reviewCard}>
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              marginBottom: 5,
                            }}
                          >
                            <Text style={{ fontWeight: '700', color: '#051334' }}>
                              {review.user_name || 'Usuário'}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                              <Ionicons name="star" size={14} color="#f59e0b" />
                              <Text style={{ fontWeight: '700' }}>{review.experience_rating}</Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 5, marginBottom: 8 }}>
                            <View style={styles.tagNivel}>
                              <Text style={styles.tagNivelText}>{review.accessibility_level}</Text>
                            </View>
                          </View>
                          <Text
                            style={{ fontSize: 14, color: '#475569', lineHeight: 20 }}
                          >
                            {review.comment_text}
                          </Text>
                          {review.owner_reply && (
                            <View style={styles.replyBox}>
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: '#0055ff',
                                  fontWeight: '700',
                                  marginBottom: 3,
                                }}
                              >
                                Resposta do proprietário:
                              </Text>
                              <Text style={{ fontSize: 13, color: '#475569' }}>
                                {review.owner_reply}
                              </Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </>
                  )}

                {/* Formulário de avaliação */}
                {tipoLogado === 'usuario' && (
                  <>
                    <View style={styles.divisor} />
                    <Text style={[styles.tituloSecao, { marginBottom: 10 }]}>
                      Deixe sua Avaliação
                    </Text>
                    <TextInput
                      style={[styles.inputForm, { height: 80, textAlignVertical: 'top' }]}
                      placeholder="Escreva como foi sua experiência..."
                      multiline
                      value={novoComentario}
                      onChangeText={setNovoComentario}
                    />

                    <Text style={styles.labelForm}>Nota da experiência</Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 10,
                        marginBottom: 15,
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => setNovaNota(star.toString())}
                        >
                          <Ionicons
                            name={star <= parseInt(novaNota) ? 'star' : 'star-outline'}
                            size={32}
                            color="#f59e0b"
                          />
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.labelForm}>Nível de acessibilidade</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                      {[
                        { value: 'POOR', label: 'Ruim' },
                        { value: 'GOOD', label: 'Bom' },
                        { value: 'EXCELLENT', label: 'Excelente' },
                      ].map((level) => (
                        <TouchableOpacity
                          key={level.value}
                          style={[
                            styles.levelButton,
                            nivelAcessibilidade === level.value && styles.levelAtivo,
                          ]}
                          onPress={() => setNivelAcessibilidade(level.value)}
                        >
                          <Text
                            style={[
                              styles.levelText,
                              nivelAcessibilidade === level.value && styles.levelTextAtivo,
                            ]}
                          >
                            {level.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.btnPrincipal}
                      onPress={adicionarAvaliacao}
                      disabled={loadingReview}
                    >
                      {loadingReview ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.btnPrincipalText}>Enviar Avaliação</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* MODAL VERIFICAR EMAIL */}
      <Modal visible={modalVerificarVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Verificar E-mail</Text>
            <Text style={styles.modalSubtitulo}>
              Digite o código de 4 dígitos enviado para:
            </Text>
            <Text style={styles.modalEmail}>{emailVerificar}</Text>

            <TextInput
              style={styles.inputCodigo}
              placeholder="0000"
              value={codigoVerificar}
              onChangeText={(text) => setCodigoVerificar(text.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              textAlign="center"
            />

            <TouchableOpacity
              style={styles.btnPrincipal}
              onPress={verificarEmail}
              disabled={loadingAuth}
            >
              {loadingAuth ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrincipalText}>Verificar</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 15 }}
              onPress={() => {
                setModalVerificarVisible(false);
                setCodigoVerificar('');
              }}
            >
              <Text style={{ color: '#64748b' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL LOGIN/CADASTRO */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              <TouchableOpacity onPress={() => setAbaModal('entrar')}>
                <Text
                  style={{
                    fontWeight: abaModal === 'entrar' ? '700' : '400',
                    marginRight: 20,
                    fontSize: 16,
                    color: abaModal === 'entrar' ? '#0055ff' : '#64748b',
                  }}
                >
                  Entrar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAbaModal('criar')}>
                <Text
                  style={{
                    fontWeight: abaModal === 'criar' ? '700' : '400',
                    fontSize: 16,
                    color: abaModal === 'criar' ? '#0055ff' : '#64748b',
                  }}
                >
                  Criar Conta
                </Text>
              </TouchableOpacity>
            </View>

            {abaModal === 'criar' && (
              <TextInput
                style={styles.inputForm}
                placeholder="Nome completo"
                value={nome}
                onChangeText={setNome}
              />
            )}
            <TextInput
              style={styles.inputForm}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.inputForm}
              placeholder="Senha"
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />
            {abaModal === 'criar' && (
              <>
                <TextInput
                  style={styles.inputForm}
                  placeholder="Confirmar Senha"
                  secureTextEntry
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                />
                <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                  <TouchableOpacity
                    style={[styles.perfilBtn, perfilModal === 'usuario' && styles.perfilBtnAtivo]}
                    onPress={() => setPerfilModal('usuario')}
                  >
                    <Text
                      style={[styles.perfilBtnText, perfilModal === 'usuario' && styles.perfilBtnTextAtivo]}
                    >
                      👤 Viajante
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.perfilBtn,
                      perfilModal === 'empresa' && styles.perfilBtnAtivo,
                      { marginLeft: 10 },
                    ]}
                    onPress={() => setPerfilModal('empresa')}
                  >
                    <Text
                      style={[styles.perfilBtnText, perfilModal === 'empresa' && styles.perfilBtnTextAtivo]}
                    >
                      🏢 Empresa
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            <TouchableOpacity
              style={styles.btnPrincipal}
              onPress={abaModal === 'entrar' ? lidarComAutenticacao : criarConta}
              disabled={loadingAuth}
            >
              {loadingAuth ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnPrincipalText}>
                  {abaModal === 'entrar' ? 'Entrar' : 'Criar Conta'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 15 }} onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#64748b' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTelaAtual('Inicio')}>
          <Ionicons
            name="home-outline"
            size={22}
            color={telaAtual === 'Inicio' ? '#0055ff' : '#64748b'}
          />
          <Text style={[styles.tabText, telaAtual === 'Inicio' && styles.tabTextAtivo]}>Início</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTelaAtual('Destinos')}>
          <Ionicons
            name="map-outline"
            size={22}
            color={telaAtual === 'Destinos' ? '#0055ff' : '#64748b'}
          />
          <Text style={[styles.tabText, telaAtual === 'Destinos' && styles.tabTextAtivo]}>Destinos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => setTelaAtual('Acessibilidade')}>
          <Ionicons
            name="accessibility-outline"
            size={22}
            color={telaAtual === 'Acessibilidade' ? '#0055ff' : '#64748b'}
          />
          <Text style={[styles.tabText, telaAtual === 'Acessibilidade' && styles.tabTextAtivo]}>Pilares</Text>
        </TouchableOpacity>
        {tipoLogado === 'empresa' && (
          <TouchableOpacity style={styles.tabItem} onPress={() => setTelaAtual('Dashboard')}>
            <Ionicons
              name="business-outline"
              size={22}
              color={telaAtual === 'Dashboard' ? '#0055ff' : '#64748b'}
            />
            <Text style={[styles.tabText, telaAtual === 'Dashboard' && styles.tabTextAtivo]}>Painel</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ================= ESTILOS =================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f6fa', paddingTop: 45 },
  header: {
    height: 70,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  logoContainer: { flexDirection: 'row' },
  logoTextoAzul: { fontSize: 18, fontWeight: '700', color: '#0055ff' },
  logoTextoEscuro: { fontSize: 18, fontWeight: '700', color: '#051334' },
  btnEntrarHeader: {
    borderWidth: 1,
    borderColor: '#0055ff',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  btnEntrarText: { color: '#0055ff', fontWeight: '600' },
  conteudo: { flex: 1 },
  containerInicio: { padding: 20 },
  cardHero: { backgroundColor: '#0055ff', padding: 25, borderRadius: 16, marginBottom: 25 },
  tituloBoasVindas: { fontSize: 22, fontWeight: '700', color: '#ffffff', marginBottom: 10 },
  subtituloHero: { color: '#e0eaff', fontSize: 14, lineHeight: 20 },
  secaoRecursos: { marginBottom: 25 },
  tituloSecao: { fontSize: 18, fontWeight: '700', color: '#051334' },
  recursoItem: { flexDirection: 'row', marginTop: 15, alignItems: 'center' },
  wrapperIcone: { backgroundColor: '#e0eaff', padding: 10, borderRadius: 10 },
  recursoTextoContainer: { marginLeft: 15 },
  recursoTitulo: { fontWeight: '700', color: '#051334' },
  recursoDesc: { color: '#64748b', fontSize: 13 },
  btnPrincipalInicio: { backgroundColor: '#0055ff', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnPrincipalText: { color: '#ffffff', fontWeight: '700' },
  searchSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: { padding: 10 },
  inputBuscaMinimalista: { flex: 1, paddingVertical: 10, color: '#051334' },
  btnFiltro: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnFiltroAtivo: { backgroundColor: '#0055ff', borderColor: '#0055ff' },
  btnFiltroText: { color: '#64748b' },
  btnFiltroTextAtivo: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardImg: { width: '100%', height: 160 },
  cardBody: { padding: 15 },
  cardTag: { color: '#0055ff', fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  cardTitulo: { fontSize: 18, fontWeight: '700', color: '#051334', marginVertical: 5 },
  inlineInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardEnderecoMinimalista: { color: '#64748b', fontSize: 13, marginLeft: 5 },
  cardDesc: { color: '#475569', fontSize: 14, marginBottom: 15 },
  badgeRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  miniBadgeText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  tabBar: {
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 11, color: '#64748b', marginTop: 2 },
  tabTextAtivo: { color: '#0055ff', fontWeight: '600' },
  pilarBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 5,
  },
  pilarAtivoBox: { backgroundColor: '#f8fafc' },
  pilarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pilarTituloComIcone: { flexDirection: 'row', alignItems: 'center' },
  pilarTitulo: { fontWeight: '700', color: '#051334', fontSize: 15 },
  pilarDescShort: { color: '#64748b', fontSize: 13, marginTop: 5 },
  pilarDropdown: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  pilarTopico: { fontSize: 13, color: '#475569', marginBottom: 8, lineHeight: 18 },
  inputForm: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    color: '#051334',
  },
  labelForm: { fontWeight: '600', color: '#051334', marginBottom: 8, fontSize: 14 },
  btnPrincipal: { backgroundColor: '#0055ff', padding: 14, borderRadius: 8, alignItems: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5,19,52,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center' },
  modalTitulo: { fontSize: 22, fontWeight: '700', color: '#0055ff', marginBottom: 10 },
  modalSubtitulo: { fontSize: 13, color: '#64748b', marginBottom: 5 },
  modalEmail: { fontSize: 14, color: '#0055ff', fontWeight: '600', marginBottom: 20 },
  inputCodigo: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0055ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 28,
    letterSpacing: 12,
    width: '100%',
    color: '#051334',
  },
  btnFecharDestino: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
  },
  barraGraficoFundo: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  barraGraficoPreenchimento: { height: '100%', borderRadius: 4 },
  divisor: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarUsuario: { backgroundColor: '#0055ff' },
  avatarEmpresa: { backgroundColor: '#d97706' },
  avatarText: { color: '#fff', fontWeight: '700' },
  tituloPage: { fontSize: 24, fontWeight: '700', color: '#051334', marginBottom: 10 },
  subtituloPage: { fontSize: 14, color: '#64748b' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    width: '47%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statValue: { fontSize: 28, fontWeight: '700', color: '#0055ff', marginBottom: 5 },
  statLabel: { fontSize: 12, color: '#64748b' },
  checkboxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  checkboxAtivo: { backgroundColor: '#0055ff', borderColor: '#0055ff' },
  checkboxText: { fontSize: 12, color: '#051334' },
  checkboxTextAtivo: { color: '#fff' },
  localCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  localNome: { fontWeight: '700', color: '#051334', fontSize: 16 },
  localInfo: { color: '#64748b', fontSize: 13, marginTop: 3 },
  acessibilidadeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  acessibilidadeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#e0eaff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  acessibilidadeText: { fontSize: 12, color: '#0055ff', fontWeight: '600' },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tagNivel: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  tagNivelText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  replyBox: { backgroundColor: '#e0eaff', padding: 10, borderRadius: 8, marginTop: 8 },
  levelButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#0055ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  levelAtivo: { backgroundColor: '#0055ff' },
  levelText: { color: '#0055ff', fontWeight: '600', fontSize: 12 },
  levelTextAtivo: { color: '#fff' },
  perfilBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  perfilBtnAtivo: { backgroundColor: '#0055ff', borderColor: '#0055ff' },
  perfilBtnText: { color: '#64748b', fontWeight: '600' },
  perfilBtnTextAtivo: { color: '#fff' },
});