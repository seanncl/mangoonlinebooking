import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { BookingFooter } from '@/components/layout/BookingFooter';
import { useBooking } from '@/context/BookingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Clock, Users, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const TIME_SLOTS = {
  morning: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
  afternoon: ['12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM'],
  evening: ['4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM'],
};

const BEST_FIT_TIMES = ['10:00 AM', '2:00 PM', '4:00 PM'];

export default function TimeSelection() {
  const navigate = useNavigate();
  const {
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    cart,
    startAllSameTime,
    setStartAllSameTime,
  } = useBooking();

  const [localDate, setLocalDate] = useState<Date | undefined>(selectedDate);

  const totalDuration = cart.reduce((sum, item) => {
    const serviceDuration = item.service.duration_minutes;
    const addOnsDuration = item.addOns.reduce((addOnSum, addOn) => addOnSum + addOn.duration_minutes, 0);
    return sum + serviceDuration + addOnsDuration;
  }, 0);

  const staffCount = new Set(cart.map(item => item.staffId).filter(Boolean)).size;
  const hasMultipleStaff = staffCount > 1;

  const handleDateSelect = (date: Date | undefined) => {
    setLocalDate(date);
    setSelectedDate(date);
    setSelectedTime(undefined);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleNext = () => {
    navigate('/info');
  };

  const isNextDisabled = !selectedDate || !selectedTime;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingHeader title="Select Date & Time" />

      <main className="flex-1 container px-4 py-6 pb-24">
        {/* Booking Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{totalDuration} minutes total</span>
            </div>
            {hasMultipleStaff && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{staffCount} staff members</span>
              </div>
            )}
            {cart.length > 0 && (
              <div className="space-y-1">
                {cart.map((item) => (
                  <div key={item.service.id} className="text-sm">
                    {item.service.name}
                    {item.addOns.length > 0 && (
                      <span className="text-muted-foreground">
                        {' '}+ {item.addOns.length} add-on{item.addOns.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Start Same Time Toggle (for multiple staff) */}
        {hasMultipleStaff && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="same-time" className="text-base">
                    Start All Services Same Time
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Multiple staff work on your services simultaneously
                  </p>
                </div>
                <Switch
                  id="same-time"
                  checked={startAllSameTime}
                  onCheckedChange={setStartAllSameTime}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Calendar
              mode="single"
              selected={localDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Time Slots */}
        {localDate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Available Times - {format(localDate, 'EEEE, MMMM d')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Morning */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Morning</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {TIME_SLOTS.morning.map((time) => {
                    const isBestFit = BEST_FIT_TIMES.includes(time);
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className={`relative px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        {time}
                        {isBestFit && !isSelected && (
                          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Afternoon */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Afternoon</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {TIME_SLOTS.afternoon.map((time) => {
                    const isBestFit = BEST_FIT_TIMES.includes(time);
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className={`relative px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        {time}
                        {isBestFit && !isSelected && (
                          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Evening */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Evening</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {TIME_SLOTS.evening.map((time) => {
                    const isBestFit = BEST_FIT_TIMES.includes(time);
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className={`relative px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        {time}
                        {isBestFit && !isSelected && (
                          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {BEST_FIT_TIMES.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Best fit times based on your services</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <BookingFooter onNext={handleNext} nextLabel="Continue" nextDisabled={isNextDisabled} />
    </div>
  );
}
