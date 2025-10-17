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
import { Service, ServiceCategory, Staff } from '@/types/booking';
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
  const { selectedLocation, addToCart, cart, bookingFlowType, preferredStaffIds, removeFromCart, cartCount, updateCartItemStaff } = useBooking();
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
  const [selectedStaff, setSelectedStaff] = useState<Staff[] | null>(null);

  useEffect(() => {
    if (!selectedLocation) {
      navigate('/');
      return;
    }
    loadServices();
  }, [selectedLocation, navigate]);

  // Load selected staff details in staff-first flow
  useEffect(() => {
    const loadSelectedStaff = async () => {
      if (bookingFlowType === 'staff-first' && preferredStaffIds && preferredStaffIds.length > 0 && selectedLocation) {
        try {
          const response = await bookingAPI.getStaff(selectedLocation.id);
          if (response.success && response.data) {
            const staffMembers = response.data.filter(s => preferredStaffIds.includes(s.id));
            setSelectedStaff(staffMembers.length > 0 ? staffMembers : null);
          }
        } catch (error) {
          console.error('Error loading staff:', error);
        }
      } else {
        setSelectedStaff(null);
      }
    };

    loadSelectedStaff();
  }, [bookingFlowType, preferredStaffIds, selectedLocation]);

  const loadServices = async () => {
    if (!selectedLocation) return;

    try {
      const response = await bookingAPI.getServices(selectedLocation.id);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load services');
      }

      let allServices = response.data;

      // Filter services by selected staff in staff-first flow
      if (bookingFlowType === 'staff-first' && selectedStaff && selectedStaff.length > 0) {
        // Collect all service IDs that any selected staff can perform
        const allowedServiceIds = new Set<string>();
        
        selectedStaff.forEach(staff => {
          if (!staff.service_ids || staff.service_ids.length === 0) {
            // Staff can perform all services - add all service IDs
            allServices.forEach(s => allowedServiceIds.add(s.id));
          } else {
            // Add this staff's specific service IDs
            staff.service_ids.forEach(id => allowedServiceIds.add(id));
          }
        });

        // Filter to only show services that selected staff can perform
        allServices = allServices.filter(service => allowedServiceIds.has(service.id));
      }

      setServices(allServices);
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
      // Auto-assign staffId in staff-first flow if only one staff selected
      addToCart({ 
        service, 
        addOns: [], 
        staffId: bookingFlowType === 'staff-first' && preferredStaffIds && preferredStaffIds.length === 1 ? preferredStaffIds[0] : undefined 
      });
      toast.success(`Added ${service.name}`);
    }
  };

  const handleConfirmAddOns = () => {
    if (!selectedService) return;

    const addOns = addOnServices.filter(s => selectedAddOns.includes(s.id));
    // Auto-assign staffId in staff-first flow if only one staff selected
    addToCart({ 
      service: selectedService, 
      addOns,
      staffId: bookingFlowType === 'staff-first' && preferredStaffIds && preferredStaffIds.length === 1 ? preferredStaffIds[0] : undefined
    });
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
      toast.error('Please add at least one service to continue');
      return;
    }

    // In staff-first flow, navigate back to staff selection to add more staff
    if (bookingFlowType === 'staff-first') {
      navigate('/staff');
    } else if (bookingFlowType === 'service-first' && cart.length > 1) {
      // In service-first flow with multiple services, show staff assignment option
      navigate('/staff');
    } else {
      navigate('/time');
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

      {/* Selected Staff Banner - Staff-First Flow */}
      {bookingFlowType === 'staff-first' && selectedStaff && selectedStaff.length > 0 && (
        <div className="bg-primary/5 border-b border-border sticky top-12 z-30">
          <div className="container max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {selectedStaff.length === 1 ? (
                  <>
                    <div className="text-3xl leading-none">
                      {selectedStaff[0].avatar_emoji}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {selectedStaff[0].first_name} {selectedStaff[0].last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Showing available services
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex -space-x-2">
                      {selectedStaff.slice(0, 3).map((staff) => (
                        <div key={staff.id} className="text-2xl leading-none bg-background rounded-full border-2 border-background">
                          {staff.avatar_emoji}
                        </div>
                      ))}
                      {selectedStaff.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-semibold">
                          +{selectedStaff.length - 3}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">
                        {selectedStaff.length} Staff Selected
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Assign them to specific services next
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/staff')}
              >
                Change
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 pb-24">
        {/* Search Bar - Mobile and Desktop */}
        <div className="sticky top-12 z-40 bg-background border-b pb-4 lg:hidden">
          <div className="container max-w-7xl mx-auto px-4 pt-4">
            {/* Category Filters - Mobile Only */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
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
                      isSelected && "bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-500"
                    )}
                  >
                    {config.icon}
                    <span className="text-xs">{config.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Search Bar with Cart */}
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
              <div className="flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 relative h-11 w-11 p-0"
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
          </div>
        </div>

        <div className="container max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="sticky top-16 space-y-6">
              {/* Search Bar - Desktop */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>

              {/* Cart Button - Desktop */}
              <Button
                variant="outline"
                className="w-full gap-2 relative h-12"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingBag className="h-5 w-5" />
                <span>View Cart</span>
                {cartCount > 0 && (
                  <Badge 
                    variant="default" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
                  >
                    {cartCount}
                  </Badge>
                )}
              </Button>

              {/* Category Filters - Desktop Sidebar */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide px-2">
                  Categories
                </h3>
                <div className="space-y-1">
                  {(Object.keys(categoryConfig) as ServiceCategory[]).map((category) => {
                    const config = categoryConfig[category];
                    const isSelected = selectedCategory === category;
                    return (
                      <Button
                        key={category}
                        variant={isSelected ? 'default' : 'ghost'}
                        onClick={() => setSelectedCategory(isSelected ? null : category)}
                        className={cn(
                          "w-full justify-start gap-3 h-12",
                          isSelected && "bg-cyan-500 hover:bg-cyan-600 text-white"
                        )}
                      >
                        {config.icon}
                        <span>{config.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">

            {/* Services List */}
            {Object.entries(groupedServices).map(([category, categoryServices]) => (
              <div key={category} className="mb-8">
                <h2 className="text-xl font-bold mb-4 capitalize">
                  {categoryConfig[category as ServiceCategory]?.label || category.replace('_', ' ')}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                          "p-4 transition-all duration-200",
                          isInCart 
                            ? "border-cyan-500 bg-cyan-50/50 shadow-sm" 
                            : "border-border hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            {/* Service Name Row - Clickable on mobile only */}
                            <div 
                              className="flex items-center gap-2 lg:cursor-default cursor-pointer group"
                              onClick={() => window.innerWidth < 1024 && toggleDescription(service.id)}
                            >
                              <h4 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                                {service.name}
                              </h4>
                              {hasAddOns && (
                                <Badge variant="secondary" className="text-[0.65rem] bg-gray-50 text-gray-400 border-gray-200 opacity-60">
                                  Add On
                                </Badge>
                              )}
                              {service.description && (
                                <ChevronDown 
                                  className={cn(
                                    "h-4 w-4 text-muted-foreground transition-transform duration-200 lg:hidden",
                                    isExpanded && "rotate-180"
                                  )}
                                />
                              )}
                            </div>

                            {/* Inline Price Display */}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-foreground">💵 ${service.price_cash.toFixed(2)}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="font-bold text-foreground">💳 ${service.price_card.toFixed(2)}</span>
                              <span className="text-[0.7rem] text-muted-foreground ml-1">⏱️ {service.duration_minutes}min</span>
                            </div>

                            {/* Description - Always visible on desktop, collapsible on mobile */}
                            {service.description && (
                              <div className={cn(
                                "text-sm text-muted-foreground pt-2",
                                "lg:block", // Always show on desktop
                                !isExpanded && "hidden lg:block", // Hide on mobile unless expanded
                                isExpanded && "animate-accordion-down" // Animate on mobile
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
                                className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600"
                              >
                                <X className="h-5 w-5" />
                              </Button>
                            ) : (
                              <Button
                                variant="default"
                                size="icon"
                                onClick={() => handleAddService(service)}
                                className="h-12 w-12 rounded-full bg-cyan-500 hover:bg-cyan-600"
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
              <div className="text-center py-12">
                <p className="text-muted-foreground">No services found matching your search.</p>
              </div>
            )}
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
        onBack={() => navigate('/staff')}
        nextLabel={bookingFlowType === 'staff-first' ? 'Add Another Staff' : 'Continue'}
        onNext={handleNext}
        nextDisabled={cart.length === 0}
      />
      
      {/* Cart Sheet */}
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
