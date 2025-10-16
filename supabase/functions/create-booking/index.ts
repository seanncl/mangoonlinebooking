import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      customer,
      cart,
      selectedLocation,
      selectedDate,
      selectedTime,
      cartTotal,
      depositAmount,
    } = await req.json();

    console.log('Creating booking with data:', { customer, cart, selectedLocation, selectedDate, selectedTime });

    // 1. Upsert customer (insert or update based on email/phone)
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', customer.email)
      .eq('phone', customer.phone)
      .maybeSingle();

    let customerId: string;

    if (existingCustomer) {
      // Update existing customer
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          has_accepted_policy: true,
          policy_accepted_at: new Date().toISOString(),
        })
        .eq('id', existingCustomer.id)
        .select()
        .single();

      if (updateError) throw updateError;
      customerId = updatedCustomer.id;
    } else {
      // Insert new customer
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          has_accepted_policy: true,
          policy_accepted_at: new Date().toISOString(),
          sms_reminders_enabled: customer.sms_reminders_enabled || true,
          promotional_texts_enabled: customer.promotional_texts_enabled || false,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      customerId = newCustomer.id;
    }

    // 2. Generate unique confirmation number (format: MNG-YYYYMMDD-XXXX)
    const date = new Date(selectedDate);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const confirmationNumber = `MNG-${dateStr}-${randomNum}`;

    // 3. Calculate total duration
    const totalDuration = cart.reduce((total: number, item: any) => {
      const serviceDuration = item.service.duration_minutes;
      const addOnsDuration = item.addOns.reduce((sum: number, addOn: any) => sum + addOn.duration_minutes, 0);
      return total + serviceDuration + addOnsDuration;
    }, 0);

    // 4. Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_id: customerId,
        location_id: selectedLocation.id,
        booking_date: date.toISOString().split('T')[0],
        start_time: selectedTime,
        start_all_same_time: true,
        total_duration_minutes: totalDuration,
        subtotal: cartTotal,
        deposit_amount: depositAmount,
        remaining_amount: cartTotal - depositAmount,
        confirmation_number: confirmationNumber,
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 5. Insert booking services
    const bookingServices = cart.flatMap((item: any, index: number) => {
      const services = [
        {
          booking_id: booking.id,
          service_id: item.service.id,
          staff_id: item.staffId || null,
          price_paid: item.service.price_card,
          service_order: index,
        },
      ];

      // Add add-ons
      item.addOns.forEach((addOn: any) => {
        services.push({
          booking_id: booking.id,
          service_id: addOn.id,
          staff_id: item.staffId || null,
          price_paid: addOn.price_card - addOn.discount_when_bundled,
          service_order: index,
        });
      });

      return services;
    });

    const { error: servicesError } = await supabase
      .from('booking_services')
      .insert(bookingServices);

    if (servicesError) throw servicesError;

    console.log('Booking created successfully:', { booking_id: booking.id, confirmation_number: confirmationNumber });

    return new Response(
      JSON.stringify({
        booking_id: booking.id,
        confirmation_number: confirmationNumber,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
