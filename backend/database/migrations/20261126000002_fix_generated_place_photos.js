const generatedPhotoPattern = /^https:\/\/images\.unsplash\.com\/photo-(\d+)\?w=1080&q=80$/;
const generatedPhotoId = 1566073771259;

export async function up(knex) {
  const places = await knex('places').select('id', 'main_image');
  for (const place of places) {
    const match = place.main_image?.match(generatedPhotoPattern);
    if (place.id < 13 || !match || Number(match[1]) !== generatedPhotoId + ((place.id - 13) % 50)) continue;
    await knex('places')
      .where({ id: place.id })
      .update({ main_image: `https://picsum.photos/seed/truacess-place-${place.id}/1080/720` });
  }
}

export async function down(knex) {
  const places = await knex('places')
    .where('main_image', 'like', 'https://picsum.photos/seed/truacess-place-%/1080/720')
    .select('id', 'main_image');
  for (const place of places) {
    if (place.id < 13) continue;
    const imageId = generatedPhotoId + ((place.id - 13) % 50);
    await knex('places')
      .where({ id: place.id })
      .update({ main_image: `https://images.unsplash.com/photo-${imageId}?w=1080&q=80` });
  }
}
