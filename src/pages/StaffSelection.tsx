import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, ShoppingBag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { BookingFooter } from '@/components/layout/BookingFooter';
import { CartSheet } from '@/components/cart/CartSheet';
import { StaffScheduleModal } from '@/components/staff/StaffScheduleModal';
import { useBooking } from '@/context/BookingContext';
import { bookingAPI } from '@/services/booking-api';
import { Staff } from '@/types/booking';
import { toast } from 'sonner';

export default function StaffSelection() {
  const navigate = useNavigate();
  const { selectedLocation, cart, updateCartItemStaff, bookingFlowType, setPreferredStaff, cartCount } = useBooking();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [selectedStaffMember, setSelectedStaffMember] = useState<Staff | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleStaff, setScheduleStaff] = useState<Staff | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    if (!selectedLocation) {
      navigate('/');
      return;
    }
    // For staff-first flow, cart can be empty (selecting staff first)
    if (bookingFlowType !== 'staff-first' && cart.length === 0) {
      navigate('/');
      return;
    }
    loadStaff();
  }, [selectedLocation, cart, navigate, bookingFlowType]);

  const loadStaff = async () => {
    if (!selectedLocation) return;

    try {
      const response = await bookingAPI.getStaff(selectedLocation.id);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load staff');
      }

      setStaff(response.data);
    } catch (error) {
      console.error('Error loading staff:', error);
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(member =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusConfig = (status: Staff['status']) => {
    switch (status) {
      case 'available_now':
        return { color: 'bg-success', label: 'Available Now' };
      case 'available_later':
        return { color: 'bg-warning', label: 'Available Later' };
      case 'unavailable':
        return { color: 'bg-muted', label: 'Available Tomorrow' };
    }
  };

  const getAvailabilityText = (member: Staff) => {
    const config = getStatusConfig(member.status);
    if (member.status === 'available_later' && member.next_available_time) {
      const time = new Date(member.next_available_time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
      return `Available at ${time}`;
    }
    return config.label;
  };

  const handleSelectStaff = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    if (!staffMember) return;

    // If staff-first flow, store preferred staff and go to services
    if (bookingFlowType === 'staff-first') {
      setPreferredStaff(staffId);
      navigate('/services');
      return;
    }

    // Service-first flow: check if multiple services
    if (cart.length > 1) {
      setSelectedStaffMember(staffMember);
      setShowDecisionDialog(true);
    } else {
      // Single service: assign and go to time
      updateCartItemStaff(cart[0].service.id, staffId);
      navigate('/time');
    }
  };

  const handleAssignToAll = () => {
    if (!selectedStaffMember) return;
    cart.forEach(item => {
      updateCartItemStaff(item.service.id, selectedStaffMember.id);
    });
    setShowDecisionDialog(false);
    navigate('/time');
  };

  const handleDifferentTechnicians = () => {
    if (!selectedStaffMember) return;
    // Assign selected staff to first service
    updateCartItemStaff(cart[0].service.id, selectedStaffMember.id);
    setShowDecisionDialog(false);
    navigate('/staff-assignment');
  };

  const handleNoPreference = () => {
    cart.forEach(item => {
      updateCartItemStaff(item.service.id, undefined);
    });
    navigate('/time');
  };

  const handleViewSchedule = (e: React.MouseEvent, staffMember: Staff) => {
    e.stopPropagation();
    setScheduleStaff(staffMember);
    setScheduleModalOpen(true);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">💅</div>
          <p className="text-muted-foreground">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingHeader />

      <main className="flex-1 pb-24">
        <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
          
          {/* Selected Services Section with Cart */}
          {cart.length > 0 && (
            <div className="bg-card border rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Selected Services</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 relative h-9 w-9 p-0"
                  onClick={() => setCartOpen(true)}
                >
                  <ShoppingBag className="h-4 w-4" />
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
              <div className="flex flex-wrap gap-2">
                {cart.map((item) => (
                  <Badge 
                    key={item.service.id} 
                    variant="default"
                    className="text-xs px-3 py-1"
                  >
                    {item.service.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Staff Selection Section */}
          <div className="space-y-4">
            <div>
              <h1 className="text-lg font-bold mb-1">Choose Your Technician</h1>
              <p className="text-xs text-muted-foreground">
                Choose who you'd like to perform your service
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                type="search"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/30 border-muted-foreground/20 focus-visible:bg-background"
              />
            </div>

            {/* Choose Multiple Staff Option - Only for multiple services */}
            {cart.length > 1 && (
              <Card
                className="p-4 cursor-pointer hover:border-primary transition-colors bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 rounded-2xl"
                onClick={() => navigate('/staff-assignment')}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">Choose Multiple Staff</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Select a different technician for each service
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* No Preference Option */}
            <Card
              onClick={handleNoPreference}
              className="p-4 cursor-pointer hover:shadow-md transition-all rounded-2xl bg-card border"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 text-4xl leading-none">
                  🎲
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">No Preference</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    First available technician
                  </p>
                </div>
              </div>
            </Card>

            {/* Staff Grid */}
            <div className="space-y-3">
              {filteredStaff.map((member) => {
                const statusConfig = getStatusConfig(member.status);
                return (
                  <Card
                    key={member.id}
                    onClick={() => handleSelectStaff(member.id)}
                    className="p-4 transition-all cursor-pointer hover:shadow-md rounded-2xl bg-card border"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar - Use photo if available, fallback to emoji */}
                      <div className="flex-shrink-0">
                        {member.photo_url ? (
                          <img
                            src={member.photo_url}
                            alt={`${member.first_name} ${member.last_name}`}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const emojiDiv = e.currentTarget.nextElementSibling;
                              if (emojiDiv) emojiDiv.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`text-4xl leading-none ${member.photo_url ? 'hidden' : ''}`}>
                          {member.avatar_emoji}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base">
                          {member.first_name}
                        </h3>
                        
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                          <span className="text-sm text-muted-foreground">
                            {getAvailabilityText(member)}
                          </span>
                        </div>
                      </div>

                      {/* Desktop Schedule Display */}
                      <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground border-l pl-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium w-12">Today:</span>
                            <span>9:00 AM - 7:00 PM</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium w-12">Sat:</span>
                            <span>10:00 AM - 6:00 PM</span>
                          </div>
                        </div>
                      </div>

                      {/* Mobile: View Schedule Link */}
                      <button
                        onClick={(e) => handleViewSchedule(e, member)}
                        className="flex lg:hidden items-center gap-1.5 text-sm text-cyan-500 hover:text-cyan-600 transition-colors flex-shrink-0"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>View Schedule</span>
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {filteredStaff.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No staff found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <BookingFooter hideNext />
      
      {/* Cart Sheet */}
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
      
      {/* Staff Schedule Modal */}
      <StaffScheduleModal 
        staff={scheduleStaff}
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
      />

      {/* Multi-Staff Decision Dialog */}
      <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Technician</DialogTitle>
            <DialogDescription>
              You have selected {selectedStaffMember?.first_name} {selectedStaffMember?.last_name}. 
              Would you like them to perform all your services?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <Button
              variant="default"
              className="w-full justify-start h-auto p-4"
              onClick={handleAssignToAll}
            >
              <div className="text-left">
                <div className="font-semibold">
                  Yes, assign {selectedStaffMember?.first_name} to all services
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  All {cart.length} services will be performed by the same technician
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={handleDifferentTechnicians}
            >
              <div className="text-left">
                <div className="font-semibold">I want different technicians</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Choose a technician for each service individually
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
