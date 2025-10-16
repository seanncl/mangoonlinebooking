import { X, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '@/context/BookingContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface BookingHeaderProps {
  title?: string;
  showClose?: boolean;
  showCart?: boolean;
  onClose?: () => void;
}

export const BookingHeader = ({ title, showClose = true, showCart = true, onClose }: BookingHeaderProps) => {
  const navigate = useNavigate();
  const { selectedLocation, cart, cartTotal, depositAmount, removeFromCart } = useBooking();

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
        {showCart && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-10 w-10">
                <ShoppingBag className="h-5 w-5" />
                {cart.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-accent"
                  >
                    {cart.length}
                  </Badge>
                )}
                <span className="sr-only">Shopping cart ({cart.length} items)</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Your Services</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No services selected yet
                  </p>
                ) : (
                  <>
                    {cart.map((item, index) => (
                      <div key={index} className="flex justify-between items-start gap-3 pb-3 border-b">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{item.service.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {item.service.duration_minutes} min
                          </p>
                          {item.addOns.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.addOns.map((addOn, i) => (
                                <p key={i} className="text-xs text-muted-foreground">
                                  + {addOn.name}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            ${item.service.price_card.toFixed(2)}
                          </p>
                          {item.addOns.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              +${item.addOns.reduce((sum, addOn) =>
                                sum + addOn.price_card - addOn.discount_when_bundled, 0
                              ).toFixed(2)}
                            </p>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.service.id)}
                            className="mt-1 h-6 text-xs text-destructive hover:text-destructive"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 space-y-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                      </div>
                      {selectedLocation?.has_deposit_policy && (
                        <>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Deposit ({selectedLocation.deposit_percentage}%):</span>
                            <span>${depositAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Remaining (pay at salon):</span>
                            <span>${(cartTotal - depositAmount).toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}
        {!showCart && <div className="w-10" />}
      </div>
    </header>
  );
};
