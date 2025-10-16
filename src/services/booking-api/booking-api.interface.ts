// IBookingAPI Interface - Contract for POS Integration
// Your dev team should implement this interface with a RealBookingAPI class

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

export interface IBookingAPI {
  /**
   * Get all available locations
   * @returns List of salon locations
   */
  getLocations(): Promise<ApiResponse<Location[]>>;

  /**
   * Get all services for a specific location
   * @param locationId - The location UUID
   * @returns List of services available at that location
   */
  getServices(locationId: string): Promise<ApiResponse<Service[]>>;

  /**
   * Get all active staff members for a specific location
   * @param locationId - The location UUID
   * @returns List of staff members at that location
   */
  getStaff(locationId: string): Promise<ApiResponse<Staff[]>>;

  /**
   * Check available time slots for booking
   * @param params - Availability parameters (location, date, duration, etc.)
   * @returns Available time slots and recommendations
   */
  checkAvailability(
    params: AvailabilityRequest
  ): Promise<ApiResponse<AvailabilityResponse>>;

  /**
   * Create a new booking
   * @param params - Complete booking information
   * @returns Booking confirmation with confirmation number
   */
  createBooking(
    params: BookingRequest
  ): Promise<ApiResponse<BookingResponse>>;

  /**
   * Send SMS verification code to phone number
   * NOTE: This is mock implementation - replace with your actual SMS verification
   * @param phone - Phone number to verify
   * @returns Success status
   */
  sendVerificationCode(
    phone: string
  ): Promise<ApiResponse<VerificationCodeResponse>>;

  /**
   * Verify SMS code
   * NOTE: This is mock implementation - replace with your actual verification logic
   * @param phone - Phone number being verified
   * @param code - Verification code entered by user
   * @returns Verification result
   */
  verifyCode(
    phone: string,
    code: string
  ): Promise<ApiResponse<VerifyCodeResponse>>;
}
