import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const demoAccounts = [
  {
    key: 'ana',
    name: 'Ana Clara Ribeiro',
    email: 'demo.ana@truacess.local',
    avatar: '/images/community-demo/ana-avatar.jpg',
    bio: 'Perfil fictício de demonstração. Viajante apaixonada por natureza e por roteiros acessíveis.',
    caption: 'Uma pausa para respirar e aproveitar a paisagem. Conteúdo fictício para demonstração.',
    location: 'Lago di Braies, Itália',
    hashtags: ['viagem', 'natureza', 'demonstracao'],
    photos: [
      '/images/community-demo/ana-viagem-1.jpg',
      '/images/community-demo/ana-viagem-2.jpg',
    ],
  },
  {
    key: 'caio',
    name: 'Caio Mendes',
    email: 'demo.caio@truacess.local',
    avatar: '/images/community-demo/caio-avatar.jpg',
    bio: 'Perfil fictício de demonstração. Explorador de trilhas, montanhas e destinos tranquilos.',
    caption: 'Montanhas, céu aberto e um novo caminho para explorar. Conteúdo fictício para demonstração.',
    location: 'Parque Nacional Denali, Estados Unidos',
    hashtags: ['montanhas', 'aventura', 'demonstracao'],
    photos: [
      '/images/community-demo/caio-viagem-1.jpg',
      '/images/community-demo/caio-viagem-2.jpg',
    ],
  },
  {
    key: 'luiza',
    name: 'Luiza Ferreira',
    email: 'demo.luiza@truacess.local',
    avatar: '/images/community-demo/luiza-avatar.jpg',
    bio: 'Perfil fictício de demonstração. Compartilha viagens, fotografia e dicas para viajar com autonomia.',
    caption: 'A estrada também faz parte da viagem. Conteúdo fictício para demonstração.',
    location: 'Deserto de Nevada, Estados Unidos',
    hashtags: ['estrada', 'descobertas', 'demonstracao'],
    photos: [
      '/images/community-demo/luiza-viagem-1.jpg',
      '/images/community-demo/luiza-viagem-2.jpg',
    ],
  },
];

export async function up(knex) {
  const accountIds = {};

  for (const account of demoAccounts) {
    const [id] = await knex('users').insert({
      full_name: account.name,
      email: account.email,
      password: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
      email_verified: 1,
      user_type: 'TRAVELER',
      profile_picture: account.avatar,
      profile_data: JSON.stringify({ bio: account.bio, socialLinks: [], isDemo: true }),
    });
    accountIds[account.key] = id;

    const [postId] = await knex('social_posts').insert({
      user_id: id,
      caption: account.caption,
      location: account.location,
      hashtags: JSON.stringify(account.hashtags),
      privacy: 'PUBLIC',
    });
    await knex('social_post_photos').insert(
      account.photos.map((photoUrl) => ({ post_id: postId, photo_url: photoUrl })),
    );
  }

  const followPairs = [
    ['ana', 'caio'], ['ana', 'luiza'],
    ['caio', 'ana'], ['caio', 'luiza'],
    ['luiza', 'ana'], ['luiza', 'caio'],
  ];

  await knex('social_follows').insert(followPairs.map(([follower, following]) => ({
    follower_id: accountIds[follower],
    following_id: accountIds[following],
  })));
}

export async function down(knex) {
  await knex('users')
    .whereIn('email', demoAccounts.map((account) => account.email))
    .del();
}
