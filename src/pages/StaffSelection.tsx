import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    // If staff-first flow, store preferred staff and go to services
    if (bookingFlowType === 'staff-first') {
      setPreferredStaff(staffId);
      navigate('/services');
    } else {
      // Service-first flow: assign same staff to all services in cart
      cart.forEach(item => {
        updateCartItemStaff(item.service.id, staffId);
      });
      navigate('/time');
    }
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
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="text-5xl">{member.avatar_emoji}</div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {member.first_name} {member.last_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                        <span className="text-sm text-muted-foreground">
                          {getAvailabilityText(member)}
                        </span>
                      </div>
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
    </div>
  );
}
