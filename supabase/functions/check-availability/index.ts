import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AvailabilityRequest {
  locationId: string;
  date: string;
  staffId?: string;
  durationMinutes: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { locationId, date, staffId, durationMinutes }: AvailabilityRequest = await req.json();

    console.log('Check availability request:', { locationId, date, staffId, durationMinutes });

    // Get all staff at this location (or specific staff if provided)
    const staffQuery = supabase
      .from('staff')
      .select('id')
      .eq('location_id', locationId)
      .eq('is_active', true);

    if (staffId) {
      staffQuery.eq('id', staffId);
    }

    const { data: staffList, error: staffError } = await staffQuery;

    if (staffError) throw staffError;
    if (!staffList || staffList.length === 0) {
      return new Response(
        JSON.stringify({ availableSlots: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get existing bookings for this date
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        total_duration_minutes,
        booking_services (
          staff_id,
          start_time
        )
      `)
      .eq('location_id', locationId)
      .eq('booking_date', date)
      .eq('status', 'confirmed');

    if (bookingsError) throw bookingsError;

    console.log('Found bookings:', bookings?.length || 0);

    // Define all possible time slots (9 AM to 7 PM, 30-minute intervals)
    const allSlots = [
      '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
      '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
      '6:00 PM', '6:30 PM', '7:00 PM'
    ];

    // Helper function to convert "9:00 AM" to minutes since midnight
    const timeToMinutes = (time: string): number => {
      const [timeStr, period] = time.split(' ');
      const [hours, minutes] = timeStr.split(':').map(Number);
      let totalMinutes = hours * 60 + minutes;
      if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60;
      if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60;
      return totalMinutes;
    };

    // Check if a time slot is available for at least one staff member
    const availableSlots = allSlots.filter(slot => {
      const slotStart = timeToMinutes(slot);
      const slotEnd = slotStart + durationMinutes;

      // Check if at least one staff member is available
      return staffList.some(staff => {
        // Check if this staff member has any conflicting bookings
        const hasConflict = bookings?.some(booking => {
          const bookingServices = booking.booking_services || [];
          
          // Check if this staff member is assigned to this booking
          const staffService = bookingServices.find((bs: any) => bs.staff_id === staff.id);
          if (!staffService) return false;

          // Get the booking's time range
          const bookingStart = timeToMinutes(booking.start_time);
          const bookingEnd = bookingStart + booking.total_duration_minutes;

          // Check for overlap
          return (slotStart < bookingEnd && slotEnd > bookingStart);
        });

        return !hasConflict;
      });
    });

    console.log('Available slots:', availableSlots.length);

    return new Response(
      JSON.stringify({ availableSlots }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error checking availability:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
