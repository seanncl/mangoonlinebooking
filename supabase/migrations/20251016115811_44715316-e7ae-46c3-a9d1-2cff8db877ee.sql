-- Create locations table
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  hero_image_url TEXT,
  hours_weekday TEXT NOT NULL DEFAULT 'Mon-Sat: 9:00 AM - 7:00 PM',
  hours_weekend TEXT NOT NULL DEFAULT 'Sun: 10:00 AM - 6:00 PM',
  has_deposit_policy BOOLEAN DEFAULT true,
  deposit_percentage INTEGER DEFAULT 20,
  cancellation_policy TEXT NOT NULL DEFAULT 'Cancel 24+ hours before for full refund. Cancellations within 24 hours forfeit deposit.',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create service categories enum
CREATE TYPE service_category AS ENUM ('manicure', 'pedicure', 'extensions', 'nail_art', 'add_ons');

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category service_category NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price_cash DECIMAL(10, 2) NOT NULL,
  price_card DECIMAL(10, 2) NOT NULL,
  is_add_on BOOLEAN DEFAULT false,
  parent_service_id UUID REFERENCES public.services(id),
  discount_when_bundled DECIMAL(10, 2) DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create staff availability status enum
CREATE TYPE staff_status AS ENUM ('available_now', 'available_later', 'unavailable');

-- Create staff table
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '👤',
  status staff_status DEFAULT 'available_now',
  next_available_time TIMESTAMPTZ,
  specialties TEXT[],
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  google_id TEXT UNIQUE,
  apple_id TEXT UNIQUE,
  has_accepted_policy BOOLEAN DEFAULT false,
  policy_accepted_at TIMESTAMPTZ,
  sms_reminders_enabled BOOLEAN DEFAULT true,
  promotional_texts_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payment methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_payment_method_id TEXT NOT NULL,
  card_last4 TEXT NOT NULL,
  card_brand TEXT NOT NULL,
  card_exp_month INTEGER NOT NULL,
  card_exp_year INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create booking status enum
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confirmation_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  total_duration_minutes INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  deposit_amount DECIMAL(10, 2) DEFAULT 0,
  remaining_amount DECIMAL(10, 2) NOT NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  stripe_payment_intent_id TEXT,
  status booking_status DEFAULT 'pending',
  start_all_same_time BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create booking services table (junction with staff assignment)
CREATE TABLE public.booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES public.staff(id),
  price_paid DECIMAL(10, 2) NOT NULL,
  service_order INTEGER DEFAULT 0,
  start_time TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create SMS verifications table
CREATE TABLE public.sms_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access
CREATE POLICY "Locations are publicly readable" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Services are publicly readable" ON public.services FOR SELECT USING (true);
CREATE POLICY "Staff are publicly readable" ON public.staff FOR SELECT USING (true);

-- RLS Policies for customers (customers can read/update their own data)
CREATE POLICY "Customers can read own data" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Customers can insert own data" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers can update own data" ON public.customers FOR UPDATE USING (true);

-- RLS Policies for payment methods
CREATE POLICY "Customers can read own payment methods" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Customers can insert own payment methods" ON public.payment_methods FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers can update own payment methods" ON public.payment_methods FOR UPDATE USING (true);

-- RLS Policies for bookings
CREATE POLICY "Customers can read own bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers can update own bookings" ON public.bookings FOR UPDATE USING (true);

-- RLS Policies for booking services
CREATE POLICY "Booking services are readable" ON public.booking_services FOR SELECT USING (true);
CREATE POLICY "Booking services can be created" ON public.booking_services FOR INSERT WITH CHECK (true);

-- RLS Policies for SMS verifications
CREATE POLICY "SMS verifications are publicly accessible" ON public.sms_verifications FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_services_location ON public.services(location_id);
CREATE INDEX idx_services_category ON public.services(category);
CREATE INDEX idx_staff_location ON public.staff(location_id);
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_location ON public.bookings(location_id);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_sms_phone ON public.sms_verifications(phone);

-- Insert seed data for locations
INSERT INTO public.locations (name, address, city, state, zip_code, phone, hours_weekday, hours_weekend, has_deposit_policy) VALUES
('Mango Nail Spa - Downtown', '123 Main Street, Suite 101', 'Los Angeles', 'CA', '90012', '(213) 555-1234', 'Mon-Sat: 9:00 AM - 7:00 PM', 'Sun: 10:00 AM - 6:00 PM', true),
('Mango Nail Spa - Beverly Hills', '456 Rodeo Drive', 'Beverly Hills', 'CA', '90210', '(310) 555-5678', 'Mon-Sat: 10:00 AM - 8:00 PM', 'Sun: 11:00 AM - 6:00 PM', true);

-- Get location IDs for seed data
DO $$
DECLARE
  downtown_id UUID;
  beverly_id UUID;
