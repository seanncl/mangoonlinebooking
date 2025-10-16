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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Users, Sparkles, AlertCircle, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { bookingAPI } from '@/services/booking-api';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableServiceItemProps {
  serviceId: string;
  index: number;
  service: {
    name: string;
    duration: number;
  };
  staffId?: string;
}

function SortableServiceItem({ serviceId, index, service, staffId }: SortableServiceItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: serviceId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-move hover:bg-muted/80 transition-colors"
      {...attributes}
      {...listeners}
    >
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
    </div>
  );
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
    setServiceOrder,
  } = useBooking();

  const [localDate, setLocalDate] = useState<Date | undefined>(selectedDate);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bestFitSlots, setBestFitSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const totalDuration = cart.reduce((sum, item) => {
    const serviceDuration = item.service.duration_minutes;
    const addOnsDuration = item.addOns.reduce((addOnSum, addOn) => addOnSum + addOn.duration_minutes, 0);
    return sum + serviceDuration + addOnsDuration;
  }, 0);

  const staffCount = new Set(cart.map(item => item.staffId).filter(Boolean)).size;
  const hasMultipleStaff = staffCount > 1;

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = serviceOrder.indexOf(active.id as string);
      const newIndex = serviceOrder.indexOf(over.id as string);
      const newOrder = arrayMove(serviceOrder, oldIndex, newIndex);
      setServiceOrder(newOrder);
    }
  };

  const loadAvailability = async (date: Date) => {
    if (!selectedLocation) return;
    
    setLoadingSlots(true);
    setSlotsError(null);
    
    try {
      const staffIds = cart
        .map(item => item.staffId)
        .filter(Boolean) as string[];
      
      const response = await bookingAPI.checkAvailability({
        locationId: selectedLocation.id,
        date: date.toISOString().split('T')[0],
        staffIds,
        totalDuration,
        startAllSameTime,
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to check availability');
      }
      
      setAvailableSlots(response.data.availableSlots || []);
      setBestFitSlots(response.data.bestFitSlots || []);
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

        {/* Service Order (for sequential bookings when NOT starting same time) */}
        {hasMultipleStaff && !startAllSameTime && cart.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Service Order</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Drag to reorder how services will be performed
              </p>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={serviceOrder}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {serviceOrder.map((serviceId, index) => {
                      const cartItem = cart.find(item => item.service.id === serviceId);
                      if (!cartItem) return null;
                      
                      const totalDuration = cartItem.service.duration_minutes +
                        cartItem.addOns.reduce((sum, addOn) => sum + addOn.duration_minutes, 0);

                      return (
                        <SortableServiceItem
                          key={serviceId}
                          serviceId={serviceId}
                          index={index}
                          service={{
                            name: cartItem.service.name,
                            duration: totalDuration,
                          }}
                          staffId={cartItem.staffId}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 mt-4 border-t">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Services will be performed in this order, one after another</span>
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
              {loadingSlots ? (
                <div className="space-y-4">
                  <div>
                    <Skeleton className="h-4 w-20 mb-3" />
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  </div>
                </div>
              ) : slotsError ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{slotsError}</span>
                    <Button variant="outline" size="sm" onClick={() => localDate && loadAvailability(localDate)}>
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : availableSlots.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No available times for this date. Please try a different date or contact the salon.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Group slots by time of day */}
                  {(() => {
                    const morningSlots = availableSlots.filter(slot => {
                      const hour = parseInt(slot.split(':')[0]);
                      const isPM = slot.includes('PM');
                      return !isPM || hour === 12;
                    });
                    const afternoonSlots = availableSlots.filter(slot => {
                      const hour = parseInt(slot.split(':')[0]);
                      const isPM = slot.includes('PM');
                      return isPM && hour !== 12 && hour < 4;
                    });
                    const eveningSlots = availableSlots.filter(slot => {
                      const hour = parseInt(slot.split(':')[0]);
                      const isPM = slot.includes('PM');
                      return isPM && hour >= 4;
                    });

                    return (
                      <>
                        {morningSlots.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Morning</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {morningSlots.map((time) => {
                                const isBestFit = bestFitSlots.includes(time);
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
                        )}

                        {afternoonSlots.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Afternoon</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {afternoonSlots.map((time) => {
                                const isBestFit = bestFitSlots.includes(time);
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
                        )}

                        {eveningSlots.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Evening</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {eveningSlots.map((time) => {
                                const isBestFit = bestFitSlots.includes(time);
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
                        )}
                      </>
                    );
                  })()}

                  {bestFitSlots.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>Best fit times based on your services</span>
                    </div>
                  )}
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
