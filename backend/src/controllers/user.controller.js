import bcrypt from 'bcryptjs';
import db from '../../database/connection.js';
import { AppError } from '../middlewares/error.middleware.js';
import { generateAuthToken } from '../utils/authToken.js';

function linkedAccountDetails(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    user_type: user.user_type,
    profile_picture: user.profile_picture
  };
}

async function findLinkedAccountId(query, userId) {
  const link = await query('account_links')
    .where({ user_id: userId })
    .orWhere({ linked_user_id: userId })
    .first();
  if (!link) return null;
  return link.user_id === userId ? link.linked_user_id : link.user_id;
}

async function createAccountLink(transaction, userId, linkedUserId) {
  if (userId === linkedUserId) throw new AppError('Não é possível vincular a conta a ela mesma.', 400);
  const [user, linkedUser] = await Promise.all([
    transaction('users').where({ id: userId }).first(),
    transaction('users').where({ id: linkedUserId }).first()
  ]);
  if (!user || !linkedUser || user.user_type === linkedUser.user_type) {
    throw new AppError('Só é possível conectar uma conta de viajante a uma conta de estabelecimento.', 400);
  }

  const userLinkId = await findLinkedAccountId(transaction, userId);
  const linkedUserLinkId = await findLinkedAccountId(transaction, linkedUserId);
  if (userLinkId || linkedUserLinkId) {
    if (userLinkId === linkedUserId && linkedUserLinkId === userId) return;
    throw new AppError('Uma das contas já está conectada a outro perfil.', 409);
  }

  await transaction('account_links').insert({ user_id: userId, linked_user_id: linkedUserId });
}

/**
 * Obter perfil do usuário logado
 */
