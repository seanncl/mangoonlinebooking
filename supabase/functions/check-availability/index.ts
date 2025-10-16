import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { locationId, date, staffIds, totalDuration, startAllSameTime } = await req.json();

    console.log('Checking availability:', { locationId, date, staffIds, totalDuration, startAllSameTime });

    // Get location operating hours
    const { data: location, error: locationError } = await supabaseClient
      .from('locations')
      .select('hours_weekday, hours_weekend')
      .eq('id', locationId)
      .single();

    if (locationError) throw locationError;

    const selectedDate = new Date(date);
    const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
    const hoursText = isWeekend ? location.hours_weekend : location.hours_weekday;

    // Parse operating hours (format: "Mon-Sat: 9:00 AM - 7:00 PM")
    const hoursMatch = hoursText.match(/(\d+:\d+ [AP]M) - (\d+:\d+ [AP]M)/);
    if (!hoursMatch) {
      throw new Error('Invalid hours format');
    }

    const [_, openTime, closeTime] = hoursMatch;

    // Query existing bookings for the selected date and staff
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    let bookedSlots: { staffId: string; startTime: string; endTime: string }[] = [];

    if (staffIds && staffIds.length > 0) {
      const { data: bookings, error: bookingsError } = await supabaseClient
        .from('bookings')
        .select('id, start_time, total_duration_minutes, booking_services(staff_id)')
        .eq('location_id', locationId)
        .eq('booking_date', selectedDate.toISOString().split('T')[0])
        .in('status', ['pending', 'confirmed']);

      if (bookingsError) throw bookingsError;

      // Build occupied time blocks for each staff member
      bookings?.forEach((booking: any) => {
        booking.booking_services.forEach((service: any) => {
          if (staffIds.includes(service.staff_id)) {
            const [hours, minutes] = booking.start_time.split(':');
            const startMinutes = parseInt(hours) * 60 + parseInt(minutes);
            const endMinutes = startMinutes + booking.total_duration_minutes;

            bookedSlots.push({
              staffId: service.staff_id,
              startTime: booking.start_time,
              endTime: `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`,
            });
          }
        });
      });
    }

    console.log('Booked slots:', bookedSlots);

    // Generate time slots (30-minute intervals)
    const slots: string[] = [];
    const parseTime = (timeStr: string) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const formatTime = (totalMinutes: number) => {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const openMinutes = parseTime(openTime);
    const closeMinutes = parseTime(closeTime);
    const bufferMinutes = 15; // Buffer between appointments

    for (let time = openMinutes; time < closeMinutes; time += 30) {
      const slotEndTime = time + totalDuration;
      
      // Check if slot fits within operating hours
      if (slotEndTime > closeMinutes) continue;

      // Check if all required staff are available
      let isAvailable = true;
      
      if (staffIds && staffIds.length > 0) {
        for (const staffId of staffIds) {
          const staffBookings = bookedSlots.filter(slot => slot.staffId === staffId);
          
          for (const booking of staffBookings) {
            const bookingStart = parseTime(booking.startTime);
            const bookingEnd = parseTime(booking.endTime);
            
            // Check for overlap with buffer
            if (
              (time >= bookingStart - bufferMinutes && time < bookingEnd + bufferMinutes) ||
              (slotEndTime > bookingStart - bufferMinutes && slotEndTime <= bookingEnd + bufferMinutes) ||
              (time <= bookingStart - bufferMinutes && slotEndTime >= bookingEnd + bufferMinutes)
            ) {
              isAvailable = false;
              break;
            }
          }
          
          if (!isAvailable) break;
        }
      }

      if (isAvailable) {
        slots.push(formatTime(time));
      }
    }

    // Determine best fit times (mid-morning, early afternoon, late afternoon)
    const bestFitSlots = slots.filter(slot => {
      const time = parseTime(slot);
      return (
        (time >= parseTime('10:00 AM') && time <= parseTime('10:30 AM')) ||
        (time >= parseTime('2:00 PM') && time <= parseTime('2:30 PM')) ||
        (time >= parseTime('4:00 PM') && time <= parseTime('4:30 PM'))
      );
    });

    console.log('Available slots:', slots.length);
    console.log('Best fit slots:', bestFitSlots);

    return new Response(
      JSON.stringify({
        availableSlots: slots,
        bestFitSlots,
        locationHours: {
          open: openTime,
          close: closeTime,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error checking availability:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, availableSlots: [], bestFitSlots: [] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 with empty array instead of error
      }
    );
  }
});
