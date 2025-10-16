import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { BookingFooter } from '@/components/layout/BookingFooter';
import { useBooking } from '@/context/BookingContext';
import { toast } from 'sonner';

export default function PhoneVerification() {
  const navigate = useNavigate();
  const { customer, setPhoneVerified } = useBooking();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!customer) {
      navigate('/');
      return;
    }
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, [customer, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];

    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }

    setCode(newCode);

    // Focus last filled input or first empty
    const nextEmptyIndex = newCode.findIndex(digit => digit === '');
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();

    // Auto-submit if complete
    if (newCode.every(digit => digit !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleVerify = async (codeToVerify: string) => {
    // Demo mode: accept "123456" as valid code
    if (codeToVerify === '123456') {
      toast.success('Phone number verified!');
      setPhoneVerified(true);
      navigate('/confirm');
    } else {
      toast.error('Invalid verification code. Try 123456 for demo.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = () => {
    if (!canResend) return;

    toast.success('Verification code resent!');
    setCode(['', '', '', '', '', '']);
    setCountdown(60);
    setCanResend(false);
    inputRefs.current[0]?.focus();
  };

  const maskedPhone = customer?.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');

  return (
    <div className="min-h-screen flex flex-col">
      <BookingHeader />

      <main className="flex-1 flex items-center justify-center pb-24">
        <div className="container max-w-md mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📱</div>
            <h1 className="text-2xl font-bold mb-2">Verify Your Phone Number</h1>
            <p className="text-muted-foreground">
              We sent a 6-digit code to <br />
              <strong>{maskedPhone}</strong>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Demo: Use code <strong>123456</strong>
            </p>
          </div>

          {/* Code Inputs */}
          <div className="flex gap-2 justify-center mb-8">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 text-center text-2xl font-semibold"
              />
            ))}
          </div>

          {/* Resend Code */}
          <div className="text-center">
            {canResend ? (
              <Button variant="link" onClick={handleResend} className="text-primary">
                Resend code
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Resend code in {countdown}s
              </p>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-sm text-center text-muted-foreground">
              Didn't receive the code? Check your spam folder or try resending.
            </p>
          </div>
        </div>
      </main>

      <BookingFooter hideNext />
    </div>
  );
}
