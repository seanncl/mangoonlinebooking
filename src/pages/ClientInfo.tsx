import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { BookingFooter } from '@/components/layout/BookingFooter';
import { useBooking } from '@/context/BookingContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ClientInfo() {
  const navigate = useNavigate();
  const { setCustomer, customer } = useBooking();
  const { toast } = useToast();
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    toast({
      title: 'Coming Soon',
      description: `${provider === 'google' ? 'Google' : 'Apple'} login will be available soon.`,
    });
  };

  const handleManualEntry = async () => {
    if (!email || !phone) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and phone number.',
        variant: 'destructive',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    // Phone validation (basic)
    const phoneRegex = /^\d{10}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      toast({
        title: 'Invalid Phone',
        description: 'Please enter a 10-digit phone number.',
        variant: 'destructive',
      });
      return;
    }

    // Format phone with +1 country code
    const formattedPhone = `+1${cleanPhone}`;

    setIsLoading(true);

    // Send verification SMS
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-sms', {
        body: { phone: formattedPhone }
      });

      if (error) throw error;

      if (data?.success) {
        setCustomer({
          email,
          phone: formattedPhone,
          has_accepted_policy: false,
          sms_reminders_enabled: true,
          promotional_texts_enabled: false,
        });

        toast({
          title: 'Code Sent',
          description: `Verification code sent to ${formattedPhone}`,
        });

        navigate('/verify');
      } else {
        toast({
          title: 'Failed to Send Code',
          description: data?.message || 'Please try again',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending verification SMS:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send verification code',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingHeader title="Your Information" />

      <main className="flex-1 container max-w-md px-4 py-6 pb-24">
        {/* Social Login Options */}
        <div className="space-y-4 mb-8">
          <Button
            variant="outline"
            className="w-full h-12 text-base"
            onClick={() => handleSocialLogin('google')}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 text-base"
            onClick={() => handleSocialLogin('apple')}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Continue with Apple
          </Button>
        </div>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
          </div>
        </div>

        {/* Manual Entry Form */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Button
              onClick={handleManualEntry}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Processing...' : 'Continue'}
            </Button>
          </CardContent>
        </Card>

        {/* Privacy Note */}
        <div className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Your information is secure and will only be used for booking confirmation and
            appointment reminders.
          </p>
        </div>
      </main>

      <BookingFooter hideNext />
    </div>
  );
}
