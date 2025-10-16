import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { BookingFooter } from '@/components/layout/BookingFooter';
import { useBooking } from '@/context/BookingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Clock, Users, Sparkles, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    selectedLocation,
  } = useBooking();

  const [localDate, setLocalDate] = useState<Date | undefined>(selectedDate);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalDuration = cart.reduce((sum, item) => {
    const serviceDuration = item.service.duration_minutes;
    const addOnsDuration = item.addOns.reduce((addOnSum, addOn) => addOnSum + addOn.duration_minutes, 0);
    return sum + serviceDuration + addOnsDuration;
  }, 0);

  const staffCount = new Set(cart.map(item => item.staffId).filter(Boolean)).size;
  const hasMultipleStaff = staffCount > 1;

  useEffect(() => {
    if (localDate && selectedLocation) {
      loadAvailability();
    }
  }, [localDate, selectedLocation]);

  const loadAvailability = async () => {
    if (!localDate || !selectedLocation) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('check-availability', {
        body: {
          locationId: selectedLocation.id,
          date: format(localDate, 'yyyy-MM-dd'),
          durationMinutes: totalDuration,
        },
      });

      if (error) throw error;
      setAvailableSlots(data.availableSlots || []);
    } catch (err: any) {
      console.error('Error loading availability:', err);
      setError('Failed to load available times');
      toast.error('Could not load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setLocalDate(date);
    setSelectedDate(date);
    setSelectedTime(undefined);
    setAvailableSlots([]);
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
            <CardContent className="space-y-4">
              {loading && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Loading available times...</div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{error}</span>
                    <Button variant="outline" size="sm" onClick={loadAvailability}>
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {!loading && !error && availableSlots.length === 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No available times for this date. Please select another date.
                  </AlertDescription>
                </Alert>
              )}

              {!loading && !error && availableSlots.length > 0 && (
                <>
                  {/* Categorize slots */}
                  {(() => {
                    const morning = availableSlots.filter(s => s.includes('AM') || s === '12:00 PM' || s === '12:30 PM');
                    const afternoon = availableSlots.filter(s => {
                      const time = s.split(' ')[0];
                      const hour = parseInt(time.split(':')[0]);
                      return s.includes('PM') && hour >= 1 && hour <= 3;
                    });
                    const evening = availableSlots.filter(s => {
                      const time = s.split(' ')[0];
                      const hour = parseInt(time.split(':')[0]);
                      return s.includes('PM') && hour >= 4;
                    });

                    return (
                      <div className="space-y-6">
                        {morning.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Morning</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {morning.map((time) => (
                                <button
                                  key={time}
                                  onClick={() => handleTimeSelect(time)}
                                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                    selectedTime === time
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-background hover:bg-accent hover:text-accent-foreground'
                                  }`}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {afternoon.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Afternoon</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {afternoon.map((time) => (
                                <button
                                  key={time}
                                  onClick={() => handleTimeSelect(time)}
                                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                    selectedTime === time
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-background hover:bg-accent hover:text-accent-foreground'
                                  }`}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {evening.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Evening</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {evening.map((time) => (
                                <button
                                  key={time}
                                  onClick={() => handleTimeSelect(time)}
                                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                    selectedTime === time
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-background hover:bg-accent hover:text-accent-foreground'
                                  }`}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <BookingFooter onNext={handleNext} nextLabel="Continue" nextDisabled={isNextDisabled} />
    </div>
  );
}
