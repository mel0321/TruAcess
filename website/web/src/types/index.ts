export type UserType = 'TRAVELER' | 'BUSINESS';
export type Gender = 'FEMALE' | 'MALE' | 'OTHER' | 'PREFER_NOT_SAY';
export type AgeRange = '18-24' | '25-34' | '35-44' | '45-54' | '55+' | 'PREFER_NOT_SAY';
export type TravelFrequency = 'RARELY' | 'SOMETIMES' | 'OFTEN' | 'ALWAYS';
export type DisabilityType = 'PHYSICAL' | 'VISUAL' | 'HEARING' | 'COGNITIVE' | 'NEURODIVERGENT' | 'NONE' | 'OTHER' | 'PREFER_NOT_SAY';

export interface UserProfile {
  gender?: Gender;
  ageRange?: AgeRange;
  travelFrequency?: TravelFrequency;
  disabilities?: DisabilityType[];
  interests?: string[];
  companionType?: 'ALONE' | 'COUPLE' | 'FAMILY' | 'FRIENDS' | 'GROUP';
  accessibilityPreferences?: string[];
  profileCompleted?: boolean;
  onboardingStep?: number;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  user_type: UserType;
  profile_picture?: string | null;
  nickname?: string;
  profile?: UserProfile | null;
  created_at?: string;
  updated_at?: string;
}

export interface Place {
  id: number;
  establishment_name: string;
  category: string;
  category_detail?: string | null;
  city: string;
  state: string | null;
  district?: string | null;
  country?: string;
  price: number | null;
  main_image: string | null;
  full_address?: string;
  phone?: string | null;
  website?: string | null;
  opening_hours?: string | null;
  accessibility_assessment?: Record<string, 'yes' | 'no' | 'unsure'> | null;
  average_rating?: number | null;
  total_reviews?: number;
  questionnaire_score?: number | null;
  traveler_accessibility_score?: number | null;
  accessibility_score?: number | null;
  accessibility_level?: 'INITIAL' | 'INTERMEDIATE' | 'ADVANCED' | null;
  stats?: {
    average_rating: number | null;
    total_reviews: number;
  };
  has_access_ramp: boolean;
  has_asd_friendly_space: boolean;
  has_sign_language_interpreter: boolean;
  description?: string;
  has_adapted_bathroom?: boolean;
  allows_guide_dog?: boolean;
  has_braille_signage?: boolean;
  photos?: PlacePhoto[];
}

export interface PlacePhoto {
  id: number;
  place_id: number;
  photo_url: string;
  photo_type: 'PLACE' | 'ACCESSIBILITY';
  accessibility_category: string | null;
  created_at: string;
}

export interface Review {
  id: number;
  user_id?: number;
  place_id?: number;
  experience_rating: number;
  accessibility_rating: number;
  comment_text: string;
  created_at: string;
  traveler_name?: string;
  traveler_avatar?: string;
  accessibility_details?: Record<string, 'yes' | 'partially' | 'no' | 'not_applicable'> | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  user_type: UserType;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UpdateProfileRequest {
  full_name?: string;
  nickname?: string;
  profile_picture?: string | null;
}

export interface DeleteAccountRequest {
  password: string;
}

export interface CreateReviewRequest {
  place_id: number;
  experience_rating: number;
  accessibility_rating: number;
  comment_text: string;
}