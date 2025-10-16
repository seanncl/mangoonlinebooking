import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { BookingFooter } from '@/components/layout/BookingFooter';
import { useBooking } from '@/context/BookingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, Mail, Phone, Shield, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  const hasDepositPolicy = selectedLocation?.has_deposit_policy;
  const balanceDue = cartTotal - depositAmount;

  const handleBookNow = async () => {
    if (!policyAccepted) {
      toast({
        title: 'Policy Not Accepted',
        description: 'Please accept the cancellation policy to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Call edge function to create booking
      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: {
          customer,
          cart,
          selectedLocation,
          selectedDate: selectedDate?.toISOString(),
          selectedTime,
          cartTotal,
          depositAmount,
        },
      });

      if (error) throw error;

      toast({
        title: 'Booking Confirmed!',
        description: `Your confirmation number is ${data.confirmation_number}`,
      });

      navigate('/success', { 
        state: { 
          confirmationNumber: data.confirmation_number,
          bookingId: data.booking_id 
        } 
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

  const isBookingDisabled = !policyAccepted || isProcessing;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingHeader title="Confirm Booking" />

      <main className="flex-1 container max-w-2xl px-4 py-6 pb-24">
        {/* Booking Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Booking Summary</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/services')}>
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{selectedLocation?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedLocation?.address}</p>
              </div>
            </div>

            {/* Date & Time */}
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

            {/* Services */}
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={item.service.id} className="space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.service.duration_minutes} min
                      </p>
                    </div>
                    <p className="font-medium">${item.service.price_card.toFixed(2)}</p>
                  </div>
                  {item.addOns.map((addOn) => (
                    <div key={addOn.id} className="flex justify-between pl-4 text-sm">
                      <p className="text-muted-foreground">+ {addOn.name}</p>
                      <p>${(addOn.price_card - addOn.discount_when_bundled).toFixed(2)}</p>
                    </div>
                  ))}
                  {index < cart.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              {hasDepositPolicy && (
                <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Deposit Due Today ({selectedLocation.deposit_percentage}%)</span>
                    <span>${depositAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Balance Due at Salon</span>
                    <span>${balanceDue.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer?.first_name && customer?.last_name && (
              <div className="flex items-center gap-3">
                <span className="font-medium">{customer.first_name} {customer.last_name}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{customer?.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{customer?.phone}</span>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Policy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Cancellation Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedLocation?.cancellation_policy}
            </p>
            <div className="flex items-start gap-3">
              <Checkbox
                id="policy"
                checked={policyAccepted}
                onCheckedChange={(checked) => setPolicyAccepted(checked as boolean)}
              />
              <label
                htmlFor="policy"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand and accept the cancellation policy
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            {hasDepositPolicy ? (
              <div className="space-y-2">
                <p className="text-sm">
                  A deposit of <span className="font-semibold">${depositAmount.toFixed(2)}</span> will be required to confirm your booking.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please bring your card to check in. The remaining balance of ${balanceDue.toFixed(2)} will be collected at the salon.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Payment of ${cartTotal.toFixed(2)} will be collected at the salon.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Trust Signals */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-6">
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-current" />
            <span>4.9 Rating</span>
          </div>
        </div>
      </main>

      <BookingFooter
        onNext={handleBookNow}
        nextLabel={isProcessing ? 'Processing...' : 'Book Now'}
        nextDisabled={isBookingDisabled}
      />
    </div>
  );
}
