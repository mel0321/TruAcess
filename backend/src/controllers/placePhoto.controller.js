import { unlink } from 'node:fs/promises';
import db from '../../database/connection.js';
import { AppError } from '../middlewares/error.middleware.js';

const ACCESSIBILITY_CATEGORIES = new Set([
  'ACCESS_ROUTE',
  'RAMP',
  'ENTRANCE',
  'ADAPTED_BATHROOM',
  'PARKING',
  'BRAILLE',
  'SIGN_LANGUAGE',
  'GUIDE_DOG',
  'SENSORY_SPACE',
  'OTHER'
]);

export async function addPlacePhoto(req, res, next) {
  let photoPersisted = false;
  try {
    const { id } = req.params;
    const { photo_type: photoType, accessibility_category: accessibilityCategory } = req.body;
    if (!req.file) throw new AppError('Selecione uma foto para enviar.', 400);
    if (!['PLACE', 'ACCESSIBILITY'].includes(photoType)) {
      throw new AppError('Tipo de foto inválido.', 400);
    }
    if (photoType === 'ACCESSIBILITY' && !ACCESSIBILITY_CATEGORIES.has(accessibilityCategory)) {
      throw new AppError('Escolha o recurso de acessibilidade comprovado pela foto.', 400);
    }

    const place = await db('places').where({ id }).first();
    if (!place) throw new AppError('Local não encontrado.', 404);
    if (place.business_owner_id !== req.user.id) {
      throw new AppError('Você não tem permissão para adicionar fotos a este local.', 403);
    }

    const photo = {
      place_id: place.id,
      photo_url: `${req.protocol}://${req.get('host')}/uploads/places/${req.file.filename}`,
      photo_type: photoType,
      accessibility_category: photoType === 'ACCESSIBILITY' ? accessibilityCategory : null,
      uploaded_by: req.user.id
    };
    const [photoId] = await db('place_photos').insert(photo);
    photoPersisted = true;
    return res.status(201).json({
      message: 'Foto enviada com sucesso.',
      photo: await db('place_photos').where({ id: photoId }).first()
    });
  } catch (error) {
    if (req.file && !photoPersisted) {
      try {
        await unlink(req.file.path);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') {
          console.error('Não foi possível remover um arquivo de foto não persistido:', cleanupError);
        }
      }
    }
    next(error);
  }
}
