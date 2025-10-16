import { X, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '@/context/BookingContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';

interface BookingHeaderProps {
  title?: string;
  showClose?: boolean;
  showCart?: boolean;
  onClose?: () => void;
}

export const BookingHeader = ({ title, showClose = true, showCart = true, onClose }: BookingHeaderProps) => {
  const navigate = useNavigate();
  const { selectedLocation, cart, cartTotal, depositAmount, removeFromCart } = useBooking();
  const [cartOpen, setCartOpen] = useState(false);

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
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
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
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
              <SheetHeader>
                <SheetTitle>Your Cart</SheetTitle>
                {selectedLocation && (
                  <p className="text-sm text-muted-foreground">
                    {selectedLocation.name.replace('Mango Nail Spa - ', '')}
                  </p>
                )}
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto mt-6">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No services selected yet
                  </p>
                ) : (
                  <div className="space-y-6">
                    {/* Your Services Section */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-base">Your Services</h3>
                      {cart.map((item, index) => (
                        <Card key={index} className="p-3 relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.service.id)}
                            className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="pr-8 space-y-2">
                            <div className="font-medium">{item.service.name}</div>
                            {item.addOns && item.addOns.length > 0 && (
                              <div className="text-sm text-muted-foreground">
                                + {item.addOns.map(ao => ao.name).join(', ')}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">
                                💵 ${item.service.price_cash} · 💳 ${item.service.price_card}
                              </span>
                              <span className="text-muted-foreground">
                                ⏱️ {item.service.duration_minutes} min
                              </span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">${cartTotal.toFixed(2)}</span>
                      </div>
                      {depositAmount > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Deposit (20%):</span>
                            <span className="font-medium">${depositAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Remaining Balance:</span>
                            <span className="text-muted-foreground">${(cartTotal - depositAmount).toFixed(2)} (pay at salon)</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold text-lg">Total Due Now:</span>
                        <span className="font-bold text-2xl text-cyan-500">
                          ${depositAmount > 0 ? depositAmount.toFixed(2) : cartTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {cart.length > 0 && (
                <div className="space-y-2 pt-4 border-t mt-4">
                  <Button 
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                    onClick={() => {
                      setCartOpen(false);
                      navigate('/time');
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setCartOpen(false)}
                  >
                    Continue Browsing
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        )}
        {!showCart && <div className="w-10" />}
      </div>
    </header>
  );
};
