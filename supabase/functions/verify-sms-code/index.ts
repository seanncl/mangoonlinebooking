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
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ verified: false, message: 'Phone number and code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the most recent verification for this phone
    const { data: verification, error: fetchError } = await supabase
      .from('sms_verifications')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verification) {
      console.log('Verification not found:', fetchError);
      return new Response(
        JSON.stringify({ verified: false, message: 'Invalid verification code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already verified
    if (verification.is_verified) {
      return new Response(
        JSON.stringify({ verified: true, message: 'Code already verified' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if code has expired
    const expiresAt = new Date(verification.expires_at);
    const now = new Date();
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ verified: false, message: 'Verification code has expired. Please request a new code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if max attempts reached
    if (verification.attempts >= 3) {
      return new Response(
        JSON.stringify({ verified: false, message: 'Maximum verification attempts reached. Please request a new code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment attempts
    const newAttempts = verification.attempts + 1;
    const attemptsLeft = 3 - newAttempts;

    // Update verification record
    const { error: updateError } = await supabase
      .from('sms_verifications')
      .update({
        is_verified: true,
        attempts: newAttempts,
      })
      .eq('id', verification.id);

    if (updateError) {
      console.error('Error updating verification:', updateError);
      return new Response(
        JSON.stringify({ verified: false, message: 'Failed to verify code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Phone verified successfully:', phone);

    return new Response(
      JSON.stringify({ verified: true, message: 'Phone number verified successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-sms-code:', error);
    return new Response(
      JSON.stringify({ verified: false, message: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});