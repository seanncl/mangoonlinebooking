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
        <div className="flex items-center gap-2">
          <span className="text-2xl">💅</span>
          {title && (
            <h1 className="text-lg font-bold text-accent">{title}</h1>
          )}
          {!title && selectedLocation && (
            <h1 className="text-lg font-bold text-accent">{selectedLocation.name}</h1>
          )}
          {!title && !selectedLocation && (
            <h1 className="text-lg font-bold text-accent">Mango Nail Spa</h1>
          )}
        </div>

        {/* Right: Cart Icon */}
        {showCart && <CartSheet />}
        {!showCart && <div className="w-10" />}
      </div>
    </header>
  );
};
