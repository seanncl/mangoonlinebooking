import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { BookingFooter } from '@/components/layout/BookingFooter';
import { useBooking } from '@/context/BookingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Clock, Users, Sparkles, AlertCircle, GripVertical, Info, Phone, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, startOfToday } from 'date-fns';
import { bookingAPI } from '@/services/booking-api';
import { Button } from '@/components/ui/button';
import { HorizontalDatePicker } from '@/components/booking/HorizontalDatePicker';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
interface SortableServiceItemProps {
  serviceId: string;
  index: number;
  service: {
    name: string;
    duration: number;
  };
  staffId?: string;
}
function SortableServiceItem({
  serviceId,
  index,
  service,
  staffId
}: SortableServiceItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: serviceId
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-move hover:bg-muted/80 transition-colors" {...attributes} {...listeners}>
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{service.name}</p>
        <p className="text-sm text-muted-foreground">
          {service.duration} min
          {staffId && ' • Staff assigned'}
        </p>
      </div>
      <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </div>;
}
export default function TimeSelection() {
  const navigate = useNavigate();
  const {
    selectedLocation,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    cart,
    startAllSameTime,
    setStartAllSameTime,
    serviceOrder,
    setServiceOrder
  } = useBooking();
  const [localDate, setLocalDate] = useState<Date | undefined>(selectedDate);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bestFitSlots, setBestFitSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [loadingUnavailableDates, setLoadingUnavailableDates] = useState(true);

  const totalDuration = cart.reduce((sum, item) => {
    const serviceDuration = item.service.duration_minutes;
    const addOnsDuration = item.addOns.reduce((addOnSum, addOn) => addOnSum + addOn.duration_minutes, 0);
    return sum + serviceDuration + addOnsDuration;
  }, 0);
  const staffCount = new Set(cart.map(item => item.staffId).filter(Boolean)).size;
  const hasMultipleStaff = staffCount > 1;

  // Pre-load unavailable dates for next 30 days on mount
  useEffect(() => {
    const preloadUnavailableDates = async () => {
      if (!selectedLocation) return;
      
      setLoadingUnavailableDates(true);
      const dates: Date[] = [];
      const today = startOfToday();
      
      // Check next 30 days
      for (let i = 0; i < 30; i++) {
        const checkDate = addDays(today, i);
        try {
          const response = await bookingAPI.checkAvailability({
            locationId: selectedLocation.id,
            date: checkDate.toISOString().split('T')[0],
            staffIds: [],
            totalDuration,
            startAllSameTime
          });
          
          if (response.success && response.data?.availableSlots.length === 0) {
            dates.push(checkDate);
          }
        } catch (error) {
          console.error('Error checking date:', checkDate, error);
        }
      }
      
      setUnavailableDates(dates);
      setLoadingUnavailableDates(false);
    };

    preloadUnavailableDates();
  }, [selectedLocation, totalDuration, startAllSameTime]);

  // Drag-and-drop sensors
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  const handleDragEnd = (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    if (over && active.id !== over.id) {
      const oldIndex = serviceOrder.indexOf(active.id as string);
      const newIndex = serviceOrder.indexOf(over.id as string);
      const newOrder = arrayMove(serviceOrder, oldIndex, newIndex);
      setServiceOrder(newOrder);
    }
  };

  // Generate all possible time slots (9 AM - 7 PM in 30-minute intervals)
  const generateAllTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 19; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 19 && minute > 0) break; // Stop at 7:00 PM
        const isPM = hour >= 12;
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const time = `${displayHour}:${minute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
        slots.push(time);
      }
    }
    return slots;
  };
  const allTimeSlots = generateAllTimeSlots();
  const loadAvailability = async (date: Date) => {
    if (!selectedLocation) return;
    setLoadingSlots(true);
    setSlotsError(null);
    try {
      const staffIds = cart.map(item => item.staffId).filter(Boolean) as string[];
      const response = await bookingAPI.checkAvailability({
        locationId: selectedLocation.id,
        date: date.toISOString().split('T')[0],
        staffIds,
        totalDuration,
        startAllSameTime
      });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to check availability');
      }
      const availableTimes = response.data.availableSlots || [];
      setAvailableSlots(availableTimes);
      setBestFitSlots(response.data.bestFitSlots || []);

      // Mark date as unavailable if no slots
      if (availableTimes.length === 0) {
        setUnavailableDates(prev => {
          const exists = prev.some(d => d.toDateString() === date.toDateString());
          if (!exists) {
            return [...prev, date];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      setSlotsError('Unable to load available times. Please try again.');
      setAvailableSlots([]);
      setBestFitSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };
  const handleDateSelect = (date: Date | undefined) => {
    setLocalDate(date);
    setSelectedDate(date);
    setSelectedTime(undefined);
    if (date) {
      loadAvailability(date);
    } else {
      setAvailableSlots([]);
      setBestFitSlots([]);
    }
  };
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };
  const handleNext = () => {
    navigate('/info');
  };
  const isNextDisabled = !selectedDate || !selectedTime;
  return <div className="min-h-screen flex flex-col bg-background">
      <BookingHeader title="Select Date & Time" />

      <main className="flex-1 container px-4 py-6 pb-24 max-w-4xl">
        {/* Compact Booking Summary */}
        <div className="flex flex-wrap items-center gap-3 p-3 mb-4 bg-muted/50 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{totalDuration} min</span>
          </div>
          {hasMultipleStaff && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{staffCount} staff</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {cart.length} {cart.length === 1 ? 'service' : 'services'}
            </Badge>
          </div>
        </div>

        {/* Start Same Time Toggle (for multiple staff) */}
        {hasMultipleStaff && <Card className="mb-6">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="space-y-0.5">
                    <Label htmlFor="same-time" className="text-sm font-medium cursor-pointer">
                      All services begin simultaneously
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Multiple staff work on your services at once
                    </p>
                  </div>
                </div>
                <Switch id="same-time" checked={startAllSameTime} onCheckedChange={setStartAllSameTime} />
              </div>
            </CardContent>
          </Card>}

        {/* Service Order (for sequential bookings when NOT starting same time) */}
        {hasMultipleStaff && !startAllSameTime && cart.length > 1 && <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Service Order</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Drag to reorder how services will be performed
              </p>
            </CardHeader>
            <CardContent>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={serviceOrder} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {serviceOrder.map((serviceId, index) => {
                  const cartItem = cart.find(item => item.service.id === serviceId);
                  if (!cartItem) return null;
                  const totalDuration = cartItem.service.duration_minutes + cartItem.addOns.reduce((sum, addOn) => sum + addOn.duration_minutes, 0);
                  return <SortableServiceItem key={serviceId} serviceId={serviceId} index={index} service={{
                    name: cartItem.service.name,
                    duration: totalDuration
                  }} staffId={cartItem.staffId} />;
                })}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 mt-4 border-t">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Services will be performed in this order, one after another</span>
              </div>
            </CardContent>
          </Card>}

        {/* Horizontal Date Picker */}
        <div className="mb-6">
          <HorizontalDatePicker selectedDate={localDate} onDateSelect={handleDateSelect} unavailableDates={unavailableDates} />
        </div>

        {/* Empty State - No Date Selected */}
        {!localDate && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CalendarIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Select a Date</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Choose a date above to see available appointment times
            </p>
          </div>
        )}

        {/* Time Slots */}
        {localDate && <div className="space-y-6">
            <h2 className="text-xl font-semibold">
              {format(localDate, 'EEEE, MMMM d')}
            </h2>
            {loadingSlots ? <div className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-20 mb-3" />
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                    {Array.from({
                length: 12
              }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                </div>
              </div> : slotsError ? <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{slotsError}</span>
                  <Button variant="outline" size="sm" onClick={() => localDate && loadAvailability(localDate)}>
                    Retry
                  </Button>
                </AlertDescription>
              </Alert> : <>
                {/* Show ALL time slots with availability status */}
                {(() => {
            // Categorize ALL slots (not just available ones)
            const morningSlots = allTimeSlots.filter(slot => {
              const hour = parseInt(slot.split(':')[0]);
              const isPM = slot.includes('PM');
              return !isPM || hour === 12;
            });
            const afternoonSlots = allTimeSlots.filter(slot => {
              const hour = parseInt(slot.split(':')[0]);
              const isPM = slot.includes('PM');
              return isPM && hour !== 12 && hour < 4;
            });
            const eveningSlots = allTimeSlots.filter(slot => {
              const hour = parseInt(slot.split(':')[0]);
              const isPM = slot.includes('PM');
              return isPM && hour >= 4;
            });
            const renderTimeSlot = (time: string) => {
              const isAvailable = availableSlots.includes(time);
              const isBestFit = bestFitSlots.includes(time);
              const isSelected = selectedTime === time;
              return <button key={time} onClick={() => isAvailable && handleTimeSelect(time)} disabled={!isAvailable} className={cn(
                "relative px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all touch-manipulation min-h-[48px]",
                isSelected 
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-[1.02]' 
                  : isAvailable 
                  ? 'bg-background hover:bg-accent hover:border-primary/30 hover:shadow-md border-border' 
                  : 'bg-muted/20 border-muted/50 text-muted-foreground cursor-not-allowed opacity-40'
              )}>
                        {time}
                        {isBestFit && isAvailable && <HoverCard>
                            <HoverCardTrigger asChild>
                              <Badge variant={isSelected ? "secondary" : "default"} className="absolute -top-2 -right-2 text-[9px] px-1 py-0 h-4 bg-primary text-primary-foreground cursor-help">
                                ✨ Best
                              </Badge>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              <div className="flex gap-3">
                                <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium mb-1">About Best Fit Times</p>
                                  <p className="text-xs text-muted-foreground">
                                    Best Fit times help optimize salon scheduling and availability
                                  </p>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>}
                      </button>;
            };
            return <div className="space-y-5">
                      {morningSlots.length > 0 && <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">🟡</span>
                            <h3 className="text-sm font-semibold">Morning (9 AM - 12 PM)</h3>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {morningSlots.filter(t => availableSlots.includes(t)).length} available
                            </span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                            {morningSlots.map(renderTimeSlot)}
                          </div>
                        </div>}

                      {afternoonSlots.length > 0 && <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">🔵</span>
                            <h3 className="text-sm font-semibold">Afternoon (12 PM - 4 PM)</h3>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {afternoonSlots.filter(t => availableSlots.includes(t)).length} available
                            </span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                            {afternoonSlots.map(renderTimeSlot)}
                          </div>
                        </div>}

                      {eveningSlots.length > 0 && <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">🟣</span>
                            <h3 className="text-sm font-semibold">Evening (4 PM - 7 PM)</h3>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {eveningSlots.filter(t => availableSlots.includes(t)).length} available
                            </span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                            {eveningSlots.map(renderTimeSlot)}
                          </div>
                        </div>}
                    </div>;
          })()}

                {/* Footer Info */}
                <div className="mt-8">
                  <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                    <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">Need Different Times?</p>
                      <p className="text-xs text-muted-foreground">
                        Don't see your preferred time? Call us at{' '}
                        <a href="tel:5551234567" className="text-primary hover:underline font-medium">
                          (555) 123-4567
                        </a>
                        {' '}for more options
                      </p>
                    </div>
                  </div>
                </div>
              </>}
          </div>}
      </main>

      <BookingFooter onNext={handleNext} nextLabel="Continue" nextDisabled={isNextDisabled} />
    </div>;
}