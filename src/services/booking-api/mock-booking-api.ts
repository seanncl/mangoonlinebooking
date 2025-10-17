// MOCK IMPLEMENTATION - Replace with real POS API integration
// This class simulates API calls with realistic delays and mock data

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
import { mockLocations, mockServices, mockStaff, mockTimeSlots, mockUnavailableDates } from './mock-data';

export class MockBookingAPI implements IBookingAPI {
  /**
   * Simulate network delay for realistic testing
   */
  private async delay(ms: number = 300): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get all locations
   * TODO: Replace with actual POS API call to fetch locations
   */
  async getLocations(): Promise<ApiResponse<Location[]>> {
    await this.delay(200);
    
    try {
      return {
        success: true,
        data: mockLocations,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch locations',
      };
    }
  }

  /**
   * Get services for a specific location
   * TODO: Replace with actual POS API call to fetch services
   */
  async getServices(locationId: string): Promise<ApiResponse<Service[]>> {
    await this.delay(250);

    try {
      // Filter services by location
      // NOTE: In real implementation, the API should handle this filtering
      const services = mockServices.filter(
        (service) => service.location_id === locationId
      );

      return {
        success: true,
        data: services,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch services',
      };
    }
  }

  /**
   * Get staff for a specific location
   * TODO: Replace with actual POS API call to fetch staff
   */
  async getStaff(locationId: string): Promise<ApiResponse<Staff[]>> {
    await this.delay(200);

    try {
      // Filter staff by location
      // NOTE: In real implementation, the API should handle this filtering
      const staff = mockStaff.filter(
        (member) => member.location_id === locationId && member.is_active
      );

      return {
        success: true,
        data: staff,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch staff',
      };
    }
  }

  /**
   * Check availability for booking
   * TODO: Replace with actual POS API call to check real-time availability
   */
  async checkAvailability(
    params: AvailabilityRequest
  ): Promise<ApiResponse<AvailabilityResponse>> {
    await this.delay(400);

    try {
      // Check if this date is in the unavailable dates list
      const dateStr = params.date;
      if (mockUnavailableDates.includes(dateStr)) {
        // Return empty slots for unavailable dates
        return {
          success: true,
          data: {
            availableSlots: [],
            bestFitSlots: [],
            locationHours: {
              open: '09:00',
              close: '19:00'
            },
          },
        };
      }

      // Get default time slots
      const allSlots = mockTimeSlots.default || [];

      // In a real implementation, this would:
      // 1. Query the POS system for existing bookings on this date
      // 2. Check staff availability and schedules
      // 3. Filter out time slots that don't have enough buffer time
      // 4. Consider the total duration and startAllSameTime parameter

      // For mock: Create consistent but varied availability based on date
      // Parse date string in local timezone (not UTC)
      const [year, month, day] = params.date.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      const dayOfWeek = date.getDay();
      
      console.log('Mock API - Date string:', params.date);
      console.log('Mock API - Parsed date:', date.toLocaleDateString());
      console.log('Mock API - Day of week:', dayOfWeek, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]);
      
      // Simulate realistic booking patterns:
      // - Weekends (Sat/Sun) are busier - remove more slots
      // - Mid-week has good availability
      const removalRate = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.4 : 0.25;
      
      console.log('Mock API - Removal rate:', removalRate);
      console.log('Mock API - Total slots before filtering:', allSlots.length);
      
      // Use date as seed for consistent results per date
      const dateSeed = date.getTime();
      const availableSlots = allSlots.filter((slot, index) => {
        // Create pseudo-random but consistent removal based on date + index
        const slotSeed = (dateSeed + index * 1000) % 100;
        return slotSeed > (removalRate * 100);
      });
      
      console.log('Mock API - Available slots after filtering:', availableSlots.length);

      // Best fit slots (mid-morning, early afternoon, late afternoon)
      const bestFitSlots = availableSlots.filter((slot) => {
        return slot === '10:00 AM' || slot === '10:30 AM' || 
               slot === '1:00 PM' || slot === '1:30 PM' || 
               slot === '3:00 PM' || slot === '3:30 PM';
      });

      // Determine location hours based on day of week
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const locationHours = isWeekend
        ? { open: '10:00', close: '18:00' }
        : { open: '09:00', close: '19:00' };

      return {
        success: true,
        data: {
          availableSlots,
          bestFitSlots: bestFitSlots.slice(0, 3), // Limit to 3 recommendations
          locationHours,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check availability',
      };
    }
  }

  /**
   * Create a new booking
   * TODO: Replace with actual POS API call to create booking
   */
  async createBooking(
    params: BookingRequest
  ): Promise<ApiResponse<BookingResponse>> {
    await this.delay(500);

    try {
      // Generate confirmation number (format: MNG-YYYYMMDD-XXXX)
      const dateStr = params.selectedDate
        .toISOString()
        .split('T')[0]
        .replace(/-/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const confirmationNumber = `MNG-${dateStr}-${randomNum}`;

      // Generate booking ID (in real implementation, this comes from the database)
      const bookingId = `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // In a real implementation, this would:
      // 1. Validate all input data
      // 2. Create customer record (or update existing)
      // 3. Create booking record in POS system
      // 4. Create booking_services records for each service + add-ons
      // 5. Process payment/deposit if applicable
      // 6. Send confirmation email/SMS
      // 7. Return booking confirmation

      console.log('Mock Booking Created:', {
        bookingId,
        confirmationNumber,
        customer: params.customer,
        location: params.selectedLocation.name,
        date: params.selectedDate,
        time: params.selectedTime,
        services: params.cart.length,
        total: params.cartTotal,
        deposit: params.depositAmount,
      });

      return {
        success: true,
        data: {
          booking_id: bookingId,
          confirmation_number: confirmationNumber,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create booking',
      };
    }
  }

  /**
   * Send verification code
   * NOTE: Mock implementation - always succeeds
   * TODO: Replace with actual SMS verification service
   */
  async sendVerificationCode(
    phone: string
  ): Promise<ApiResponse<VerificationCodeResponse>> {
    await this.delay(300);

    // In real implementation:
    // 1. Validate phone number format
    // 2. Generate secure random code
    // 3. Send SMS via Twilio/similar service
    // 4. Store code with expiration in database
    // 5. Return success status

    console.log('Mock: Verification code sent to', phone);

    return {
      success: true,
      data: {
        success: true,
        message: 'Verification code sent (Mock: use 123456)',
      },
    };
  }

  /**
   * Verify code
   * NOTE: Mock implementation - accepts '123456' as valid code
   * TODO: Replace with actual verification logic
   */
  async verifyCode(
    phone: string,
    code: string
  ): Promise<ApiResponse<VerifyCodeResponse>> {
    await this.delay(200);

    // In real implementation:
    // 1. Look up stored verification code for this phone
    // 2. Check if code matches and hasn't expired
    // 3. Mark phone as verified in database
    // 4. Invalidate the verification code
    // 5. Return verification result

    const isValid = code === '123456'; // Mock: accept demo code

    console.log('Mock: Verification attempt for', phone, '- Code:', code, '- Valid:', isValid);

    return {
      success: true,
      data: {
        verified: isValid,
        message: isValid ? 'Phone verified successfully' : 'Invalid verification code',
      },
    };
  }
}
