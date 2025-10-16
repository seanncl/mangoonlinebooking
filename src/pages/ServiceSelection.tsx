import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Scissors, Footprints, Sparkles, Palette, Plus, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { BookingFooter } from '@/components/layout/BookingFooter';
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
  const { selectedLocation, addToCart, cart, bookingFlowType, preferredStaffId, removeFromCart } = useBooking();
  const [services, setServices] = useState<Service[]>([]);
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
        {/* Sticky Category & Search Section */}
        <div className="sticky top-12 z-40 bg-background border-b pb-4">
          <div className="container max-w-6xl mx-auto px-4 pt-4">
            {/* Category Filters */}
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

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="container max-w-6xl mx-auto px-4 py-6">

          {/* Services List */}
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-bold mb-4 capitalize">
                {categoryConfig[category as ServiceCategory]?.label || category.replace('_', ' ')}
              </h2>
              <div className="space-y-3">
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
                          {/* Service Name Row - Clickable for description toggle */}
                          <div 
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => toggleDescription(service.id)}
                          >
                            <h4 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                              {service.name}
                            </h4>
                            {hasAddOns && (
                              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                Add On
                              </Badge>
                            )}
                            {service.description && (
                              <ChevronDown 
                                className={cn(
                                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                  isExpanded && "rotate-180"
                                )}
                              />
                            )}
                          </div>

                          {/* Inline Price Display */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold text-foreground">💵 ${service.price_cash.toFixed(2)}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="font-bold text-foreground">💳 ${service.price_card.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground ml-1">⏱️ {service.duration_minutes}min</span>
                    </div>

                          {/* Collapsible Description */}
                          {isExpanded && service.description && (
                            <div className="text-sm text-gray-600 pt-2 animate-accordion-down">
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
                      
                      <div className="flex gap-3 text-sm">
                        <span className="text-muted-foreground">
                          💵 <span className="line-through">${addOn.price_cash}</span> ${(addOn.price_cash - addOn.discount_when_bundled).toFixed(2)}
                        </span>
                        <span className="text-muted-foreground">
                          💳 <span className="line-through">${addOn.price_card}</span> ${discountedPrice.toFixed(2)}
                        </span>
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
    </div>
  );
}
