export type UserType = 'TRAVELER' | 'BUSINESS';
export type Gender = 'FEMALE' | 'MALE' | 'OTHER' | 'PREFER_NOT_SAY';
export type AgeRange = '18-24' | '25-34' | '35-44' | '45-54' | '55+';
export type TravelFrequency = 'RARELY' | 'SOMETIMES' | 'OFTEN' | 'ALWAYS';
export type DisabilityType = 'PHYSICAL' | 'VISUAL' | 'HEARING' | 'COGNITIVE' | 'NEURODIVERGENT' | 'NONE' | 'OTHER';

export interface UserProfile {
  gender?: Gender;
  ageRange?: AgeRange;
  travelFrequency?: TravelFrequency;
  disabilities?: DisabilityType[];
  interests?: string[];
  companionType?: 'ALONE' | 'COUPLE' | 'FAMILY' | 'FRIENDS' | 'GROUP';
  hasMobilityAid?: boolean;
  needsQuietSpace?: boolean;
  needsVisualAids?: boolean;
  needsHearingAids?: boolean;
  profileCompleted?: boolean;
  onboardingStep?: number;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  user_type: UserType;
  profile_picture?: string | null;
  phone?: string;
  birth_date?: string;
  profile?: UserProfile;
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