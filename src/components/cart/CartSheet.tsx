import { X, ShoppingBag, ChevronDown, Plus, Info } from 'lucide-react';
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
import { useState, useEffect } from 'react';
import { bookingAPI } from '@/services/booking-api';
import { Service, ServiceCategory } from '@/types/booking';
import { cn } from '@/lib/utils';
import { Scissors, Footprints, Sparkles, Palette } from 'lucide-react';

const categoryConfig: Record<ServiceCategory, { label: string; icon: React.ReactNode }> = {
  manicure: { label: 'Manicure', icon: <Scissors className="h-4 w-4" /> },
  pedicure: { label: 'Pedicure', icon: <Footprints className="h-4 w-4" /> },
  extensions: { label: 'Extensions', icon: <Sparkles className="h-4 w-4" /> },
  nail_art: { label: 'Nail Art', icon: <Palette className="h-4 w-4" /> },
  add_ons: { label: 'Add-Ons', icon: <Plus className="h-4 w-4" /> },
};

export const CartSheet = () => {
  const navigate = useNavigate();
  const { selectedLocation, cart, cartTotal, depositAmount, removeFromCart, addToCart } = useBooking();
  const [cartOpen, setCartOpen] = useState(false);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<ServiceCategory>>(new Set(['extensions', 'nail_art']));
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (cartOpen && selectedLocation) {
      loadAvailableServices();
    }
  }, [cartOpen, selectedLocation]);

  const loadAvailableServices = async () => {
    if (!selectedLocation) return;
    
    try {
      const response = await bookingAPI.getServices(selectedLocation.id);
      if (response.success && response.data) {
        // Filter out services already in cart and add-ons
        const cartServiceIds = cart.map(item => item.service.id);
        const available = response.data.filter(
          service => !cartServiceIds.includes(service.id) && !service.is_add_on
        );
        setAvailableServices(available);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const toggleCategory = (category: ServiceCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleServiceDescription = (serviceId: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
    }
    setExpandedServices(newExpanded);
  };

  const handleAddService = (service: Service) => {
    addToCart({ service, addOns: [] });
    loadAvailableServices(); // Refresh available services
  };

  const groupedServices = availableServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<ServiceCategory, Service[]>);

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10">
          <ShoppingBag className="h-5 w-5" />
          {cart.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-6 w-6 rounded-full p-0 text-xs flex items-center justify-center bg-cyan-500 hover:bg-cyan-500"
            >
              {cart.length}
            </Badge>
          )}
          <span className="sr-only">Shopping cart ({cart.length} items)</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-xl">Your Cart</SheetTitle>
          {selectedLocation && (
            <p className="text-sm text-muted-foreground">
              {selectedLocation.name}
            </p>
          )}
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-6">
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No services selected yet
            </p>
          ) : (
            <div className="space-y-6">
              {/* Your Services Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Your Services</h3>
                {cart.map((item, index) => (
                  <Card 
                    key={index} 
                    className="p-4 relative border-cyan-500 bg-cyan-50/30"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item.service.id)}
                      className="absolute top-3 right-3 h-5 w-5 p-0 hover:bg-transparent"
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </Button>
                    <div className="pr-6 space-y-1">
                      <div className="font-semibold text-base">{item.service.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Technician: Any Available Technician
                      </div>
                      {item.addOns && item.addOns.length > 0 && (
                        <div className="text-sm text-muted-foreground pt-1">
                          + {item.addOns.map(ao => ao.name).join(', ')}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm pt-1">
                        <span className="text-muted-foreground">
                          💵 ${item.service.price_cash}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">
                          💳 ${item.service.price_card}
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
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${cartTotal.toFixed(2)}</span>
                </div>
                {depositAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Deposit (20%)</span>
                      <span className="font-medium">${depositAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Remaining Balance</span>
                      <span className="font-medium">${(cartTotal - depositAmount).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-base">Total Due Now</span>
                  <span className="font-bold text-2xl text-cyan-500">
                    ${depositAmount > 0 ? depositAmount.toFixed(2) : cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Add More Services Section */}
              {availableServices.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">Add More Services</h3>
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                      Optional
                    </Badge>
                  </div>

                  {Object.entries(groupedServices).map(([category, services]) => {
                    const isExpanded = expandedCategories.has(category as ServiceCategory);
                    const config = categoryConfig[category as ServiceCategory];
                    
                    return (
                      <div key={category} className="space-y-2">
                        <button
                          onClick={() => toggleCategory(category as ServiceCategory)}
                          className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide w-full"
                        >
                          {config?.icon}
                          {config?.label || category}
                        </button>
                        
                        {isExpanded && (
                          <div className="space-y-2">
                            {services.map((service) => {
                              const isServiceExpanded = expandedServices.has(service.id);
                              
                              return (
                                <Card 
                                  key={service.id} 
                                  className="p-3 border-gray-200 hover:border-gray-300 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-sm">{service.name}</h4>
                                        {service.description && (
                                          <button
                                            onClick={() => toggleServiceDescription(service.id)}
                                            className="text-gray-400 hover:text-gray-600"
                                          >
                                            <Info className="h-3 w-3" />
                                          </button>
                                        )}
                                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                          Add On
                                        </Badge>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>💵 ${service.price_cash}</span>
                                        <span>·</span>
                                        <span>💳 ${service.price_card}</span>
                                        <span>⏱️ {service.duration_minutes} min</span>
                                      </div>

                                      {isServiceExpanded && service.description && (
                                        <div className="text-xs text-gray-600 pt-1">
                                          {service.description}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {service.description && (
                                        <button
                                          onClick={() => toggleServiceDescription(service.id)}
                                          className="text-gray-400 hover:text-gray-600"
                                        >
                                          <ChevronDown 
                                            className={cn(
                                              "h-4 w-4 transition-transform",
                                              isServiceExpanded && "rotate-180"
                                            )}
                                          />
                                        </button>
                                      )}
                                      <Button
                                        size="icon"
                                        onClick={() => handleAddService(service)}
                                        className="h-8 w-8 rounded-full bg-cyan-500 hover:bg-cyan-600 flex-shrink-0"
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {cart.length > 0 && (
          <div className="space-y-2 p-6 border-t mt-auto">
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setCartOpen(false)}
            >
              Continue Browsing
            </Button>
            <Button 
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={() => {
                setCartOpen(false);
                navigate('/time');
              }}
            >
              Proceed to Checkout
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
