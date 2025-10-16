import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfToday, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface HorizontalDatePickerProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  unavailableDates?: Date[];
}

export function HorizontalDatePicker({
  selectedDate,
  onDateSelect,
  unavailableDates = [],
}: HorizontalDatePickerProps) {
  const [startDate, setStartDate] = useState(startOfToday());

  // Generate 5 days starting from startDate
  const visibleDates = Array.from({ length: 5 }, (_, i) => addDays(startDate, i));

  const handlePrevious = () => {
    const newStartDate = addDays(startDate, -5);
    // Don't go before today
    if (newStartDate >= startOfToday()) {
      setStartDate(newStartDate);
    }
  };

  const handleNext = () => {
    setStartDate(addDays(startDate, 5));
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
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Date Cards */}
      <div className="grid grid-cols-5 gap-2">
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
