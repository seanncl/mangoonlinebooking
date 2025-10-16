import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Scissors, Footprints, Sparkles, Palette, Plus, ChevronDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { BookingFooter } from '@/components/layout/BookingFooter';
import { useBooking } from '@/context/BookingContext';
import { supabase } from '@/integrations/supabase/client';
import { Service, ServiceCategory } from '@/types/booking';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const categoryConfig: Record<ServiceCategory, { label: string; icon: React.ReactNode }> = {
  manicure: { label: 'Manicure', icon: <Scissors className="h-5 w-5" /> },
  pedicure: { label: 'Pedicure', icon: <Footprints className="h-5 w-5" /> },
  extensions: { label: 'Extensions', icon: <Sparkles className="h-5 w-5" /> },
  nail_art: { label: 'Nail Art', icon: <Palette className="h-5 w-5" /> },
  add_ons: { label: 'Add-Ons', icon: <Plus className="h-5 w-5" /> },
};

export default function ServiceSelection() {
  const navigate = useNavigate();
  const { selectedLocation, addToCart, cart, bookingFlowType, preferredStaffId } = useBooking();
  const isMobile = useIsMobile();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [addOnsDialogOpen, setAddOnsDialogOpen] = useState(false);

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
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('location_id', selectedLocation.id)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setServices(data || []);
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
        <div className="container max-w-6xl mx-auto px-4 py-6">
          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {(Object.keys(categoryConfig) as ServiceCategory[]).map((category) => {
              const config = categoryConfig[category];
              const isSelected = selectedCategory === category;
              return (
                <Button
                  key={category}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(isSelected ? null : category)}
                  className="flex-shrink-0 gap-2"
                >
                  {config.icon}
                  {config.label}
                </Button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Services Grid */}
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category} className="mb-12">
              <h2 className="text-2xl font-bold mb-6 capitalize">{category.replace('_', ' ')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryServices.map((service) => (
                  <Card key={service.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {service.name}
                          </h3>
                          {isMobile && service.description && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="text-muted-foreground hover:text-foreground flex-shrink-0">
                                  <Info className="h-4 w-4" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <p className="text-sm">{service.description}</p>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        {!isMobile && service.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="gap-1">
                            💵 ${service.price_cash}
                          </Badge>
                          <Badge variant="secondary" className="gap-1">
                            💳 ${service.price_card}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            ⏱️ {service.duration_minutes} min
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAddService(service)}
                        size="icon"
                        className="flex-shrink-0 h-10 w-10 rounded-full bg-primary hover:bg-primary-hover"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </Card>
                ))}
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
              const discountedPrice = addOn.price_card - addOn.discount_when_bundled;

              return (
                <div
                  key={addOn.id}
                  onClick={() => {
                    setSelectedAddOns(prev =>
                      isSelected ? prev.filter(id => id !== addOn.id) : [...prev, addOn.id]
                    );
                  }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected ? 'border-primary bg-primary-light' : 'hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox checked={isSelected} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          {addOn.name}
                        </h4>
                        {isMobile && addOn.description && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-muted-foreground hover:text-foreground flex-shrink-0">
                                <Info className="h-4 w-4" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <p className="text-sm">{addOn.description}</p>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                      {!isMobile && addOn.description && (
                        <p className="text-sm text-muted-foreground mb-1 line-clamp-2">
                          {addOn.description}
                        </p>
                      )}
                      <div className="flex gap-3 text-sm mt-1">
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
        nextLabel={`Next ${cart.length > 0 ? `(${cart.length})` : ''}`}
        onNext={handleNext}
        nextDisabled={cart.length === 0}
      />
    </div>
  );
}
