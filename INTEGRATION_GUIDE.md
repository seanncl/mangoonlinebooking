# POS Integration Guide

This guide explains how to replace the mock data implementation with your actual POS backend.

## 🎯 Overview

The booking portal is currently built with a clean service layer architecture that makes integration straightforward:

```
UI Components (React Pages)
    ↓
Service Layer (IBookingAPI interface)
    ↓
MockBookingAPI (current) → RealBookingAPI (your implementation)
    ↓
Your POS Backend
```

## 📋 Table of Contents

1. [Understanding the Architecture](#understanding-the-architecture)
2. [Step-by-Step Integration](#step-by-step-integration)
3. [API Contract Reference](#api-contract-reference)
4. [Data Type Mapping](#data-type-mapping)
5. [Testing Your Integration](#testing-your-integration)
6. [Troubleshooting](#troubleshooting)

---

## Understanding the Architecture

### Service Layer Files

All booking API logic is in `src/services/booking-api/`:

```
src/services/booking-api/
├── types.ts                 # TypeScript type definitions (API request/response types)
├── booking-api.interface.ts # IBookingAPI interface (the contract)
├── mock-booking-api.ts      # MockBookingAPI class (current implementation)
├── mock-data.ts             # Mock data (to be removed)
└── index.ts                 # Exports singleton instance
```

### Key Files to Modify

You will **create one new file** and **modify one line** in one existing file:

1. **Create:** `src/services/booking-api/real-booking-api.ts`
2. **Modify:** `src/services/booking-api/index.ts` (change 1 line)

**That's it!** No other code changes needed.

---

## Step-by-Step Integration

### Step 1: Review the IBookingAPI Interface

Open `src/services/booking-api/booking-api.interface.ts` and review the methods you need to implement:

```typescript
export interface IBookingAPI {
  getLocations(): Promise<ApiResponse<Location[]>>;
  getServices(locationId: string): Promise<ApiResponse<Service[]>>;
  getStaff(locationId: string): Promise<ApiResponse<Staff[]>>;
  checkAvailability(params: AvailabilityRequest): Promise<ApiResponse<AvailabilityResponse>>;
  createBooking(params: BookingRequest): Promise<ApiResponse<BookingResponse>>;
  sendVerificationCode(phone: string): Promise<ApiResponse<VerificationCodeResponse>>;
  verifyCode(phone: string, code: string): Promise<ApiResponse<VerifyCodeResponse>>;
}
```

### Step 2: Set Up Environment Variables

Add your POS API configuration to `.env`:

```env
# POS API Configuration
VITE_POS_API_URL=https://your-pos-api.com/api
VITE_POS_API_KEY=your_api_key_here
VITE_POS_TENANT_ID=your_tenant_id_here  # if needed
```

### Step 3: Create RealBookingAPI Class

Create `src/services/booking-api/real-booking-api.ts`:

```typescript
import { IBookingAPI } from './booking-api.interface';
import {
  ApiResponse,
  Location,
  Service,
  Staff,
  AvailabilityRequest,
  AvailabilityResponse,
  BookingRequest,
  BookingResponse,
  VerificationCodeResponse,
  VerifyCodeResponse,
} from './types';

export class RealBookingAPI implements IBookingAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_POS_API_URL || '';
    this.apiKey = import.meta.env.VITE_POS_API_KEY || '';
  }

  /**
   * Helper method for making API requests
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get all locations
   * TODO: Map your POS API response to Location[] type
   */
  async getLocations(): Promise<ApiResponse<Location[]>> {
    // Example: GET /locations
    return this.request<Location[]>('/locations');
  }

  /**
   * Get services for a specific location
   * TODO: Map your POS API response to Service[] type
   */
  async getServices(locationId: string): Promise<ApiResponse<Service[]>> {
    // Example: GET /locations/:id/services
    return this.request<Service[]>(`/locations/${locationId}/services`);
  }

  /**
   * Get staff for a specific location
   * TODO: Map your POS API response to Staff[] type
   */
  async getStaff(locationId: string): Promise<ApiResponse<Staff[]>> {
    // Example: GET /locations/:id/staff
    return this.request<Staff[]>(`/locations/${locationId}/staff`);
  }

  /**
   * Check availability for booking
   * TODO: Implement your availability checking logic
   */
  async checkAvailability(
    params: AvailabilityRequest
  ): Promise<ApiResponse<AvailabilityResponse>> {
    // Example: POST /availability/check
    return this.request<AvailabilityResponse>('/availability/check', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Create a new booking
   * TODO: Implement your booking creation logic
   */
  async createBooking(
    params: BookingRequest
  ): Promise<ApiResponse<BookingResponse>> {
    // Example: POST /bookings
    return this.request<BookingResponse>('/bookings', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Send verification code
   * TODO: Implement your SMS verification service
   */
  async sendVerificationCode(
    phone: string
  ): Promise<ApiResponse<VerificationCodeResponse>> {
    // Example: POST /verification/send
    return this.request<VerificationCodeResponse>('/verification/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  /**
   * Verify code
   * TODO: Implement your verification logic
   */
  async verifyCode(
    phone: string,
    code: string
  ): Promise<ApiResponse<VerifyCodeResponse>> {
    // Example: POST /verification/verify
    return this.request<VerifyCodeResponse>('/verification/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  }
}
```

### Step 4: Update the Singleton Export

Open `src/services/booking-api/index.ts` and change ONE line:

```typescript
// BEFORE (Mock implementation):
import { MockBookingAPI } from './mock-booking-api';
export const bookingAPI = new MockBookingAPI();

// AFTER (Real implementation):
import { RealBookingAPI } from './real-booking-api';
export const bookingAPI = new RealBookingAPI();

// Export types for use in components
export * from './types';
export type { IBookingAPI } from './booking-api.interface';
```

### Step 5: Test Locally

Start your dev server and test each flow:

```bash
npm run dev
```

Test these user journeys:
1. ✅ Location selection loads from POS API
2. ✅ Service selection shows real services
3. ✅ Staff selection displays actual staff members
4. ✅ Time selection shows real availability
5. ✅ Booking creation works end-to-end
6. ✅ Phone verification sends real SMS (if applicable)

---

## API Contract Reference

### 1. Get Locations

**Method:** `getLocations()`

**Your POS API Should Return:**
```typescript
{
  id: string;              // Unique location ID
  name: string;            // "Mango Nails - Downtown"
  address: string;         // "123 Main Street"
  city: string;            // "Los Angeles"
  state: string;           // "CA"
  zip_code: string;        // "90012"
  phone: string;           // "(213) 555-0100"
  email?: string;          // Optional
  hero_image_url?: string; // Optional
  hours_weekday: string;   // "Mon-Sat: 9:00 AM - 7:00 PM"
  hours_weekend: string;   // "Sun: 10:00 AM - 6:00 PM"
  has_deposit_policy: boolean;
  deposit_percentage: number;  // 20 = 20%
  cancellation_policy: string;
}[]
```

### 2. Get Services

**Method:** `getServices(locationId: string)`

**Your POS API Should Return:**
```typescript
{
  id: string;
  location_id: string;
  name: string;                    // "Gel Manicure"
  category: 'manicure' | 'pedicure' | 'extensions' | 'nail_art' | 'add_ons';
  description?: string;            // Optional description
  duration_minutes: number;        // 45
  price_cash: number;              // 40.00
  price_card: number;              // 43.00
  is_add_on: boolean;              // false for main services
  parent_service_id?: string;      // Only for add-ons
  discount_when_bundled: number;   // 2.00 (discount for add-ons)
  display_order: number;           // For sorting
  is_active: boolean;              // true
}[]
```

### 3. Get Staff

**Method:** `getStaff(locationId: string)`

**Your POS API Should Return:**
```typescript
{
  id: string;
  location_id: string;
  first_name: string;              // "Jessica"
  last_name: string;               // "Chen"
  avatar_emoji: string;            // "💅"
  photo_url?: string;              // Optional photo URL
  bio?: string;                    // Optional bio
  status: 'available_now' | 'available_later' | 'unavailable';
  next_available_time?: string;    // ISO timestamp if available_later
  specialties?: string[];          // ["Gel Manicure", "Nail Art"]
  is_active: boolean;              // true
  display_order: number;           // For sorting
}[]
```

### 4. Check Availability

**Method:** `checkAvailability(params: AvailabilityRequest)`

**Request Payload:**
```typescript
{
  locationId: string;         // Location UUID
  date: string;               // "2025-10-16" (YYYY-MM-DD format)
  staffIds?: string[];        // Optional: filter by staff
  totalDuration: number;      // Total minutes needed
  startAllSameTime: boolean;  // Whether services run simultaneously
}
```

**Your POS API Should Return:**
```typescript
{
  availableSlots: string[];   // ["09:00", "09:30", "10:00", ...]
  bestFitSlots: string[];     // ["10:00", "13:00", "15:00"] (recommendations)
  locationHours: {
    open: string;             // "09:00"
    close: string;            // "19:00"
  };
}
```

### 5. Create Booking

**Method:** `createBooking(params: BookingRequest)`

**Request Payload:**
```typescript
{
  customer: {
    id?: string;                      // Optional if existing customer
    email: string;
    phone: string;
    first_name?: string;
    last_name?: string;
    has_accepted_policy: boolean;
    sms_reminders_enabled: boolean;
    promotional_texts_enabled: boolean;
  };
  cart: Array<{
    service: Service;                 // Full service object
    addOns: Service[];                // Array of add-on services
    staffId?: string;                 // Assigned staff member
  }>;
  selectedLocation: Location;         // Full location object
  selectedDate: Date;
  selectedTime: string;               // "10:00"
  cartTotal: number;                  // Total amount
  depositAmount: number;              // Deposit if applicable
}
```

**Your POS API Should Return:**
```typescript
{
  booking_id: string;           // Your internal booking ID
  confirmation_number: string;  // User-facing confirmation (e.g., "MNG-20251016-1234")
}
```

### 6. Phone Verification (Optional)

**Methods:** `sendVerificationCode(phone)` and `verifyCode(phone, code)`

These are optional if your POS system doesn't handle SMS verification. You can:
- Keep using the mock implementation
- Integrate with Twilio/similar service
- Disable phone verification entirely

---

## Data Type Mapping

### Handling POS API Response Differences

Your POS API might use different field names. Here's how to handle mapping:

#### Option 1: Transform in RealBookingAPI

```typescript
async getServices(locationId: string): Promise<ApiResponse<Service[]>> {
  const response = await this.request<any[]>(`/locations/${locationId}/services`);
  
  if (!response.success || !response.data) {
    return response as ApiResponse<Service[]>;
  }
  
  // Map your POS API format to expected Service format
  const services: Service[] = response.data.map(posService => ({
    id: posService.service_id,                    // Different field name
    location_id: locationId,
    name: posService.service_name,                // Different field name
    category: mapCategory(posService.type),       // Different categories
    description: posService.desc || undefined,
    duration_minutes: posService.duration,
    price_cash: posService.cash_price,
    price_card: posService.card_price,
    is_add_on: posService.addon === 1,            // Boolean conversion
    parent_service_id: posService.parent_id || undefined,
    discount_when_bundled: posService.bundle_discount || 0,
    display_order: posService.sort_order,
    is_active: posService.active === 'Y',         // String to boolean
  }));
  
  return {
    success: true,
    data: services,
  };
}

// Helper function for category mapping
function mapCategory(posType: string): ServiceCategory {
  const mapping: Record<string, ServiceCategory> = {
    'MANI': 'manicure',
    'PEDI': 'pedicure',
    'EXT': 'extensions',
    'ART': 'nail_art',
    'ADDON': 'add_ons',
  };
  return mapping[posType] || 'add_ons';
}
```

#### Option 2: Backend Adapter Layer

If you control the POS API, create an adapter endpoint that returns data in the expected format.

---

## Testing Your Integration

### Development Testing

1. **Start with Read-Only Operations:**
   - Test `getLocations()` first
   - Then `getServices()`
   - Then `getStaff()`
   - Leave `createBooking()` for last

2. **Use Console Logging:**
```typescript
async getLocations(): Promise<ApiResponse<Location[]>> {
  console.log('🔍 Fetching locations from POS API...');
  const response = await this.request<Location[]>('/locations');
  console.log('✅ Locations response:', response);
  return response;
}
```

3. **Test Error Handling:**
   - Invalid API key
   - Network timeout
   - Invalid location ID
   - Malformed data

### Production Checklist

Before deploying to production:

- [ ] All 7 API methods implemented
- [ ] Error handling for network failures
- [ ] Error handling for invalid data
- [ ] API credentials secured (environment variables)
- [ ] Response data validated against TypeScript types
- [ ] Loading states work correctly
- [ ] Error messages are user-friendly
- [ ] Booking confirmation emails sent (if applicable)
- [ ] SMS notifications sent (if applicable)
- [ ] POS system records bookings correctly
- [ ] Payment processing integrated (if applicable)

---

## Troubleshooting

### Common Issues

#### Issue: TypeScript Type Errors

**Solution:** Your POS API might return slightly different data structures. Use type guards and transformations:

```typescript
function isValidLocation(obj: any): obj is Location {
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.address === 'string' &&
    // ... check all required fields
  );
}

async getLocations(): Promise<ApiResponse<Location[]>> {
  const response = await this.request<any[]>('/locations');
  
  if (!response.success || !response.data) {
    return response as ApiResponse<Location[]>;
  }
  
  // Validate and transform data
  const validLocations = response.data
    .filter(isValidLocation)
    .map(transformLocation);  // Your transformation function
  
  return {
    success: true,
    data: validLocations,
  };
}
```

#### Issue: CORS Errors

**Solution:** Configure CORS on your POS API or use a proxy:

```typescript
// Option 1: Proxy through your backend
private baseUrl = '/api/pos'; // Proxy configured in vite.config.ts

// Option 2: Request CORS headers from POS API
// Access-Control-Allow-Origin: *
// Access-Control-Allow-Methods: GET, POST, PUT, DELETE
// Access-Control-Allow-Headers: Content-Type, Authorization
```

#### Issue: Slow API Responses

**Solution:** Implement caching and loading states:

```typescript
private cache: Map<string, { data: any; timestamp: number }> = new Map();
private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async getLocations(): Promise<ApiResponse<Location[]>> {
  // Check cache
  const cached = this.cache.get('locations');
  if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
    return { success: true, data: cached.data };
  }
  
  // Fetch fresh data
  const response = await this.request<Location[]>('/locations');
  
  if (response.success && response.data) {
    this.cache.set('locations', {
      data: response.data,
      timestamp: Date.now(),
    });
  }
  
  return response;
}
```

---

## Database Schema Reference

See `supabase/migrations/README.md` for the original database schema design. These files serve as documentation for understanding:
- Expected data structures
- Table relationships
- Business logic (triggers, functions)
- Security model (RLS policies)

Use them as a reference when mapping your POS API to the expected types.

---

## Support

If you encounter issues during integration:

1. Review the TypeScript interfaces in `src/types/booking.ts`
2. Check the `IBookingAPI` interface in `src/services/booking-api/booking-api.interface.ts`
3. Compare with mock implementation in `mock-booking-api.ts` for expected behavior
4. Examine the database migrations for data structure reference

---

**Good luck with your integration!** The clean separation between UI and data layer means you can take your time with the POS integration while the UI remains fully functional with mock data.
