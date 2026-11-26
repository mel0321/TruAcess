import { getDemoPlacePhotoUrl } from '../demoPlacePhotos.js';

const generatedPlaceAddress = 'Rua da Acessibilidade,';
const generatedUnsplashPhoto = /^https:\/\/images\.unsplash\.com\/photo-156607377\d+\?w=1080&q=80$/;
const generatedPicsumPhoto = /^https:\/\/picsum\.photos\/(?:seed\/truacess-place-\d+\/1080\/720|id\/\d+\/1080\/720)$/;
const previousPhotoId = 1566073771259;

export async function up(knex) {
  const generatedPlaces = await knex('places')
    .where('full_address', 'like', `${generatedPlaceAddress}%`)
    .select('id', 'main_image');

  for (const place of generatedPlaces) {
    if (place.main_image && !generatedUnsplashPhoto.test(place.main_image) && !generatedPicsumPhoto.test(place.main_image)) continue;
    const photoUrl = getDemoPlacePhotoUrl(place.id);
    if (!photoUrl) continue;
    await knex('places')
      .where({ id: place.id })
      .update({ main_image: photoUrl });
  }

  const patioDoColegio = await knex('places')
    .where({ id: 6, establishment_name: 'Pátio do Colégio' })
    .first('main_image');
  if (patioDoColegio && !patioDoColegio.main_image) {
    await knex('places')
      .where({ id: 6 })
      .update({ main_image: getDemoPlacePhotoUrl(6) });
  }
}

export async function down(knex) {
  const generatedPlaces = await knex('places')
    .where('full_address', 'like', `${generatedPlaceAddress}%`)
    .select('id', 'main_image');

  for (const place of generatedPlaces) {
    if (place.main_image !== getDemoPlacePhotoUrl(place.id)) continue;
    await knex('places')
      .where({ id: place.id })
      .update({ main_image: `https://images.unsplash.com/photo-${previousPhotoId + ((place.id - 13) % 50)}?w=1080&q=80` });
  }

  const patioDoColegio = await knex('places')
    .where({ id: 6, establishment_name: 'Pátio do Colégio' })
    .first('main_image');
  if (patioDoColegio?.main_image === getDemoPlacePhotoUrl(6)) {
    await knex('places')
      .where({ id: 6 })
      .update({ main_image: null });
  }
}
