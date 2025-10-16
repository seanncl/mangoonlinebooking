import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

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
    const bookingData = await req.json();
    
    const {
      customer,
      location,
      services,
      selectedDate,
      selectedTime,
      startAllSameTime,
      serviceOrder,
    } = bookingData;

    // Validate required fields
    if (!customer || !location || !services || services.length === 0 || !selectedDate || !selectedTime) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required booking information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique confirmation number
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const confirmationNumber = `MNG-${dateStr}-${randomStr}`;

    // Create or update customer
    let customerId = customer.id;
    if (!customerId) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customer.email)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        // Update existing customer
        await supabase
          .from('customers')
          .update({
            phone: customer.phone,
            first_name: customer.first_name,
            last_name: customer.last_name,
            has_accepted_policy: customer.has_accepted_policy,
            policy_accepted_at: customer.has_accepted_policy ? new Date().toISOString() : null,
          })
          .eq('id', customerId);
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            email: customer.email,
            phone: customer.phone,
            first_name: customer.first_name,
            last_name: customer.last_name,
            has_accepted_policy: customer.has_accepted_policy,
            policy_accepted_at: customer.has_accepted_policy ? new Date().toISOString() : null,
            sms_reminders_enabled: customer.sms_reminders_enabled ?? true,
            promotional_texts_enabled: customer.promotional_texts_enabled ?? false,
          })
          .select()
          .single();

        if (customerError) {
          console.error('Error creating customer:', customerError);
          return new Response(
            JSON.stringify({ success: false, message: 'Failed to create customer record' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        customerId = newCustomer.id;
      }
    }

    // Calculate totals
    let subtotal = 0;
    let totalDurationMinutes = 0;

    services.forEach((cartService: any) => {
      const service = cartService.service;
      subtotal += service.price_card; // Using card price by default
      totalDurationMinutes += service.duration_minutes;
      
      // Add add-ons
      if (cartService.addOns && cartService.addOns.length > 0) {
        cartService.addOns.forEach((addOn: any) => {
          subtotal += addOn.price_card;
          totalDurationMinutes += addOn.duration_minutes;
        });
      }
    });

    // Calculate deposit if location has deposit policy
    const depositAmount = location.has_deposit_policy 
      ? subtotal * (location.deposit_percentage / 100) 
      : 0;
    const remainingAmount = subtotal - depositAmount;

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        customer_id: customerId,
        location_id: location.id,
        booking_date: selectedDate,
        start_time: selectedTime,
        total_duration_minutes: totalDurationMinutes,
        subtotal,
        deposit_amount: depositAmount,
        remaining_amount: remainingAmount,
        start_all_same_time: startAllSameTime,
        confirmation_number: confirmationNumber,
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to create booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create booking services records
    const bookingServices = [];
    for (let i = 0; i < services.length; i++) {
      const cartService = services[i];
      const service = cartService.service;
      const serviceOrderIndex = serviceOrder ? serviceOrder.indexOf(service.id) : i;

      // Main service
      bookingServices.push({
        booking_id: booking.id,
        service_id: service.id,
        staff_id: cartService.staffId || null,
        price_paid: service.price_card,
        service_order: serviceOrderIndex,
        start_time: selectedTime, // Will be calculated properly for sequential bookings
      });

      // Add-ons
      if (cartService.addOns && cartService.addOns.length > 0) {
        cartService.addOns.forEach((addOn: any) => {
          bookingServices.push({
            booking_id: booking.id,
            service_id: addOn.id,
            staff_id: cartService.staffId || null,
            price_paid: addOn.price_card,
            service_order: serviceOrderIndex,
            start_time: selectedTime,
          });
        });
      }
    }

    const { error: servicesError } = await supabase
      .from('booking_services')
      .insert(bookingServices);

    if (servicesError) {
      console.error('Error creating booking services:', servicesError);
      // Rollback booking
      await supabase.from('bookings').delete().eq('id', booking.id);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to create booking services' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Booking created successfully:', confirmationNumber);

    return new Response(
      JSON.stringify({
        success: true,
        bookingId: booking.id,
        confirmationNumber,
        customerId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-booking:', error);
    return new Response(
      JSON.stringify({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});