export async function getProfile(req, res, next) {
  try {
    const user = await db('users')
      .where({ id: req.user.id })
      .select('id', 'full_name', 'email', 'user_type', 'profile_picture', 'email_verified', 'profile_data', 'created_at', 'updated_at')
      .first();

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    const { profile_data: _profileData, ...safeUser } = user;
    return res.status(200).json({
      user: {
        ...safeUser,
        profile: user.profile_data ? JSON.parse(user.profile_data) : null
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Listar comentários publicados pelo usuário autenticado
 */
export async function getMyComments(req, res, next) {
  try {
    const comments = await db('reviews')
      .join('places', 'reviews.place_id', 'places.id')
      .where('reviews.traveler_id', req.user.id)
      .select(
        'reviews.id',
        'reviews.place_id',
        'places.establishment_name as place_name',
        'reviews.experience_rating',
        'reviews.accessibility_level',
        'reviews.comment_text',
        'reviews.created_at'
      )
      .orderBy('reviews.created_at', 'desc');

    return res.status(200).json({ comments });
  } catch (error) {
    next(error);
  }
}

/**
 * Atualizar informações básicas do perfil
 */
export async function updateProfile(req, res, next) {
  try {
    const { full_name, profile_picture, profile } = req.body;

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name?.trim() || null;
    if (profile_picture !== undefined) updateData.profile_picture = profile_picture?.trim() || null;
    if (profile !== undefined) {
      if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
        throw new AppError('As informações do perfil são inválidas.', 400);
      }
      updateData.profile_data = JSON.stringify(profile);
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('Nenhum dado informado para atualização.', 400);
    }

    await db('users').where({ id: req.user.id }).update(updateData);

    const updatedUser = await db('users')
      .where({ id: req.user.id })
      .select('id', 'full_name', 'email', 'user_type', 'profile_picture', 'email_verified', 'profile_data', 'updated_at')
      .first();
    const { profile_data: _profileData, ...safeUser } = updatedUser;

    return res.status(200).json({
      message: 'Perfil atualizado com sucesso!',
      user: {
        ...safeUser,
        profile: _profileData ? JSON.parse(_profileData) : null
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getLinkedAccount(req, res, next) {
    try {
      const linkedUserId = await findLinkedAccountId(db, req.user.id);
      const account = linkedUserId
        ? await db('users').where({ id: linkedUserId }).first('id', 'full_name', 'email', 'user_type', 'profile_picture')
        : null;
      return res.status(200).json({ account: account ? linkedAccountDetails(account) : null });
    } catch (error) {
      next(error);
    }
  }

export async function connectExistingAccount(req, res, next) {
    try {
      const email = req.body.email?.toLowerCase().trim();
      const password = req.body.password;
      if (!email || !password) throw new AppError('Informe e-mail e senha do outro perfil.', 400);
      const linkedUser = await db('users').where({ email }).first();
      if (!linkedUser || !(await bcrypt.compare(password, linkedUser.password))) {
        throw new AppError('Não foi possível validar essa conta. Confira e-mail e senha.', 401);
      }
      if (linkedUser.email_verified !== 1) throw new AppError('Confirme o e-mail da outra conta antes de conectá-la.', 403);

      await db.transaction((transaction) => createAccountLink(transaction, req.user.id, linkedUser.id));
      return res.status(200).json({
        message: 'Perfis conectados com sucesso.',
        account: linkedAccountDetails(linkedUser)
      });
    } catch (error) {
      next(error);
    }
  }

export async function createLinkedAccount(req, res, next) {
    try {
      const fullName = req.body.full_name?.trim();
      const email = req.body.email?.toLowerCase().trim();
      const password = req.body.password;
      if (!fullName || !email || !password) {
        throw new AppError('Nome, e-mail e senha são necessários para criar o outro perfil.', 400);
      }
      if (password.length < 6) throw new AppError('A senha deve ter pelo menos 6 caracteres.', 400);
      if (await db('users').where({ email }).first()) {
        throw new AppError('Este e-mail já pertence a uma conta. Conecte essa conta usando a opção de vincular.', 409);
      }

      const linkedType = req.user.user_type === 'BUSINESS' ? 'TRAVELER' : 'BUSINESS';
      const [linkedUserId] = await db.transaction(async (transaction) => {
        const [newUserId] = await transaction('users').insert({
          full_name: fullName,
          email,
          password: await bcrypt.hash(password, 10),
          user_type: linkedType,
          email_verified: 1,
          email_code: null,
          profile_picture: null,
          profile_data: null
        });
        await createAccountLink(transaction, req.user.id, newUserId);
        return [newUserId];
      });
      const linkedUser = await db('users').where({ id: linkedUserId }).first();
      return res.status(201).json({
        message: 'Perfil criado e conectado com sucesso.',
        account: linkedAccountDetails(linkedUser)
      });
    } catch (error) {
      next(error);
    }
  }

export async function switchLinkedAccount(req, res, next) {
    try {
      const linkedUserId = await findLinkedAccountId(db, req.user.id);
      if (!linkedUserId) throw new AppError('Ainda não há outro perfil conectado.', 404);
      const linkedUser = await db('users').where({ id: linkedUserId }).first();
      if (!linkedUser) throw new AppError('O perfil conectado não está disponível.', 404);
      const account = linkedAccountDetails(linkedUser);
      return res.status(200).json({
        token: generateAuthToken(linkedUser),
        user: {
          ...account,
          profile: linkedUser.user_type === 'TRAVELER' && linkedUser.profile_data
            ? JSON.parse(linkedUser.profile_data)
            : null
        }
      });
    } catch (error) {
      next(error);
    }
  }

export async function unlinkAccount(req, res, next) {
    try {
      const linkedUserId = await findLinkedAccountId(db, req.user.id);
      if (!linkedUserId) throw new AppError('Não há perfil conectado para remover.', 404);
      await db('account_links')
        .where({ user_id: req.user.id, linked_user_id: linkedUserId })
        .orWhere({ user_id: linkedUserId, linked_user_id: req.user.id })
        .del();
      return res.status(200).json({ message: 'Perfis desconectados.' });
    } catch (error) {
      next(error);
    }
  }
/**
 * Upload de foto de perfil
 */
export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('Nenhum arquivo de imagem foi enviado.', 400);
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;

    await db('users').where({ id: req.user.id }).update({
      profile_picture: fileUrl
    });

    return res.status(200).json({
      message: 'Foto de perfil atualizada com sucesso!',
      profile_picture: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Excluir a conta autenticada após confirmar a senha
 */
export async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body;
    if (!password) {
      throw new AppError('Informe sua senha para confirmar a exclusão da conta.', 400);
    }

    const user = await db('users').where({ id: req.user.id }).first();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('Senha incorreta.', 401);
    }

    await db('users').where({ id: req.user.id }).del();

    return res.status(200).json({ message: 'Conta excluída com sucesso.' });
  } catch (error) {
    next(error);
  }
}
