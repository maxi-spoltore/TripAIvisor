export type TransportType = 'plane' | 'train' | 'bus';
export type TransportRole = 'destination' | 'departure' | 'return';

export interface User {
  user_id: number;
  email: string;
  name: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  session_id: number;
  user_id: number;
  expires_at: string;
  token: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  account_id: number;
  user_id: number;
  provider: string;
  provider_account_id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  trip_id: number;
  user_id: number;
  title: string;
  start_date: string | null;
  departure_city: string;
  return_city: string | null;
  created_at: string;
  updated_at: string;
}

export interface Destination {
  destination_id: number;
  trip_id: number;
  city: string;
  duration: number;
  position: number;
  notes: string | null;
  budget: number | null;
  created_at: string;
  updated_at: string;
}

export interface Transport {
  transport_id: number;
  destination_id: number | null;
  trip_id: number | null;
  transport_role: TransportRole;
  transport_type: TransportType;
  leave_accommodation_time: string | null;
  terminal: string | null;
  company: string | null;
  booking_number: string | null;
  booking_code: string | null;
  departure_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface Accommodation {
  accommodation_id: number;
  destination_id: number;
  name: string | null;
  check_in: string | null;
  check_out: string | null;
  booking_link: string | null;
  booking_code: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripShare {
  share_id: number;
  trip_id: number;
  share_token: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface DestinationWithRelations extends Destination {
  transport: Transport | null;
  accommodation: Accommodation | null;
}

export interface TripWithRelations extends Trip {
  destinations: DestinationWithRelations[];
  departure_transport: Transport | null;
  return_transport: Transport | null;
}
