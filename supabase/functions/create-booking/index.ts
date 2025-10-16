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
    console.log('📝 Received booking data:', JSON.stringify(bookingData, null, 2));
    
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
      console.error('❌ Missing required booking information');
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
    console.log('🎫 Generated confirmation number:', confirmationNumber);

    // Create or update customer - Use phone as primary lookup, email as secondary
    let customerId = customer.id;
    let isNewCustomer = false;

    if (!customerId) {
      // First try to find by phone
      let existingCustomer = null;
      
      if (customer.phone) {
        const { data: phoneCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', customer.phone)
          .single();
        existingCustomer = phoneCustomer;
        console.log('🔍 Looked up customer by phone:', customer.phone, existingCustomer ? 'Found' : 'Not found');
      }

      // If not found by phone and email exists, try email
      if (!existingCustomer && customer.email) {
        const { data: emailCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', customer.email)
          .single();
        existingCustomer = emailCustomer;
        console.log('🔍 Looked up customer by email:', customer.email, existingCustomer ? 'Found' : 'Not found');
      }

      if (existingCustomer) {
        customerId = existingCustomer.id;
        // Update existing customer
        await supabase
          .from('customers')
          .update({
            email: customer.email,
            phone: customer.phone,
            first_name: customer.firstName || customer.first_name,
            last_name: customer.lastName || customer.last_name,
            has_accepted_policy: customer.has_accepted_policy,
            policy_accepted_at: customer.has_accepted_policy ? new Date().toISOString() : null,
          })
          .eq('id', customerId);
        console.log('✅ Updated existing customer:', customerId);
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            email: customer.email,
            phone: customer.phone,
            first_name: customer.firstName || customer.first_name,
            last_name: customer.lastName || customer.last_name,
            has_accepted_policy: customer.has_accepted_policy,
            policy_accepted_at: customer.has_accepted_policy ? new Date().toISOString() : null,
            sms_reminders_enabled: customer.sms_reminders_enabled ?? true,
            promotional_texts_enabled: customer.promotional_texts_enabled ?? false,
          })
          .select()
          .single();

        if (customerError) {
          console.error('❌ Error creating customer:', customerError);
          return new Response(
            JSON.stringify({ success: false, message: 'Failed to create customer record' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        customerId = newCustomer.id;
        isNewCustomer = true;
        console.log('✅ Created new customer:', customerId);
      }
    }

    // Calculate totals with add-on discounts applied
    let subtotal = 0;
    let totalDurationMinutes = 0;

    services.forEach((cartService: any) => {
      const service = cartService.service;
      subtotal += service.price_card;
      totalDurationMinutes += service.duration_minutes;
      console.log(`💰 Service: ${service.name} - $${service.price_card}`);
      
      // Add add-ons with discounts applied
      if (cartService.addOns && cartService.addOns.length > 0) {
        cartService.addOns.forEach((addOn: any) => {
          const discountedPrice = addOn.price_card - (addOn.discount_when_bundled || 0);
          subtotal += discountedPrice;
          totalDurationMinutes += addOn.duration_minutes;
          console.log(`   + Add-on: ${addOn.name} - $${addOn.price_card} - $${addOn.discount_when_bundled || 0} discount = $${discountedPrice}`);
        });
      }
    });

    console.log(`💵 Subtotal: $${subtotal}, Duration: ${totalDurationMinutes} min`);

    // Calculate deposit if location has deposit policy
    const depositAmount = location.has_deposit_policy 
      ? subtotal * (location.deposit_percentage / 100) 
      : 0;
    const remainingAmount = subtotal - depositAmount;

    console.log(`💳 Deposit: $${depositAmount}, Remaining: $${remainingAmount}`);

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
      console.error('❌ Error creating booking:', bookingError);
      
      // Rollback: delete customer if newly created
      if (isNewCustomer && customerId) {
        await supabase.from('customers').delete().eq('id', customerId);
        console.log('🔄 Rolled back customer creation');
      }
      
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to create booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Created booking:', booking.id);

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
        start_time: selectedTime,
      });

      // Add-ons with discounts applied
      if (cartService.addOns && cartService.addOns.length > 0) {
        cartService.addOns.forEach((addOn: any) => {
          const discountedPrice = addOn.price_card - (addOn.discount_when_bundled || 0);
          bookingServices.push({
            booking_id: booking.id,
            service_id: addOn.id,
            staff_id: cartService.staffId || null,
            price_paid: discountedPrice,
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
      console.error('❌ Error creating booking services:', servicesError);
      
      // Rollback booking and customer
      await supabase.from('bookings').delete().eq('id', booking.id);
      console.log('🔄 Rolled back booking');
      
      if (isNewCustomer && customerId) {
        await supabase.from('customers').delete().eq('id', customerId);
        console.log('🔄 Rolled back customer creation');
      }
      
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to create booking services' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Created booking services');
    console.log('🎉 Booking created successfully:', confirmationNumber);

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
    console.error('❌ Error in create-booking:', error);
    return new Response(
      JSON.stringify({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
