// API Request/Response Types for POS Integration
// These types define the contract between the UI and the backend API

import { Location, Service, Staff, Customer, CartService } from '@/types/booking';

// Re-export core types for convenience
export type { Location, Service, Staff, Customer, CartService };

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Availability Check
export interface AvailabilityRequest {
  locationId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  staffIds?: string[]; // Optional: filter by specific staff
  totalDuration: number; // Total duration in minutes
  startAllSameTime: boolean; // Whether all services start at same time
}

export interface AvailabilityResponse {
  availableSlots: string[]; // Array of time strings (HH:MM format)
  bestFitSlots: string[]; // Recommended time slots
  locationHours: {
    open: string;
    close: string;
  };
}

// Booking Creation
export interface BookingRequest {
  customer: Customer;
  cart: CartService[];
  selectedLocation: Location;
  selectedDate: Date;
  selectedTime: string;
  cartTotal: number;
  depositAmount: number;
}

export interface BookingResponse {
  booking_id: string;
  confirmation_number: string;
}

// Phone Verification (Mock only - replace with your actual verification flow)
export interface VerificationCodeRequest {
  phone: string;
}

export interface VerificationCodeResponse {
  success: boolean;
  message?: string;
}

export interface VerifyCodeRequest {
  phone: string;
  code: string;
}

export interface VerifyCodeResponse {
  verified: boolean;
  message?: string;
}
