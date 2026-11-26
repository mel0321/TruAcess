import type { Place } from '../types';

export function getDistinctPlacePhotoUrls(place: Pick<Place, 'main_image' | 'photos'>): string[] {
  const urls = [
    place.main_image,
    ...(place.photos || [])
      .filter((photo) => photo.photo_type === 'PLACE')
      .map((photo) => photo.photo_url),
  ];
  return [...new Set(urls.map((url) => url?.trim()).filter((url): url is string => Boolean(url)))];
}
