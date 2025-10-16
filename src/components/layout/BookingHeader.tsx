import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '@/context/BookingContext';
import { Button } from '@/components/ui/button';
import { CartSheet } from '@/components/cart/CartSheet';

interface BookingHeaderProps {
  title?: string;
  showClose?: boolean;
  showCart?: boolean;
  onClose?: () => void;
}

export const BookingHeader = ({ title, showClose = true, showCart = true, onClose }: BookingHeaderProps) => {
  const navigate = useNavigate();
  const { selectedLocation } = useBooking();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  const locationName = selectedLocation?.name?.replace('Mango Nail Spa - ', '') || 'Mango Nail Spa';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left: Close Button */}
        {showClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-10 w-10"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        )}
        {!showClose && <div className="w-10" />}

        {/* Center: Logo & Location */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💅</span>
            <h1 className="text-lg font-bold text-accent">Mango Nail Spa</h1>
          </div>
          {title && (
            <p className="text-xs text-muted-foreground">{title}</p>
          )}
          {!title && selectedLocation && (
            <p className="text-xs text-muted-foreground">{locationName}</p>
          )}
        </div>

        {/* Right: Cart Icon */}
        {showCart && <CartSheet />}
        {!showCart && <div className="w-10" />}
      </div>
    </header>
  );
};
