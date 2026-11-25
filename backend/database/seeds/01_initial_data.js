import bcrypt from 'bcryptjs';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Clear existing entries in reverse foreign key order
  await knex('reviews').del();
  await knex('places').del();
  await knex('users').del();

  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedTravelerPassword = await bcrypt.hash('traveler123', 10);

  // Insert initial users
  const [adminUser] = await knex('users')
    .insert([
      {
        id: 1,
        full_name: 'Administrador Business',
        email: 'admin@admin.com',
        password: hashedAdminPassword,
        email_verified: 1,
        email_code: null,
        user_type: 'BUSINESS',
        profile_picture: null
      },
      {
        id: 2,
        full_name: 'Viajante Demo',
        email: 'traveler@traveler.com',
        password: hashedTravelerPassword,
        email_verified: 1,
        email_code: null,
        user_type: 'TRAVELER',
        profile_picture: null
      }
    ])
    .returning('*');

  // Insert initial places from DBML
  await knex('places').insert([
    {
      id: 1,
      business_owner_id: 1,
      establishment_name: 'Hotel Unique',
      category: 'ACCOMMODATION',
      category_detail: 'HOTEL',
      full_address: 'Avenida Brigadeiro Luís Antônio 4700 - Jardim Paulista',
      city: 'São Paulo',
      state: 'SP',
      description:
        'Hotel de luxo em São Paulo com estrutura completa e localização próxima ao Parque Ibirapuera e à Avenida Paulista.',
      price: 120000,
      main_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 1,
      has_sign_language_interpreter: 0,
      has_asd_friendly_space: 1
    },
    {
      id: 2,
      business_owner_id: 1,
      establishment_name: 'Restaurante A Figueira Rubaiyat',
      category: 'GASTRONOMY',
      category_detail: 'RESTAURANT',
      full_address: 'Rua Haddock Lobo 1738 - Jardim Paulista',
      city: 'São Paulo',
      state: 'SP',
      description:
        'Restaurante conhecido por sua gastronomia e por seu amplo salão integrado a uma grande figueira centenária.',
      price: 15000,
      main_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 0,
      has_sign_language_interpreter: 0,
      has_asd_friendly_space: 1
    },
    {
      id: 3,
      business_owner_id: 1,
      establishment_name: 'MASP - Museu de Arte de São Paulo',
      category: 'TOURIST_ATTRACTION',
      category_detail: 'MUSEUM',
      full_address: 'Avenida Paulista 1578 - Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      description:
        'Um dos principais museus de arte do Brasil, localizado na Avenida Paulista e conhecido por seu acervo e exposições.',
      price: 7000,
      main_image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 1,
      has_sign_language_interpreter: 1,
      has_asd_friendly_space: 1
    },
    {
      id: 4,
      business_owner_id: 1,
      establishment_name: 'Parque Ibirapuera',
      category: 'TOURIST_ATTRACTION',
      category_detail: 'PARK',
      full_address: 'Avenida Pedro Álvares Cabral - Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
      description:
        'Um dos parques mais conhecidos de São Paulo, com áreas verdes, espaços culturais, trilhas e opções de lazer.',
      price: 0,
      main_image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 0,
      has_sign_language_interpreter: 0,
      has_asd_friendly_space: 1
    },
    {
      id: 5,
      business_owner_id: 1,
      establishment_name: 'Pinacoteca de São Paulo',
      category: 'TOURIST_ATTRACTION',
      category_detail: 'MUSEUM',
      full_address: 'Praça da Luz 2 - Luz',
      city: 'São Paulo',
      state: 'SP',
      description:
        'Museu de arte localizado no centro de São Paulo com importante acervo de arte brasileira e exposições temporárias.',
      price: 3000,
      main_image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 1,
      has_sign_language_interpreter: 1,
      has_asd_friendly_space: 1
    },
    {
      id: 6,
      business_owner_id: 1,
      establishment_name: 'Pátio do Colégio',
      category: 'TOURIST_ATTRACTION',
      category_detail: 'HISTORIC_SITE',
      full_address: 'Praça Pátio do Colégio, 2 - Centro Histórico',
      city: 'São Paulo',
      state: 'SP',
      description:
        'Local histórico ligado à fundação da cidade de São Paulo, com museu e espaços de visitação.',
      price: 0,
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 0,
      has_sign_language_interpreter: 0,
      has_asd_friendly_space: 0
    },
    {
      id: 7,
      business_owner_id: 1,
      establishment_name: 'Museu do Amanhã',
      category: 'TOURIST_ATTRACTION',
      category_detail: 'MUSEUM',
      full_address: 'Praça Mauá, 1 - Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
      description: 'Museu de ciência e futuro na região portuária, com exposições interativas e vista para a Baía de Guanabara.',
      price: 3000,
      main_image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 1,
      has_sign_language_interpreter: 1,
      has_asd_friendly_space: 1
    },
    {
      id: 8,
      business_owner_id: 1,
      establishment_name: 'Jardim Botânico do Rio de Janeiro',
      category: 'TOURIST_ATTRACTION',
      category_detail: 'PARK',
      full_address: 'Rua Jardim Botânico, 1008 - Jardim Botânico',
      city: 'Rio de Janeiro',
      state: 'RJ',
      description: 'Área de natureza e pesquisa com caminhos de contemplação, coleções botânicas e espaços de descanso.',
      price: 0,
      main_image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 0,
      has_sign_language_interpreter: 0,
      has_asd_friendly_space: 1
    },
    {
      id: 9,
      business_owner_id: 1,
      establishment_name: 'Mercado Público de Porto Alegre',
      category: 'SHOPPING',
      category_detail: 'MARKET',
      full_address: 'Largo Glênio Peres, 1 - Centro Histórico',
      city: 'Porto Alegre',
      state: 'RS',
      description: 'Mercado histórico com gastronomia regional, produtos locais e grande variedade de estabelecimentos.',
      price: 0,
      main_image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 0,
      has_sign_language_interpreter: 0,
      has_asd_friendly_space: 0
    },
    {
      id: 10,
      business_owner_id: 1,
      establishment_name: 'Pousada Caminho das Águas',
      category: 'ACCOMMODATION',
      category_detail: 'INN',
      full_address: 'Rua das Hortênsias, 420 - Centro',
      city: 'Gramado',
      state: 'RS',
      description: 'Pousada acolhedora com quartos acessíveis, atendimento próximo e fácil acesso ao centro da cidade.',
      price: 42000,
      main_image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 0,
      has_sign_language_interpreter: 1,
      has_asd_friendly_space: 1
    },
    {
      id: 11,
      business_owner_id: 1,
      establishment_name: 'Inhotim',
      category: 'TOURIST_ATTRACTION',
      category_detail: 'MUSEUM',
      full_address: 'Rua B, 20 - Fazenda Inhotim',
      city: 'Brumadinho',
      state: 'MG',
      description: 'Museu a céu aberto que reúne arte contemporânea, jardins e amplas áreas verdes para visitação.',
      price: 5000,
      main_image: 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 1,
      has_sign_language_interpreter: 0,
      has_asd_friendly_space: 1
    },
    {
      id: 12,
      business_owner_id: 1,
      establishment_name: 'Centro Dragão do Mar de Arte e Cultura',
      category: 'ENTERTAINMENT',
      category_detail: 'CULTURAL_SITE',
      full_address: 'Rua Dragão do Mar, 81 - Praia de Iracema',
      city: 'Fortaleza',
      state: 'CE',
      description: 'Complexo cultural com museus, teatro, cinema e programação artística no coração da Praia de Iracema.',
      price: 0,
      main_image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 1,
      has_sign_language_interpreter: 1,
      has_asd_friendly_space: 1
    }
  ]);

  const categoryTemplates = [
    ['ACCOMMODATION', 'HOTEL', 'Hotel'], ['ACCOMMODATION', 'INN', 'Pousada'],
    ['GASTRONOMY', 'RESTAURANT', 'Restaurante'], ['GASTRONOMY', 'CAFE', 'Café'],
    ['TOURIST_ATTRACTION', 'MUSEUM', 'Museu'], ['TOURIST_ATTRACTION', 'PARK', 'Parque'],
    ['TOURIST_ATTRACTION', 'BEACH', 'Praia'], ['TOURIST_ATTRACTION', 'CULTURAL_SITE', 'Espaço cultural'],
    ['SHOPPING', 'SHOPPING_MALL', 'Shopping'], ['SHOPPING', 'MARKET', 'Mercado'],
    ['HEALTH', 'CLINIC', 'Clínica'], ['HEALTH', 'PHARMACY', 'Farmácia'],
    ['TRANSPORT', 'BUS_STATION', 'Terminal'], ['EDUCATION', 'LIBRARY', 'Biblioteca'],
    ['ENTERTAINMENT', 'THEATER', 'Teatro'], ['SPORTS', 'GYM', 'Academia'],
    ['RELIGIOUS_SITE', 'CHURCH', 'Igreja'], ['PUBLIC_SERVICE', 'CITIZEN_SERVICE', 'Serviço público'],
  ];
  const cities = [
    ['São Paulo', 'SP'], ['Rio de Janeiro', 'RJ'], ['Belo Horizonte', 'MG'], ['Brasília', 'DF'],
    ['Salvador', 'BA'], ['Recife', 'PE'], ['Fortaleza', 'CE'], ['Curitiba', 'PR'],
    ['Porto Alegre', 'RS'], ['Manaus', 'AM'], ['Belém', 'PA'], ['Florianópolis', 'SC']
  ];
  const extraPlaceNames = ['Central', 'Universo', 'Esperança', 'Horizonte', 'Brasil', 'Conquista', 'Moderno', 'Tranquilo', 'Jardins', 'Vila'];
  const extraPlaces = Array.from({ length: 200 }, (_, index) => {
    const [category, detail, kind] = categoryTemplates[index % categoryTemplates.length];
    const [city, state] = cities[index % cities.length];
    const ramp = index % 4 !== 2;
    const bathroom = index % 5 !== 3;
    const braille = index % 3 !== 1;
    const libras = index % 6 === 0;
    const dog = index % 5 !== 4;
    const calm = index % 4 === 0;
    const yesAnswers = [ramp, bathroom, braille, libras, dog, calm].filter(Boolean).length;
    return {
      id: 13 + index,
      business_owner_id: 1,
      establishment_name: `${kind} ${extraPlaceNames[index % extraPlaceNames.length]} ${index + 1}`,
      category,
      category_detail: detail,
      full_address: `Rua da Acessibilidade, ${100 + index} - Centro`,
      city,
      state,
      description: `${kind} localizado em ${city}, preparado para receber visitantes com informações claras sobre localização e recursos de acessibilidade.`,
      price: (index % 12) * 2500,
      main_image: `https://images.unsplash.com/photo-${1566073771259 + (index % 50)}?w=1080&q=80`,
      has_access_ramp: ramp ? 1 : 0,
      has_adapted_bathroom: bathroom ? 1 : 0,
      allows_guide_dog: dog ? 1 : 0,
      has_braille_signage: braille ? 1 : 0,
      has_sign_language_interpreter: libras ? 1 : 0,
      has_asd_friendly_space: calm ? 1 : 0,
      accessibility_assessment: JSON.stringify({
        step_free_route: ramp ? 'yes' : 'no', accessible_entrance: ramp ? 'yes' : 'unsure',
        access_ramp: ramp ? 'yes' : 'no', adapted_restroom: bathroom ? 'yes' : 'no',
        tactile_signage: braille ? 'yes' : 'no', libras_support: libras ? 'yes' : 'no',
        quiet_space: calm ? 'yes' : 'no', accessible_service: 'yes'
      }),
      questionnaire_score: Math.round((yesAnswers / 6) * 100),
      accessibility_level: yesAnswers >= 5 ? 'ADVANCED' : yesAnswers >= 3 ? 'INTERMEDIATE' : 'INITIAL'
    };
  });
  await knex('places').insert(extraPlaces);

  // Insert sample reviews
  await knex('reviews').insert([
    {
      id: 1,
      place_id: 3,
      traveler_id: 2,
      experience_rating: 5,
      accessibility_level: 'EXCELLENT',
      comment_text:
        'Excelente acessibilidade para cadeirantes! Elevadores espaçosos, rampas de acesso excelentes e monitores com Libras.',
      owner_reply_text: 'Agradecemos sua visita e sua avaliação sobre nossa infraestrutura acessível!'
    },
    {
      id: 2,
      place_id: 1,
      traveler_id: 2,
      experience_rating: 4,
      accessibility_level: 'GOOD',
      comment_text:
        'Banheiros adaptados muito limpos e quartos com portas largas. Equipe atenciosa.',
      owner_reply_text: 'Ficamos muito felizes em proporcionar uma experiência agradável e acessível!'
    }
  ]);
}