BEGIN
  SELECT id INTO downtown_id FROM public.locations WHERE name = 'Mango Nail Spa - Downtown';
  SELECT id INTO beverly_id FROM public.locations WHERE name = 'Mango Nail Spa - Beverly Hills';

  -- Insert services for Downtown location
  INSERT INTO public.services (location_id, name, category, duration_minutes, price_cash, price_card, display_order) VALUES
  -- Manicures
  (downtown_id, 'Classic Manicure', 'manicure', 45, 25, 28, 1),
  (downtown_id, 'Gel Manicure', 'manicure', 60, 35, 38, 2),
  (downtown_id, 'Deluxe Manicure', 'manicure', 60, 40, 43, 3),
  -- Pedicures
  (downtown_id, 'Classic Pedicure', 'pedicure', 50, 30, 33, 4),
  (downtown_id, 'Spa Pedicure', 'pedicure', 60, 45, 48, 5),
  (downtown_id, 'Deluxe Pedicure', 'pedicure', 75, 55, 58, 6),
  -- Extensions
  (downtown_id, 'Acrylic Full Set', 'extensions', 75, 55, 58, 7),
  (downtown_id, 'Dip Powder', 'extensions', 60, 50, 53, 8),
  (downtown_id, 'Gel Extensions', 'extensions', 90, 70, 73, 9),
  -- Nail Art
  (downtown_id, 'Basic Nail Art', 'nail_art', 30, 15, 18, 10),
  (downtown_id, 'Advanced Nail Art', 'nail_art', 45, 30, 33, 11);

  -- Insert add-ons for Downtown
  INSERT INTO public.services (location_id, name, category, duration_minutes, price_cash, price_card, is_add_on, discount_when_bundled, display_order) VALUES
  (downtown_id, 'French Tips', 'add_ons', 10, 9, 10, true, 3, 12),
  (downtown_id, 'Nail Art (Simple)', 'add_ons', 15, 12, 13, true, 3, 13),
  (downtown_id, 'Gel Polish Upgrade', 'add_ons', 15, 16, 18, true, 4, 14),
  (downtown_id, 'Paraffin Treatment', 'add_ons', 15, 12, 13, true, 3, 15);

  -- Insert same services for Beverly Hills location
  INSERT INTO public.services (location_id, name, category, duration_minutes, price_cash, price_card, display_order) VALUES
  (beverly_id, 'Classic Manicure', 'manicure', 45, 28, 31, 1),
  (beverly_id, 'Gel Manicure', 'manicure', 60, 38, 41, 2),
  (beverly_id, 'Deluxe Manicure', 'manicure', 60, 43, 46, 3),
  (beverly_id, 'Classic Pedicure', 'pedicure', 50, 33, 36, 4),
  (beverly_id, 'Spa Pedicure', 'pedicure', 60, 48, 51, 5),
  (beverly_id, 'Deluxe Pedicure', 'pedicure', 75, 58, 61, 6),
  (beverly_id, 'Acrylic Full Set', 'extensions', 75, 58, 61, 7),
  (beverly_id, 'Dip Powder', 'extensions', 60, 53, 56, 8),
  (beverly_id, 'Gel Extensions', 'extensions', 90, 73, 76, 9),
  (beverly_id, 'Basic Nail Art', 'nail_art', 30, 18, 21, 10),
  (beverly_id, 'Advanced Nail Art', 'nail_art', 45, 33, 36, 11);

  -- Insert add-ons for Beverly Hills
  INSERT INTO public.services (location_id, name, category, duration_minutes, price_cash, price_card, is_add_on, discount_when_bundled, display_order) VALUES
  (beverly_id, 'French Tips', 'add_ons', 10, 10, 11, true, 3, 12),
  (beverly_id, 'Nail Art (Simple)', 'add_ons', 15, 13, 14, true, 3, 13),
  (beverly_id, 'Gel Polish Upgrade', 'add_ons', 15, 18, 20, true, 4, 14),
  (beverly_id, 'Paraffin Treatment', 'add_ons', 15, 13, 14, true, 3, 15);

  -- Insert staff for Downtown
  INSERT INTO public.staff (location_id, first_name, last_name, avatar_emoji, status, display_order) VALUES
  (downtown_id, 'Emma', 'Johnson', '👩', 'available_now', 1),
  (downtown_id, 'Michael', 'Chen', '👨', 'available_later', 2),
  (downtown_id, 'Sophia', 'Martinez', '👩', 'available_now', 3),
  (downtown_id, 'David', 'Kim', '👨', 'unavailable', 4),
  (downtown_id, 'Jessica', 'Brown', '👩', 'available_now', 5),
  (downtown_id, 'James', 'Wilson', '👨', 'available_later', 6);

  -- Insert staff for Beverly Hills
  INSERT INTO public.staff (location_id, first_name, last_name, avatar_emoji, status, display_order) VALUES
  (beverly_id, 'Emily', 'Taylor', '👩', 'available_now', 1),
  (beverly_id, 'Daniel', 'Anderson', '👨', 'available_later', 2),
  (beverly_id, 'Olivia', 'Garcia', '👩', 'available_now', 3),
  (beverly_id, 'Ryan', 'Rodriguez', '👨', 'unavailable', 4),
  (beverly_id, 'Isabella', 'Lee', '👩', 'available_now', 5),
  (beverly_id, 'Matthew', 'White', '👨', 'available_later', 6);
END $$;