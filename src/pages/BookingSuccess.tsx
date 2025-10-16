import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Calendar, MapPin, Clock, Mail, Phone, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBooking } from '@/context/BookingContext';
import { format } from 'date-fns';

export default function BookingSuccess() {
  const navigate = useNavigate();
  const {
    selectedLocation,
    cart,
    selectedDate,
    selectedTime,
    customer,
    cartTotal,
    depositAmount,
    resetBooking,
  } = useBooking();

  useEffect(() => {
    if (!selectedLocation || cart.length === 0 || !customer) {
      navigate('/');
      return;
    }
  }, [selectedLocation, cart, customer, navigate]);

  const confirmationNumber = `MNG${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const totalDuration = cart.reduce((sum, item) => sum + item.service.duration_minutes, 0);

  const handleNewBooking = () => {
    resetBooking();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-success-light to-background">
      {/* Animated Success Header */}
      <div className="text-center pt-12 pb-8 px-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success mb-6 animate-bounce">
          <Check className="h-12 w-12 text-success-foreground" />
        </div>
        <div className="text-4xl mb-4">🎉 ✨ 💅 ✨ 🎉</div>
        <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
        <p className="text-lg text-muted-foreground">Your appointment is all set</p>
      </div>

      <main className="container max-w-2xl mx-auto px-4 pb-12">
        {/* Confirmation Number */}
        <Card className="p-6 mb-6 text-center border-2 border-success">
          <p className="text-sm text-muted-foreground mb-2">Confirmation Number</p>
          <Badge variant="secondary" className="text-xl font-bold px-4 py-2">
            {confirmationNumber}
          </Badge>
        </Card>

        {/* Email Confirmation Banner */}
        <Card className="p-4 mb-6 bg-primary-light border-primary">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Confirmation sent to</p>
              <p className="text-sm text-muted-foreground">{customer?.email}</p>
            </div>
          </div>
        </Card>

        {/* Appointment Details */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Appointment Details</h2>

          {/* Services */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-sm text-muted-foreground">SERVICES</h3>
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{item.service.name}</p>
                  {item.staffId && (
                    <p className="text-sm text-muted-foreground">with Staff Member</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {item.service.duration_minutes} min
                  </p>
                </div>
                <p className="font-semibold">${item.service.price_card.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">
                  {selectedDate ? format(selectedDate, 'EEEE, MMM d, yyyy') : 'Not set'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold">{selectedTime || 'Not set'}</p>
                <p className="text-sm text-muted-foreground">{totalDuration} min total</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-semibold">{selectedLocation?.name}</p>
              <Button variant="link" className="h-auto p-0 text-primary">
                Get directions
              </Button>
            </div>
          </div>
        </Card>

        {/* Payment Summary */}
        {selectedLocation?.has_deposit_policy && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Payment Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-success">
                <span>Deposit Paid ({selectedLocation.deposit_percentage}%):</span>
                <span>-${depositAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Pay at Salon:</span>
                <span>${(cartTotal - depositAmount).toFixed(2)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Add to Calendar
          </Button>
          <Button variant="outline" className="gap-2">
            <Phone className="h-4 w-4" />
            Share Details
          </Button>
        </div>

        {/* Before Your Appointment */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-3">Before Your Appointment</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Arrive 5-10 minutes early to check in</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Bring your confirmation number</span>
            </li>
            <li className="flex items-start gap-2">
              <span>✓</span>
              <span>Cancel 24+ hours before for full refund</span>
            </li>
          </ul>
        </Card>

        {/* Manage Booking */}
        <div className="space-y-3">
          <Button variant="outline" className="w-full gap-2">
            Reschedule Appointment
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full gap-2">
            View My Bookings
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={handleNewBooking} className="w-full bg-primary hover:bg-primary-hover">
            Book Another Appointment
          </Button>
        </div>
      </main>
    </div>
  );
}
