// Booking API Service Layer
// MOCK DATA - Replace with RealBookingAPI when integrating with POS system

import { MockBookingAPI } from './mock-booking-api';

/**
 * Singleton instance of the booking API
 * 
 * TO INTEGRATE WITH REAL POS API:
 * 1. Create a new RealBookingAPI class that implements IBookingAPI
 * 2. Replace the line below with: export const bookingAPI = new RealBookingAPI();
 * 3. Configure your API base URL in environment variables
 * 
 * See INTEGRATION_GUIDE.md for detailed instructions
 */
export const bookingAPI = new MockBookingAPI();

// Export types for use in components
export * from './types';
export type { IBookingAPI } from './booking-api.interface';
