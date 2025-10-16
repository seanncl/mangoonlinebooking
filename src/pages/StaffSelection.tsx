import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { BookingFooter } from '@/components/layout/BookingFooter';
import { useBooking } from '@/context/BookingContext';
import { supabase } from '@/integrations/supabase/client';
import { Staff } from '@/types/booking';
import { toast } from 'sonner';

export default function StaffSelection() {
  const navigate = useNavigate();
  const { selectedLocation, cart, updateCartItemStaff, bookingFlowType, setPreferredStaff } = useBooking();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [selectedStaffMember, setSelectedStaffMember] = useState<Staff | null>(null);

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
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('location_id', selectedLocation.id)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setStaff(data || []);
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
    <div className="min-h-screen flex flex-col">
      <BookingHeader />

      <main className="flex-1 pb-24">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Choose Your Technician</h1>
            <p className="text-muted-foreground">
              Choose who you'd like to perform your service
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Staff Grid */}
          <div className="space-y-3 mb-6">
            {filteredStaff.map((member) => {
              const statusConfig = getStatusConfig(member.status);
              return (
                <Card
                  key={member.id}
                  onClick={() => handleSelectStaff(member.id)}
                  className="p-4 transition-all cursor-pointer hover:shadow-md hover:border-primary/50"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar - Use photo if available, fallback to emoji */}
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={`${member.first_name} ${member.last_name}`}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const emojiDiv = e.currentTarget.nextElementSibling;
                          if (emojiDiv) emojiDiv.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`text-5xl flex-shrink-0 ${member.photo_url ? 'hidden' : ''}`}>
                      {member.avatar_emoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">
                        {member.first_name} {member.last_name}
                      </h3>
                      
                      {member.bio && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {member.bio}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                        <span className="text-sm text-muted-foreground">
                          {getAvailabilityText(member)}
                        </span>
                      </div>
                      
                      {member.specialties && member.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {member.specialties.slice(0, 3).map((specialty, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* View Schedule Link */}
                    <Button variant="ghost" size="sm" className="gap-2 text-primary">
                      <Calendar className="h-4 w-4" />
                      View Schedule
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* No Preference Option */}
          <Card
            onClick={handleNoPreference}
            className="p-4 border-2 border-dashed cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
          >
            <div className="text-center py-2">
              <h3 className="font-semibold text-lg mb-1">No Preference</h3>
              <p className="text-sm text-muted-foreground">
                We'll match you with the first available technician
              </p>
            </div>
          </Card>

          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No staff found matching your search.</p>
            </div>
          )}
        </div>
      </main>

      <BookingFooter hideNext />

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
