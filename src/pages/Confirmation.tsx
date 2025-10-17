import { useNavigate } from 'react-router-dom';
import { useBooking } from '@/context/BookingContext';
import { bookingAPI } from '@/services/booking-api';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { MapPin, Calendar, Clock, CreditCard, Phone, Mail, Shield, Star, Pencil, ChevronDown, FileText, Wallet } from 'lucide-react';
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
  const [showFullPolicy, setShowFullPolicy] = useState(false);

  const hasDepositPolicy = selectedLocation?.has_deposit_policy || false;
  const balanceDue = cartTotal - depositAmount;

  // Calculate total duration
  const totalDuration = cart.reduce((sum, item) => sum + item.service.duration_minutes, 0);

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
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Booking Summary</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigate('/services')}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Services Section */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                SERVICES
              </p>
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">{item.service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.staffId ? `with ${getStaffName(item.staffId)} • ` : ''}{item.service.duration_minutes} min
                    </p>
                  </div>
                  <p className="font-semibold">${item.service.price_card.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Date */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {selectedDate && format(selectedDate, 'EEEE, MMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{selectedTime}</p>
                <p className="text-sm text-muted-foreground">{totalDuration} min total</p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{selectedLocation?.name}</p>
                <button className="text-sm text-primary hover:underline">
                  Get directions
                </button>
              </div>
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${cartTotal.toFixed(2)}</span>
              </div>
              {hasDepositPolicy && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Deposit ({selectedLocation?.deposit_percentage}%)
                    </span>
                    <span className="font-medium">${depositAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining (pay at salon)</span>
                    <span className="font-medium">${balanceDue.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Due Now</span>
                    <span className="text-2xl font-bold text-primary">
                      ${depositAmount.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>


        {/* Cancellation Policy */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Cancellation Policy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {showFullPolicy
                ? selectedLocation?.cancellation_policy
                : selectedLocation?.cancellation_policy?.slice(0, 100) + '...'}
            </p>
            <button
              onClick={() => setShowFullPolicy(!showFullPolicy)}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {showFullPolicy ? 'Show less' : 'Read complete policy'}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFullPolicy ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="policy"
                checked={policyAccepted}
                onCheckedChange={(checked) => setPolicyAccepted(checked as boolean)}
              />
              <Label
                htmlFor="policy"
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                I understand and agree to the cancellation policy
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        {hasDepositPolicy && (
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Payment Method</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!paymentAdded ? (
                <>
                  <Button
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                    onClick={() => setPaymentSheetOpen(true)}
                  >
                    + Add Payment Card
                  </Button>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saveCard"
                      checked={saveCard}
                      onCheckedChange={(checked) => setSaveCard(checked as boolean)}
                    />
                    <Label
                      htmlFor="saveCard"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Save card for future bookings
                    </Label>
                  </div>
                </>
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

        {/* Confirmation Details */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Confirmation Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email confirmation:</span>
              <span className="font-medium">{customer?.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">SMS reminders:</span>
              <span className="font-medium">{customer?.phone}</span>
            </div>
          </CardContent>
        </Card>
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
