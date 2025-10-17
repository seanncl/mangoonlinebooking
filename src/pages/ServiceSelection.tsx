import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Scissors, Footprints, Sparkles, Palette, Plus, ChevronDown, X, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { BookingFooter } from '@/components/layout/BookingFooter';
import { CartSheet } from '@/components/cart/CartSheet';
import { useBooking } from '@/context/BookingContext';
import { bookingAPI } from '@/services/booking-api';
import { Service, ServiceCategory } from '@/types/booking';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const categoryConfig: Record<ServiceCategory, { label: string; icon: React.ReactNode }> = {
  manicure: { label: 'Manicure', icon: <Scissors className="h-5 w-5" /> },
  pedicure: { label: 'Pedicure', icon: <Footprints className="h-5 w-5" /> },
  extensions: { label: 'Extensions', icon: <Sparkles className="h-5 w-5" /> },
  nail_art: { label: 'Nail Art', icon: <Palette className="h-5 w-5" /> },
  add_ons: { label: 'Add-Ons', icon: <Plus className="h-5 w-5" /> },
};

export default function ServiceSelection() {
  const navigate = useNavigate();
  const { selectedLocation, addToCart, cart, bookingFlowType, preferredStaffId, removeFromCart, cartCount } = useBooking();
  const [services, setServices] = useState<Service[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [addOnsDialogOpen, setAddOnsDialogOpen] = useState(false);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [expandedAddOns, setExpandedAddOns] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selectedLocation) {
      navigate('/');
      return;
    }
    loadServices();
  }, [selectedLocation, navigate]);

  const loadServices = async () => {
    if (!selectedLocation) return;

    try {
      const response = await bookingAPI.getServices(selectedLocation.id);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load services');
      }

      setServices(response.data);
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const mainServices = services.filter(s => !s.is_add_on);
  const addOnServices = services.filter(s => s.is_add_on);

  const filteredServices = mainServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedServices = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<ServiceCategory, Service[]>);

  const handleAddService = (service: Service) => {
    const availableAddOns = addOnServices.filter(addOn => 
      !addOn.parent_service_id || addOn.parent_service_id === service.id
    );

    if (availableAddOns.length > 0) {
      setSelectedService(service);
      setSelectedAddOns([]);
      setAddOnsDialogOpen(true);
    } else {
      addToCart({ service, addOns: [] });
      toast.success(`Added ${service.name}`);
    }
  };

  const handleConfirmAddOns = () => {
    if (!selectedService) return;

    const addOns = addOnServices.filter(s => selectedAddOns.includes(s.id));
    addToCart({ service: selectedService, addOns });
    toast.success(`Added ${selectedService.name}${addOns.length > 0 ? ` with ${addOns.length} add-on(s)` : ''}`);
    setAddOnsDialogOpen(false);
    setSelectedService(null);
    setSelectedAddOns([]);
  };

  const selectedAddOnsTotal = selectedAddOns.reduce((total, id) => {
    const addOn = addOnServices.find(s => s.id === id);
    if (!addOn) return total;
    return total + addOn.price_card - addOn.discount_when_bundled;
  }, 0);

  const handleNext = () => {
    if (cart.length === 0) {
      toast.error('Please select at least one service');
      return;
    }
    // If staff-first flow, skip staff selection (already chosen)
    if (bookingFlowType === 'staff-first') {
      navigate('/time');
    } else {
      navigate('/staff');
    }
  };

  const toggleDescription = (serviceId: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
    }
    setExpandedServices(newExpanded);
  };

  const toggleAddOnDescription = (addOnId: string) => {
    const newExpanded = new Set(expandedAddOns);
    if (newExpanded.has(addOnId)) {
      newExpanded.delete(addOnId);
    } else {
      newExpanded.add(addOnId);
    }
    setExpandedAddOns(newExpanded);
  };

  const isServiceInCart = (serviceId: string) => {
    return cart.some(item => item.service.id === serviceId);
  };

  const handleRemoveService = (serviceId: string) => {
    removeFromCart(serviceId);
    toast.success('Service removed from cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">💅</div>
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <BookingHeader />

      <main className="flex-1 pb-24">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Left Sidebar - Categories (Desktop) */}
            <aside className="hidden lg:block lg:w-64 flex-shrink-0">
              <div className="sticky top-20 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-3">
                    CATEGORIES
                  </h3>
                  
                  {/* All Services Option */}
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      "w-full justify-start h-12 px-3 transition-all",
                      !selectedCategory 
                        ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                        : "hover:bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-background/10 flex items-center justify-center">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <span className="font-medium">All Services</span>
                    </div>
                  </Button>
                  
                  {/* Category Options */}
                  {(Object.keys(categoryConfig) as ServiceCategory[]).map((category) => {
                    const config = categoryConfig[category];
                    const isSelected = selectedCategory === category;
                    const categoryCount = mainServices.filter(s => s.category === category).length;
                    
                    return (
                      <Button
                        key={category}
                        variant="ghost"
                        onClick={() => setSelectedCategory(isSelected ? null : category)}
                        className={cn(
                          "w-full justify-start h-12 px-3 transition-all",
                          isSelected 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                            : "hover:bg-accent"
                        )}
                      >
                        <div className="flex items-center justify-between w-full gap-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                              isSelected ? "bg-background/10" : "bg-muted"
                            )}>
                              {config.icon}
                            </div>
                            <span className="font-medium">{config.label}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {categoryCount}
                          </Badge>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Mobile Categories - Horizontal Scroll */}
            <div className="lg:hidden sticky top-12 z-40 bg-background -mx-4 px-4 pb-4 border-b">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Button
                  variant={!selectedCategory ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "flex-shrink-0 flex-col gap-1 rounded-2xl px-4 py-2 h-auto min-w-[80px]",
                    !selectedCategory && "bg-primary hover:bg-primary/90"
                  )}
                >
                  <Sparkles className="h-5 w-5" />
                  <span className="text-xs">All</span>
                </Button>
                
                {(Object.keys(categoryConfig) as ServiceCategory[]).map((category) => {
                  const config = categoryConfig[category];
                  const isSelected = selectedCategory === category;
                  return (
                    <Button
                      key={category}
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => setSelectedCategory(isSelected ? null : category)}
                      className={cn(
                        "flex-shrink-0 flex-col gap-1 rounded-2xl px-4 py-2 h-auto min-w-[80px]",
                        isSelected && "bg-primary hover:bg-primary/90"
                      )}
                    >
                      {config.icon}
                      <span className="text-xs">{config.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Right Content - Search & Services */}
            <div className="flex-1 min-w-0 space-y-6">
              
              {/* Search Bar with Cart */}
              <div className="sticky top-12 lg:top-20 z-30 bg-background py-2 -mt-2">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search for services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 relative h-12 w-12 p-0"
                    onClick={() => setCartOpen(true)}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {cartCount > 0 && (
                      <Badge 
                        variant="default" 
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
                      >
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>

              {/* Services Grid */}
              {Object.entries(groupedServices).map(([category, categoryServices]) => (
                <div key={category} className="animate-fade-in">
                  <h2 className="text-2xl font-bold mb-5 capitalize">
                    {categoryConfig[category as ServiceCategory]?.label || category.replace('_', ' ')}
                  </h2>
                  
                  {/* Desktop Grid (2 columns) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                    {categoryServices.map((service) => {
                      const isInCart = isServiceInCart(service.id);
                      const isExpanded = expandedServices.has(service.id);
                      const hasAddOns = addOnServices.some(addOn => 
                        !addOn.parent_service_id || addOn.parent_service_id === service.id
                      );
                      
                      return (
                        <Card
                          key={service.id}
                          className={cn(
                            "p-4 transition-all duration-200 hover-scale",
                            isInCart 
                              ? "border-primary bg-primary/5 shadow-sm" 
                              : "border-border hover:shadow-md hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2 min-w-0">
                              {/* Service Name Row */}
                              <div 
                                className="flex items-center gap-2 lg:cursor-default cursor-pointer group"
                                onClick={() => window.innerWidth < 1024 && toggleDescription(service.id)}
                              >
                                <h4 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors truncate">
                                  {service.name}
                                </h4>
                                {hasAddOns && (
                                  <Badge variant="secondary" className="text-[0.65rem] flex-shrink-0">
                                    Add On
                                  </Badge>
                                )}
                                {service.description && (
                                  <ChevronDown 
                                    className={cn(
                                      "h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 lg:hidden",
                                      isExpanded && "rotate-180"
                                    )}
                                  />
                                )}
                              </div>

                              {/* Price & Duration */}
                              <div className="flex items-center gap-2 text-xs flex-wrap">
                                <span className="font-bold text-foreground">💵 ${service.price_cash.toFixed(2)}</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="font-bold text-foreground">💳 ${service.price_card.toFixed(2)}</span>
                                <span className="text-[0.7rem] text-muted-foreground">⏱️ {service.duration_minutes}min</span>
                              </div>

                              {/* Description - Always visible on desktop, collapsible on mobile */}
                              {service.description && (
                                <div className={cn(
                                  "text-sm text-muted-foreground pt-2",
                                  "lg:block",
                                  !isExpanded && "hidden lg:block",
                                  isExpanded && "animate-accordion-down"
                                )}>
                                  {service.description}
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            <div className="flex-shrink-0">
                              {isInCart ? (
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleRemoveService(service.id)}
                                  className="h-11 w-11 rounded-full"
                                >
                                  <X className="h-5 w-5" />
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="icon"
                                  onClick={() => handleAddService(service)}
                                  className="h-11 w-11 rounded-full"
                                >
                                  <Plus className="h-5 w-5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredServices.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-lg font-medium mb-2">No services found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or category filter</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add-Ons Dialog */}
      <Dialog open={addOnsDialogOpen} onOpenChange={setAddOnsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedService?.name} Add-Ons</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Select optional add-ons to enhance your service
            </p>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {addOnServices.map((addOn) => {
              const isSelected = selectedAddOns.includes(addOn.id);
              const isExpanded = expandedAddOns.has(addOn.id);
              const discountedPrice = addOn.price_card - addOn.discount_when_bundled;

              return (
                <div
                  key={addOn.id}
                  className={cn(
                    "p-4 border rounded-lg transition-all",
                    isSelected ? 'border-cyan-500 bg-cyan-50/50' : 'hover:border-cyan-500/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={isSelected} 
                      className="mt-1"
                      onClick={() => {
                        setSelectedAddOns(prev =>
                          isSelected ? prev.filter(id => id !== addOn.id) : [...prev, addOn.id]
                        );
                      }}
                    />
                    <div className="flex-1 space-y-1">
                      <div 
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => addOn.description && toggleAddOnDescription(addOn.id)}
                      >
                        <h4 className="font-semibold group-hover:text-primary transition-colors">
                          {addOn.name}
                        </h4>
                        {addOn.description && (
                          <ChevronDown 
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform duration-200",
                              isExpanded && "rotate-180"
                            )}
                          />
                        )}
                      </div>
                      
                      {isExpanded && addOn.description && (
                        <p className="text-sm text-gray-600 pt-1 animate-accordion-down">
                          {addOn.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-foreground">
                          💵 <span className="line-through font-normal">${addOn.price_cash}</span> ${(addOn.price_cash - addOn.discount_when_bundled).toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-bold text-foreground">
                          💳 <span className="line-through font-normal">${addOn.price_card}</span> ${discountedPrice.toFixed(2)}
                        </span>
                        <span className="text-[0.7rem] text-muted-foreground ml-1">⏱️ {addOn.duration_minutes}min</span>
                      </div>
                      {addOn.discount_when_bundled > 0 && (
                        <p className="text-xs text-success mt-1">
                          Save ${addOn.discount_when_bundled.toFixed(2)} when added with service
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {selectedService && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{selectedService.name}</span>
                <span className="font-semibold">
                  💵 ${selectedService.price_cash} · 💳 ${selectedService.price_card}
                </span>
              </div>
              {selectedAddOns.length > 0 && selectedAddOns.map(id => {
                const addOn = addOnServices.find(s => s.id === id);
                if (!addOn) return null;
                return (
                  <div key={id} className="flex justify-between text-sm text-muted-foreground">
                    <span>+ {addOn.name}</span>
                    <span>
                      💵 ${(addOn.price_cash - addOn.discount_when_bundled).toFixed(2)} · 
                      💳 ${(addOn.price_card - addOn.discount_when_bundled).toFixed(2)}
                    </span>
                  </div>
                );
              })}
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>Total</span>
                <span>
                  💵 ${(selectedService.price_cash + selectedAddOns.reduce((sum, id) => {
                    const addOn = addOnServices.find(s => s.id === id);
                    return sum + (addOn ? addOn.price_cash - addOn.discount_when_bundled : 0);
                  }, 0)).toFixed(2)} · 
                  💳 ${(selectedService.price_card + selectedAddOnsTotal).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAddOnsDialogOpen(false);
                setSelectedService(null);
                setSelectedAddOns([]);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmAddOns} className="flex-1 bg-primary hover:bg-primary-hover">
              Add to Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BookingFooter
        nextLabel="Next"
        onNext={handleNext}
        nextDisabled={cart.length === 0}
      />
      
      {/* Cart Sheet */}
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
