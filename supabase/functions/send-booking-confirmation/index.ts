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
    const { bookingId } = await req.json();

    if (!bookingId) {
      return new Response(
        JSON.stringify({ success: false, message: 'Booking ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, message: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch booking details with all related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(*),
        location:locations(*),
        booking_services(
          *,
          service:services(*),
          staff:staff(*)
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError);
      return new Response(
        JSON.stringify({ success: false, message: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build services list HTML
    const servicesHtml = booking.booking_services
      .map((bs: any) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${bs.service.name}
            ${bs.staff ? `<br><small style="color: #6b7280;">with ${bs.staff.first_name} ${bs.staff.last_name}</small>` : ''}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            $${bs.price_paid.toFixed(2)}
          </td>
        </tr>
      `)
      .join('');

    // Format date and time
    const bookingDate = new Date(booking.booking_date);
    const formattedDate = bookingDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Build HTML email
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #06b6d4 0%, #ec4899 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Booking Confirmed! 🎉</h1>
            </div>

            <!-- Content -->
            <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Greeting -->
              <p style="font-size: 16px; margin-bottom: 20px;">
                Hi ${booking.customer.first_name || 'there'},
              </p>
              <p style="font-size: 16px; margin-bottom: 30px;">
                Thank you for booking with Mango Nail Spa! We can't wait to pamper you.
              </p>

              <!-- Confirmation Number -->
              <div style="background: #f0fdfa; border: 2px solid #06b6d4; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
                <div style="color: #0e7490; font-size: 14px; margin-bottom: 8px;">CONFIRMATION NUMBER</div>
                <div style="color: #06b6d4; font-size: 24px; font-weight: bold; letter-spacing: 1px;">
                  ${booking.confirmation_number}
                </div>
              </div>

              <!-- Appointment Details -->
              <h2 style="color: #111827; font-size: 20px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">
                Appointment Details
              </h2>

              <div style="margin-bottom: 30px;">
                <div style="margin-bottom: 15px;">
                  <strong style="color: #4b5563;">📅 Date:</strong> ${formattedDate}
                </div>
                <div style="margin-bottom: 15px;">
                  <strong style="color: #4b5563;">🕐 Time:</strong> ${booking.start_time}
                </div>
                <div style="margin-bottom: 15px;">
                  <strong style="color: #4b5563;">⏱️ Duration:</strong> ${booking.total_duration_minutes} minutes
                </div>
                <div style="margin-bottom: 15px;">
                  <strong style="color: #4b5563;">📍 Location:</strong> ${booking.location.name}<br>
                  <span style="color: #6b7280; font-size: 14px;">
                    ${booking.location.address}, ${booking.location.city}, ${booking.location.state} ${booking.location.zip_code}
                  </span>
                  <br>
                  <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location.address + ', ' + booking.location.city + ', ' + booking.location.state + ' ' + booking.location.zip_code)}" 
                     style="display: inline-block; margin-top: 8px; padding: 8px 16px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                    🗺️ Get Directions
                  </a>
                </div>
              </div>

              <!-- Services -->
              <h2 style="color: #111827; font-size: 20px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">
                Services Booked
              </h2>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                ${servicesHtml}
                <tr>
                  <td style="padding: 12px; font-weight: bold;">Subtotal</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold;">$${booking.subtotal.toFixed(2)}</td>
                </tr>
                ${booking.deposit_amount > 0 ? `
                <tr style="color: #059669;">
                  <td style="padding: 12px;">Deposit Paid</td>
                  <td style="padding: 12px; text-align: right;">-$${booking.deposit_amount.toFixed(2)}</td>
                </tr>
                <tr style="font-size: 18px; color: #ec4899;">
                  <td style="padding: 12px; font-weight: bold;">Balance Due at Salon</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold;">$${booking.remaining_amount.toFixed(2)}</td>
                </tr>
                ` : `
                <tr style="font-size: 18px; color: #06b6d4;">
                  <td style="padding: 12px; font-weight: bold;">Total Due at Salon</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold;">$${booking.subtotal.toFixed(2)}</td>
                </tr>
                `}
              </table>

              <!-- Cancellation Policy -->
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
                <strong style="color: #92400e;">Cancellation Policy:</strong><br>
                <span style="color: #78350f; font-size: 14px;">
                  ${booking.location.cancellation_policy}
                </span>
              </div>

              <!-- CTA Buttons -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Mango+Nail+Spa+Appointment&dates=${bookingDate.toISOString().replace(/-|:|\.\d+/g, '')}/${bookingDate.toISOString().replace(/-|:|\.\d+/g, '')}&details=Confirmation:+${booking.confirmation_number}&location=${encodeURIComponent(booking.location.address)}" 
                   style="display: inline-block; background: #06b6d4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 10px;">
                  📅 Add to Calendar
                </a>
              </div>

              <!-- Contact Info -->
              <div style="text-align: center; padding-top: 30px; border-top: 2px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">
                  Questions? Contact us at:
                </p>
                <p style="color: #111827; margin: 5px 0;">
                  📞 ${booking.location.phone}
                </p>
                ${booking.location.email ? `
                <p style="color: #111827; margin: 5px 0;">
                  ✉️ ${booking.location.email}
                </p>
                ` : ''}
              </div>

            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Mango Nail Spa. All rights reserved.</p>
            </div>

          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mango Nail Spa <bookings@mangonailspa.com>',
        to: [booking.customer.email],
        subject: `Booking Confirmed - ${booking.confirmation_number}`,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend API error:', errorText);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailData = await emailResponse.json();

    console.log('Email sent successfully:', emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailData.id,
        message: 'Confirmation email sent successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-booking-confirmation:', error);
    return new Response(
      JSON.stringify({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});