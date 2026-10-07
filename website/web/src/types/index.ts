// Tipos baseados exatamente no seu schema SQLite e Insomnia
export type UserType = 'TRAVELER' | 'BUSINESS';
export type PlaceCategory = 'ACCOMMODATION' | 'GASTRONOMY' | 'TOURIST_ATTRACTION' | 'OTHERS';
export type AccessibilityLevel = 'POOR' | 'GOOD' | 'EXCELLENT';

export interface User {
  id: number;
  full_name: string;
  email: string;
  user_type: UserType;
  profile_picture: string | null;
  email_verified: 0 | 1;
}

export interface Place {
  id: number;
  business_owner_id: number;
  establishment_name: string;
  category: PlaceCategory;
  full_address: string;
  city: string;
  state: string;
  description: string | null;
  price: number | null; // Pode ser nulo para praças/parques
  main_image: string | null;
  has_access_ramp: boolean;
  has_adapted_bathroom: boolean;
  allows_guide_dog: boolean;
  has_braille_signage: boolean;
  has_sign_language_interpreter: boolean;
  has_asd_friendly_space: boolean;
  average_rating?: number;
  total_reviews?: number;
}

export interface Review {
  id: number;
  place_id: number;
  traveler_id: number;
  experience_rating: number;
  accessibility_level: AccessibilityLevel;
  comment_text: string | null;
  owner_reply_text: string | null;
  created_at: string;
  traveler_name?: string;
}