import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface BookingFooterProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hideBack?: boolean;
  hideNext?: boolean;
}

export const BookingFooter = ({
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  hideBack = false,
  hideNext = false,
}: BookingFooterProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <footer className="sticky bottom-0 z-50 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between px-4">
        {/* Left: Back Button */}
        {!hideBack ? (
          <Button
            variant="outline"
            onClick={handleBack}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {/* Right: Next/Primary Action Button */}
        {!hideNext && onNext && (
          <Button
            onClick={onNext}
            disabled={nextDisabled}
            size="lg"
            className="min-w-[120px] bg-primary hover:bg-primary-hover"
          >
            {nextLabel}
          </Button>
        )}
      </div>
    </footer>
  );
};
