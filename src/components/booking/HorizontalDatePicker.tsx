import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, startOfToday, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';

interface HorizontalDatePickerProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  unavailableDates?: Date[];
  onCheckAvailability?: (date: Date) => Promise<boolean>;
}

export function HorizontalDatePicker({
  selectedDate,
  onDateSelect,
  unavailableDates = [],
  onCheckAvailability,
}: HorizontalDatePickerProps) {
  const [startDate, setStartDate] = useState(startOfToday());
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const isMobile = useIsMobile();

  // Responsive: 5 days on mobile, 7 on desktop
  const daysToShow = isMobile ? 5 : 7;
  const visibleDates = Array.from({ length: daysToShow }, (_, i) => addDays(startDate, i));

  const handlePrevious = () => {
    const newStartDate = addDays(startDate, -daysToShow);
    // Don't go before today
    if (newStartDate >= startOfToday()) {
      setStartDate(newStartDate);
    }
  };

  const handleNext = () => {
    setStartDate(addDays(startDate, daysToShow));
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date);
      setShowFullCalendar(false);
    }
  };

  const isDateUnavailable = (date: Date) => {
    return unavailableDates.some(unavailableDate => 
      isSameDay(unavailableDate, date)
    );
  };

  const canGoPrevious = startDate > startOfToday();

  return (
    <div className="space-y-4">
      {/* Month/Year Header with Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(startDate, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <Popover open={showFullCalendar} onOpenChange={setShowFullCalendar}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleCalendarSelect}
                disabled={(date) => {
                  if (date < startOfToday()) return true;
                  return isDateUnavailable(date);
                }}
                className="rounded-md border pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className="h-10 w-10 touch-manipulation"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="h-10 w-10 touch-manipulation"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Date Cards */}
      <div className={cn(
        "grid gap-2",
        isMobile ? "grid-cols-5" : "grid-cols-7"
      )}>
        {visibleDates.map((date) => {
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isTodayDate = isToday(date);
          const unavailable = isDateUnavailable(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => !unavailable && onDateSelect(date)}
              disabled={unavailable}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border-2 transition-all touch-manipulation",
                "min-h-[80px] sm:min-h-[88px]", // Better touch targets
                isSelected
                  ? "bg-primary border-primary text-primary-foreground shadow-lg scale-[1.02]"
                  : unavailable
                  ? "bg-muted/30 border-muted/50 cursor-not-allowed"
                  : "bg-background border-border hover:border-primary/30 hover:shadow-md"
              )}
            >
              {/* Day of week */}
              <span className={cn(
                "text-xs font-medium mb-1",
                isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
              )}>
                {format(date, 'EEE')}
              </span>
              
              {/* Date number */}
              <span className={cn(
                "text-2xl font-bold leading-none mb-1",
                isSelected && "text-primary-foreground",
                unavailable && "text-muted-foreground/60"
              )}>
                {format(date, 'd')}
              </span>

              {/* Today badge - show even when selected */}
              {isTodayDate && (
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full font-semibold",
                  isSelected 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : "bg-primary/10 text-primary"
                )}>
                  Today
                </span>
              )}

              {/* Unavailable indicator */}
              {unavailable && (
                <span className="text-[9px] text-destructive font-medium mt-0.5">
                  Unavailable
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
