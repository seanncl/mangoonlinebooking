import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { BookingFooter } from '@/components/layout/BookingFooter';
import { useBooking } from '@/context/BookingContext';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { bookingAPI } from '@/services/booking-api';
import { Staff } from '@/types/booking';
import { toast } from 'sonner';

export default function StaffAssignment() {
  const navigate = useNavigate();
  const { selectedLocation, cart, updateCartItemStaff } = useBooking();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedLocation) {
      navigate('/');
      return;
    }
    loadStaff();
  }, [selectedLocation, navigate]);

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

  const handleContinue = () => {
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
          {/* Back to staff list */}
          <button
            onClick={() => navigate('/staff')}
            className="flex items-center gap-2 text-sm text-primary hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to staff list
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Assign Technicians</h1>
            <p className="text-muted-foreground">
              Select a technician for each service
            </p>
          </div>

          <div className="space-y-4">
            {cart.map((item, index) => {
              const assignedStaff = staff.find(s => s.id === item.staffId);
              const isAssigned = !!item.staffId;

              return (
                <Card key={`${item.service.id}-${index}`} className="p-4">
                  <div className="space-y-4">
                    {/* Service Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{item.service.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.service.duration_minutes} minutes
                        </p>
                      </div>
                      {isAssigned ? (
                        <Badge variant="default" className="gap-1 bg-success text-success-foreground">
                          <Check className="h-3 w-3" />
                          Assigned
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <AlertCircle className="h-3 w-3" />
                          Not assigned
                        </Badge>
                      )}
                    </div>

                    {/* Staff Selector */}
                    <Select
                      value={item.staffId || 'any-available'}
                      onValueChange={(value) => updateCartItemStaff(item.service.id, value === 'any-available' ? undefined : value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {assignedStaff ? (
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{assignedStaff.avatar_emoji}</span>
                              <span>
                                {assignedStaff.first_name} {assignedStaff.last_name}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-primary" />
                              <span>Any Available</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {/* Any Available Option */}
                        <SelectItem value="any-available">
                          <div className="flex items-center gap-3 py-1">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <div className="flex-1">
                              <div className="font-medium">Any Available</div>
                              <div className="text-xs text-muted-foreground">
                                We'll assign the best available technician
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                        
                        {staff.map((member) => {
                          const statusConfig = getStatusConfig(member.status);
                          return (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex items-center gap-3 py-1">
                                <span className="text-2xl">{member.avatar_emoji}</span>
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {member.first_name} {member.last_name}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                                    <span>{statusConfig.label}</span>
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {/* Add-ons (if any) */}
                    {item.addOns.length > 0 && (
                      <div className="pl-4 border-l-2 border-muted space-y-1">
                        {item.addOns.map((addOn) => (
                          <p key={addOn.id} className="text-sm text-muted-foreground">
                            + {addOn.name} ({addOn.duration_minutes} min)
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

        </div>
      </main>

      <BookingFooter
        onNext={handleContinue}
        nextLabel="Continue to Time Selection"
      />
    </div>
  );
}
