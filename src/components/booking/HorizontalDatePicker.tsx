import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, startOfToday, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

  // Generate 7 days starting from startDate (increased from 5 for more visibility)
  const visibleDates = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const handlePrevious = () => {
    const newStartDate = addDays(startDate, -7);
    // Don't go before today
    if (newStartDate >= startOfToday()) {
      setStartDate(newStartDate);
    }
  };

  const handleNext = () => {
    setStartDate(addDays(startDate, 7));
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
      <div className="grid grid-cols-7 gap-2">
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
                "relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                "hover:border-primary/50",
                isSelected
                  ? "bg-primary border-primary text-primary-foreground shadow-lg"
                  : unavailable
                  ? "bg-muted/50 border-muted text-muted-foreground cursor-not-allowed opacity-50"
                  : "bg-background border-border"
              )}
            >
              <span className="text-xs font-medium mb-1">
                {format(date, 'EEE')}
              </span>
              <span className={cn(
                "text-xl font-bold",
                isSelected && "text-primary-foreground"
              )}>
                {format(date, 'd')}
              </span>
              {isTodayDate && !isSelected && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">
                  Today
                </span>
              )}
              {unavailable && (
                <span className="text-[10px] text-muted-foreground mt-1">
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
