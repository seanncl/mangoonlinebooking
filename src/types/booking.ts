export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email?: string;
  hero_image_url?: string;
  hours_weekday: string;
  hours_weekend: string;
  has_deposit_policy: boolean;
  deposit_percentage: number;
  cancellation_policy: string;
}

export type ServiceCategory = 'manicure' | 'pedicure' | 'extensions' | 'nail_art' | 'add_ons';

export interface Service {
  id: string;
  location_id: string;
  name: string;
  category: ServiceCategory;
  description?: string;
  duration_minutes: number;
  price_cash: number;
  price_card: number;
  is_add_on: boolean;
  parent_service_id?: string;
  discount_when_bundled: number;
  display_order: number;
  is_active: boolean;
}

export type StaffStatus = 'available_now' | 'available_later' | 'unavailable';

export interface Staff {
  id: string;
  location_id: string;
  first_name: string;
  last_name: string;
  avatar_emoji: string;
  status: StaffStatus;
  next_available_time?: string;
  specialties?: string[];
  is_active: boolean;
  display_order: number;
}

export interface CartService {
  service: Service;
  addOns: Service[];
  staffId?: string;
}

export interface Customer {
  id?: string;
  email: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  google_id?: string;
  apple_id?: string;
  has_accepted_policy: boolean;
  sms_reminders_enabled: boolean;
  promotional_texts_enabled: boolean;
}

export interface BookingState {
  selectedLocation?: Location;
  cart: CartService[];
  selectedDate?: Date;
  selectedTime?: string;
  startAllSameTime: boolean;
  serviceOrder: string[]; // service IDs in order
  customer?: Customer;
  phoneVerified: boolean;
}
