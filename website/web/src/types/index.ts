export type UserType = 'TRAVELER' | 'BUSINESS';

export interface User {
  id: number;
  full_name: string;
  email: string;
  user_type: UserType;
  profile_picture?: string | null;
}

export interface Place {
  id: number;
  establishment_name: string;
  category: string;
  city: string;
  state: string;
  price: number | null;
  main_image: string | null;
  has_access_ramp: boolean;
  has_asd_friendly_space: boolean;
  has_sign_language_interpreter: boolean;
  description?: string;
  full_address?: string;
  has_adapted_bathroom?: boolean;
  allows_guide_dog?: boolean;
  has_braille_signage?: boolean;
}

export interface Review {
  id: number;
  experience_rating: number;
  accessibility_level: string;
  comment_text: string | null;
  owner_reply_text: string | null;
  traveler_name?: string;
}