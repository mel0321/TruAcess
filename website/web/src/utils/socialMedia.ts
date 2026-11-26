export type SocialMediaItem = {
  id: number;
  photo_url: string;
  media_type?: 'IMAGE' | 'VIDEO';
};

export function isSocialVideo(media: SocialMediaItem) {
  return media.media_type === 'VIDEO' || /\.(mp4|webm|mov)(?:$|[?#])/i.test(media.photo_url);
}
