export type VerdictType = 'Buy' | 'Skip' | 'Go' | 'Pass' | 'Watch';
export type ItemCategory = 'product' | 'restaurant' | 'food' | 'service' | 'other';

export interface UserPreferences {
  price_weight: number;
  quality_weight: number;
  ethics_weight: number;
  health_weight: number;
  speed_weight: number;
  dietary: string[];
  budget: 'budget' | 'mid' | 'premium';
  distance_radius_km: number;
  avoid_chains: boolean;
}

export interface ScanResult {
  id: string;
  user_id: string;
  image_url: string | null;
  item_name: string;
  item_category: ItemCategory;
  score: number;
  verdict: VerdictType;
  reasoning: string;
  local_alternatives: LocalAlternative[];
  online_alternatives: OnlineAlternative[];
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
}

export interface LocalAlternative {
  id: string;
  name: string;
  distance_km: number;
  address: string;
  rating: number | null;
  price_level: number | null;
  place_id: string;
}

export interface OnlineAlternative {
  id: string;
  name: string;
  price: number;
  currency: string;
  merchant: string;
  url: string;
  image_url: string | null;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  preferences: UserPreferences;
  created_at: string;
}
