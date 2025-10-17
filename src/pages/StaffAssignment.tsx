import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Sparkles, ArrowLeft, Clock, User } from 'lucide-react';
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
  const { selectedLocation, cart, updateCartItemStaff, preferredStaffIds } = useBooking();
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

      // Filter to preferred staff if coming from staff-first multi-select flow
      const allStaff = response.data;
      if (preferredStaffIds && preferredStaffIds.length > 1) {
        setStaff(allStaff.filter(s => preferredStaffIds.includes(s.id)));
      } else {
        setStaff(allStaff);
      }
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

  const allServicesAssigned = cart.every(item => item.staffId);
  const assignedCount = cart.filter(item => item.staffId).length;

  const handleContinue = () => {
    if (!allServicesAssigned) {
      toast.error('Please assign a technician to all services');
      return;
    }
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

      <main className="flex-1 pb-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          {/* Back Navigation */}
          <button
            onClick={() => navigate('/staff')}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to staff list
          </button>

          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-3xl font-bold">Assign Technicians</h1>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {assignedCount} of {cart.length} assigned
                </span>
              </div>
            </div>
            <p className="text-muted-foreground">
              Choose your preferred technician for each service or let us assign the best available
            </p>
          </div>

          {/* Services List */}
          <div className="space-y-6">
            {cart.map((item, index) => {
              const assignedStaff = staff.find(s => s.id === item.staffId);
              const isAssigned = !!item.staffId;

              return (
                <Card 
                  key={`${item.service.id}-${index}`} 
                  className={`overflow-hidden transition-all duration-300 ${
                    isAssigned 
                      ? 'border-success/50 bg-success/5' 
                      : 'border-border hover:border-primary/50 hover:shadow-md'
                  }`}
                >
                  {/* Service Number Badge */}
                  <div className={`h-1 w-full ${isAssigned ? 'bg-success' : 'bg-muted'}`} />
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {/* Service Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Step Number */}
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            isAssigned 
                              ? 'bg-success text-success-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-xl mb-1">{item.service.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{item.service.duration_minutes} minutes</span>
                            </div>
                            
                            {/* Add-ons */}
                            {item.addOns.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {item.addOns.map((addOn) => (
                                  <Badge key={addOn.id} variant="secondary" className="text-xs">
                                    + {addOn.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isAssigned && (
                          <Badge className="gap-1 bg-success text-success-foreground border-success animate-fade-in">
                            <Check className="h-3 w-3" />
                            Assigned
                          </Badge>
                        )}
                      </div>

                      {/* Staff Selector */}
                      <div className="ml-14">
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Select Technician
                        </label>
                        <Select
                          value={item.staffId || ''}
                          onValueChange={(value) => updateCartItemStaff(item.service.id, value === 'any-available' ? undefined : value)}
                        >
                          <SelectTrigger className={`w-full h-14 ${
                            isAssigned ? 'border-success/50' : ''
                          }`}>
                            <SelectValue placeholder="Choose a technician...">
                              {assignedStaff && (
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{assignedStaff.avatar_emoji}</span>
                                  <div className="text-left">
                                    <div className="font-medium">
                                      {assignedStaff.first_name} {assignedStaff.last_name}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-background z-[100]">
                            {/* Any Available Option - Featured */}
                            <SelectItem value="any-available" className="bg-primary/5">
                              <div className="flex items-center gap-3 py-2">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-base">Any Available</div>
                                  <div className="text-xs text-muted-foreground">
                                    We will assign the best available technician
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                            
                            {/* Divider */}
                            <div className="px-2 py-1 bg-muted/50">
                              <p className="text-xs text-muted-foreground font-medium">Or choose a specific technician</p>
                            </div>
                            
                            {/* Staff Options */}
                            {staff.map((member) => {
                              const statusConfig = getStatusConfig(member.status);
                              return (
                                <SelectItem key={member.id} value={member.id}>
                                  <div className="flex items-center gap-3 py-2">
                                    <span className="text-3xl">{member.avatar_emoji}</span>
                                    <div className="flex-1">
                                      <div className="font-medium text-base">
                                        {member.first_name} {member.last_name}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                                        <span className="text-xs text-muted-foreground">{statusConfig.label}</span>
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Status Banner */}
          {!allServicesAssigned ? (
            <div className="mt-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">
                    Assignment Required
                  </p>
                  <p className="text-sm text-amber-800">
                    Please select a technician for all services to continue. You can choose specific staff or select "Any Available" for each service.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl animate-fade-in">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900 mb-1">
                    All Services Assigned
                  </p>
                  <p className="text-sm text-green-800">
                    Great! You can now proceed to select your preferred appointment time.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <BookingFooter
        onNext={handleContinue}
        nextLabel={allServicesAssigned ? "Continue to Time Selection" : "Select Technicians to Continue"}
        nextDisabled={!allServicesAssigned}
      />
    </div>
  );
}
