import { useNavigate } from 'react-router-dom';
import { useBooking } from '@/context/BookingContext';
import { bookingAPI } from '@/services/booking-api';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { MapPin, Calendar, Clock, CreditCard, Phone, Mail, Shield, Star, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { BookingFooter } from '@/components/layout/BookingFooter';
import { useToast } from '@/hooks/use-toast';
import { PaymentSheet } from '@/components/booking/PaymentSheet';
import { mockStaff } from '@/services/booking-api/mock-data';

export default function Confirmation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    selectedLocation,
    cart,
    selectedDate,
    selectedTime,
    customer,
    cartTotal,
    depositAmount,
  } = useBooking();

  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [paymentAdded, setPaymentAdded] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  const hasDepositPolicy = selectedLocation?.has_deposit_policy || false;
  const balanceDue = cartTotal - depositAmount;

  // Helper to get staff name
  const getStaffName = (staffId?: string) => {
    if (!staffId) return null;
    const staff = mockStaff.find((s) => s.id === staffId);
    return staff ? staff.first_name : null;
  };

  // Validation functions
  const validateCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    if (!cleaned) return 'Card number is required';
    if (cleaned.length !== 16) return 'Card number must be 16 digits';
    if (!/^\d+$/.test(cleaned)) return 'Card number must contain only digits';
    return '';
  };

  const validateExpiryDate = (value: string) => {
    if (!value) return 'Expiry date is required';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 4) return 'Use MMYY format';
    
    const month = parseInt(cleaned.slice(0, 2));
    const year = parseInt(cleaned.slice(2, 4));
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    if (month > 12 || month < 1) return 'Invalid month';
    if (year < currentYear) return 'Card is expired';
    if (year === currentYear && month < currentMonth) return 'Card is expired';
    return '';
  };

  const validateCVV = (value: string) => {
    if (!value) return 'CVV is required';
    if (value.length < 3 || value.length > 4) return 'CVV must be 3 or 4 digits';
    if (!/^\d+$/.test(value)) return 'CVV must contain only digits';
    return '';
  };

  const validateCardholderName = (value: string) => {
    if (!value.trim()) return 'Cardholder name is required';
    if (!/^[a-zA-Z\s]+$/.test(value)) return 'Name must contain only letters';
    return '';
  };

  const validatePaymentForm = () => {
    if (!hasDepositPolicy) return true;

    const errors: Record<string, string> = {
      cardNumber: validateCardNumber(paymentDetails.cardNumber),
      expiryDate: validateExpiryDate(paymentDetails.expiryDate),
      cvv: validateCVV(paymentDetails.cvv),
      cardholderName: validateCardholderName(paymentDetails.cardholderName),
    };

    setPaymentErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  const handlePaymentSheetConfirm = () => {
    if (!validatePaymentForm()) {
      return;
    }
    setPaymentAdded(true);
    setPaymentSheetOpen(false);
    toast({
      title: 'Payment Method Added',
      description: 'Your card has been securely saved.',
    });
  };

  // Main booking handler
  const handleBookNow = async () => {
    // 1. Check policy acceptance FIRST
    if (!policyAccepted) {
      toast({
        title: 'Policy Not Accepted',
        description: 'Please accept the cancellation policy to continue.',
        variant: 'destructive',
      });
      return;
    }

    // 2. Check payment is added if deposit required
    if (hasDepositPolicy && !paymentAdded) {
      toast({
        title: 'Payment Required',
        description: 'Please add a payment card for the deposit.',
        variant: 'destructive',
      });
      setPaymentSheetOpen(true);
      return;
    }

    // 3. Validate payment form
    if (hasDepositPolicy && !validatePaymentForm()) {
      toast({
        title: 'Invalid Payment Details',
        description: 'Please check your payment information.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    // Mock payment processing delay (2 seconds)
    if (hasDepositPolicy) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    try {
      // [API INTEGRATION POINT]
      // Create booking via API
      const response = await bookingAPI.createBooking({
        customer: customer!,
        cart,
        selectedLocation: selectedLocation!,
        selectedDate: selectedDate!,
        selectedTime: selectedTime!,
        cartTotal,
        depositAmount,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create booking');
      }

      toast({
        title: 'Booking Confirmed!',
        description: `Your confirmation number is ${response.data.confirmation_number}`,
      });

      navigate('/success', {
        state: {
          confirmationNumber: response.data.confirmation_number,
          bookingId: response.data.booking_id,
        },
      });
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: 'Booking Failed',
        description: error.message || 'Unable to create booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingHeader title="Confirm Booking" />

      <main className="flex-1 container max-w-2xl px-4 py-6 pb-24">
        {/* Booking Summary */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Booking Summary</h2>
          <Button variant="ghost" size="icon" onClick={() => navigate('/services')}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{selectedLocation?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedLocation?.address}</p>
              </div>
            </div>

            <Separator />

            {/* Date & Time */}
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Date & Time</span>
              <Button variant="ghost" size="icon" onClick={() => navigate('/time')}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <p className="font-medium">
                {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <p className="font-medium">{selectedTime}</p>
            </div>

            <Separator />

            {/* Services with Staff */}
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between py-2">
                <div>
                  <p className="font-medium">{item.service.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.service.duration_minutes} min
                    {item.staffId && ` • with ${getStaffName(item.staffId)}`}
                  </p>
                  {item.addOns.length > 0 && (
                    <ul className="text-xs text-muted-foreground mt-1 ml-4">
                      {item.addOns.map((addOn) => (
                        <li key={addOn.id}>+ {addOn.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <p className="font-medium">${item.service.price_card.toFixed(2)}</p>
              </div>
            ))}

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Contact Information</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => navigate('/client-info')}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Phone</span>
              </div>
              <span className="text-sm text-muted-foreground">{customer?.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email</span>
              </div>
              <span className="text-sm text-muted-foreground">{customer?.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Confirmation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email confirmation</span>
              </div>
              <span className="text-sm text-muted-foreground">{customer?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">SMS reminders</span>
              </div>
              <span className="text-sm text-muted-foreground">{customer?.phone}</span>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Policy - MOVED BEFORE PAYMENT */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Cancellation Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedLocation?.cancellation_policy}
            </p>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="policy"
                checked={policyAccepted}
                onCheckedChange={(checked) => setPolicyAccepted(checked as boolean)}
              />
              <Label
                htmlFor="policy"
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                I understand and accept the cancellation policy
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Due Now Section */}
        {hasDepositPolicy && (
          <Card className="mb-6 border-2 border-primary">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground uppercase tracking-wide">
                  Due Now
                </p>
                <p className="text-4xl font-bold text-primary">
                  ${depositAmount.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedLocation?.deposit_percentage}% deposit required to confirm
                </p>
                <Separator className="my-4" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total at salon</span>
                  <span className="font-medium">${balanceDue.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Button/Card */}
        {hasDepositPolicy && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Payment Method</CardTitle>
              <CardDescription>
                Add a payment method to secure your booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!paymentAdded ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setPaymentSheetOpen(true)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Add Payment Card
                </Button>
              ) : (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">•••• {paymentDetails.cardNumber.slice(-4)}</p>
                      <p className="text-xs text-muted-foreground">{paymentDetails.cardholderName}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPaymentSheetOpen(true)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Trust & Security */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Secure Payment</p>
              <p className="text-xs text-muted-foreground">Your information is encrypted</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-sm font-semibold">4.9</span>
          </div>
        </div>
      </main>

      <BookingFooter
        onBack={() => navigate(-1)}
        onNext={handleBookNow}
        nextLabel={hasDepositPolicy ? `Confirm & Pay $${depositAmount.toFixed(2)}` : 'Confirm Booking'}
        nextDisabled={!policyAccepted || isProcessing}
      />

      {/* Payment Sheet */}
      <PaymentSheet
        open={paymentSheetOpen}
        onOpenChange={setPaymentSheetOpen}
        depositAmount={depositAmount}
        paymentDetails={paymentDetails}
        paymentErrors={paymentErrors}
        saveCard={saveCard}
        onPaymentDetailsChange={setPaymentDetails}
        onPaymentErrorsChange={setPaymentErrors}
        onSaveCardChange={setSaveCard}
        onConfirm={handlePaymentSheetConfirm}
      />
    </div>
  );
}
