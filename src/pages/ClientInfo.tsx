import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { BookingFooter } from '@/components/layout/BookingFooter';
import { useBooking } from '@/context/BookingContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Lock, Mail, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type FlowStep = 'initial' | 'otp-verify' | 'collect-info';

export default function ClientInfo() {
  const navigate = useNavigate();
  const { setCustomer, customer } = useBooking();
  const { user, loginWithPhone } = useAuth();
  const { toast } = useToast();

  // Flow state
  const [step, setStep] = useState<FlowStep>('initial');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Customer data
  const [customerExists, setCustomerExists] = useState(false);
  const [autoFilledData, setAutoFilledData] = useState<any>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [createAccount, setCreateAccount] = useState(false);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user && !customer?.first_name) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user, customer]);

  // Format phone number for display
  const formatPhoneDisplay = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneDisplay(e.target.value);
    setPhone(formatted);
  };

  // Mock OAuth handler
  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsLoading(true);

    // [API INTEGRATION POINT]
    // POST /api/auth/oauth
    // Body: { provider: 'google' | 'apple', redirect_uri: string }
    // Response: { user_data: { email, name, phone? }, customer_exists: boolean }

    // Mock: Simulate OAuth returning user data
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockOAuthData = {
      email: `user@${provider}.com`,
      first_name: 'John',
      last_name: 'Doe',
      phone: null // OAuth rarely provides phone
    };

    setAutoFilledData(mockOAuthData);
    setFirstName(mockOAuthData.first_name);
    setLastName(mockOAuthData.last_name);
    setEmail(mockOAuthData.email);

    setIsLoading(false);

    if (!mockOAuthData.phone) {
      // Need to collect phone for SMS confirmation
      toast({
        title: 'Phone Required',
        description: 'Please enter your phone number to complete booking',
      });
      // Stay on phone collection step
    } else {
      setPhone(mockOAuthData.phone);
      await handlePhoneSubmit(mockOAuthData.phone);
    }
  };

  // Mock phone submission
  const handlePhoneSubmit = async (phoneOverride?: string) => {
    const phoneToUse = phoneOverride || phone;
    const cleanPhone = phoneToUse.replace(/\D/g, '');

    // Validate phone
    if (cleanPhone.length !== 10) {
      toast({
        title: 'Invalid Phone',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // [API INTEGRATION POINT]
    // POST /api/send-otp
    // Body: { phone: string }
    // Response: { success: boolean, message: string }

    // Mock: Check if customer exists
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock logic: If phone starts with 555, it's existing customer
    const exists = cleanPhone.startsWith('555');
    setCustomerExists(exists);

    if (exists) {
      // [API INTEGRATION POINT]
      // GET /api/check-customer?phone=xxx
      // Response: { exists: boolean, data?: Customer }

      // Mock: Fetch customer data
      setAutoFilledData({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: cleanPhone,
      });
      setFirstName('Jane');
      setLastName('Smith');
      setEmail('jane@example.com');
    }

    setIsLoading(false);

    // Show success toast
    toast({
      title: 'Code Sent',
      description: `Verification code sent to ${formatPhoneDisplay(cleanPhone)}`,
    });

    setStep('otp-verify');
  };

  // Mock OTP verification
  const handleOtpVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter the 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    // Demo code check
    if (otp !== '123456') {
      toast({
        title: 'Invalid Code',
        description: 'The code you entered is incorrect. Try 123456 for demo.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // [API INTEGRATION POINT]
    // POST /api/verify-otp
    // Body: { phone: string, code: string }
    // Response: { 
    //   verified: boolean, 
    //   customer_exists: boolean,
    //   customer_data?: { first_name, last_name, email }
    // }

    await new Promise(resolve => setTimeout(resolve, 500));

    setIsLoading(false);

    if (customerExists && autoFilledData) {
      // Existing customer - auto-fill and continue
      const cleanPhone = phone.replace(/\D/g, '');
      
      setCustomer({
        ...autoFilledData,
        has_accepted_policy: false,
        sms_reminders_enabled: true,
        promotional_texts_enabled: false,
      });

      // Authenticate user in AuthContext
      await loginWithPhone(cleanPhone, {
        id: autoFilledData.id,
        firstName: autoFilledData.first_name,
        lastName: autoFilledData.last_name,
        email: autoFilledData.email,
        phone: cleanPhone
      });

      toast({
        title: 'Welcome back!',
        description: 'Your information has been loaded',
      });

      navigate('/confirm');
    } else {
      // New customer - collect additional info
      toast({
        title: 'Phone Verified',
        description: 'Please complete your information',
      });
      setStep('collect-info');
    }
  };

  // Collect additional info for new customers
  const handleCollectInfo = async () => {
    if (!firstName || !lastName || !email) {
      toast({
        title: 'Missing Information',
        description: 'Please complete all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');

    setIsLoading(true);

    try {
      // [API INTEGRATION POINT]
      // POST /api/customers
      // Body: { first_name, last_name, email, phone }
      // Response: { customer_id: string, auth_user_id?: string }

      await new Promise(resolve => setTimeout(resolve, 500));

      setCustomer({
        first_name: firstName,
        last_name: lastName,
        email,
        phone: cleanPhone,
        has_accepted_policy: false,
        sms_reminders_enabled: true,
        promotional_texts_enabled: false,
      });

      // Authenticate user in AuthContext
      await loginWithPhone(cleanPhone, {
        firstName,
        lastName,
        email,
        phone: cleanPhone
      });

      toast({
        title: 'Account Created',
        description: 'Your information has been saved',
      });

      navigate('/confirm');
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    // [API INTEGRATION POINT]
    // POST /api/send-otp (same as initial send)
    
    toast({
      title: 'Code Resent (Mock)',
      description: 'Use 123456 for demo',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingHeader title="Your Information" />

      <main className="flex-1 container max-w-md px-4 py-6 pb-24">
        {/* Step 1: Initial - Phone Collection */}
        {step === 'initial' && (
          <>
            {/* Social Login Options */}
            <div className="space-y-4 mb-8">
              <Button
                variant="outline"
                className="w-full h-12 text-base"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
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
                )}
                Continue with Google
              </Button>

              <Button
                variant="outline"
                className="w-full h-12 text-base"
                onClick={() => handleSocialLogin('apple')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                )}
                Continue with Apple
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or enter phone</span>
              </div>
            </div>

            {/* Phone Entry */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={14}
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll text you a code to confirm your booking
                  </p>
                </div>

                <Button
                  onClick={() => handlePhoneSubmit()}
                  disabled={isLoading || phone.replace(/\D/g, '').length !== 10}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    'Continue'
                  )}
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
          </>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp-verify' && (
          <>
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">Enter Verification Code</h3>
                  <p className="text-sm text-muted-foreground">
                    We sent a 6-digit code to<br />
                    <span className="font-semibold text-foreground">{phone}</span>
                  </p>
                </div>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleOtpVerify}
                  disabled={isLoading || otp.length !== 6}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>

                <div className="text-center space-y-2">
                  <Button
                    variant="ghost"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm"
                  >
                    Resend Code
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Demo code: <span className="font-mono font-semibold">123456</span>
                  </p>
                </div>

                <Button
                  variant="link"
                  onClick={() => setStep('initial')}
                  className="w-full text-sm"
                >
                  Change phone number
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 3: Collect Additional Info */}
        {step === 'collect-info' && (
          <>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold">Complete Your Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Just a few more details to complete your booking
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

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

                <Button
                  onClick={handleCollectInfo}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Complete Booking'
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <BookingFooter hideNext />
    </div>
  );
}
