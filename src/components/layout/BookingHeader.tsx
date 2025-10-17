import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '@/context/BookingContext';
import { Button } from '@/components/ui/button';
import { UserProfileButton } from './UserProfileButton';

interface BookingHeaderProps {
  title?: string;
  showClose?: boolean;
  showProfile?: boolean;
  onClose?: () => void;
}

export const BookingHeader = ({ title, showClose = false, showProfile = true, onClose }: BookingHeaderProps) => {
  const navigate = useNavigate();
  const { selectedLocation } = useBooking();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center justify-between px-3">
        {/* Left: Close Button */}
        {showClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
        {!showClose && <div className="w-8" />}

        {/* Center: Logo & Location */}
        <div className="flex items-center">
          {title && (
            <h1 className="text-base font-semibold text-accent">{title}</h1>
          )}
          {!title && selectedLocation && (
            <p className="text-sm text-muted-foreground">{selectedLocation.name}</p>
          )}
          {!title && !selectedLocation && (
            <h1 className="text-base font-semibold text-accent">Mango Nail Spa</h1>
          )}
        </div>

        {/* Right: Profile Button */}
        {showProfile && <UserProfileButton />}
        {!showProfile && <div className="w-8" />}
      </div>
    </header>
  );
};
