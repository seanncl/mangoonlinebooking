import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBooking } from '@/context/BookingContext';
import { UserProfileButton } from '@/components/layout/UserProfileButton';

export default function BookingFlowSelection() {
  const navigate = useNavigate();
  const { setBookingFlowType, selectedLocation } = useBooking();

  const handleSelectFlow = (flowType: 'service-first' | 'staff-first') => {
    setBookingFlowType(flowType);
    if (flowType === 'service-first') {
      navigate('/services');
    } else {
      navigate('/staff');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="py-6 px-4 border-b bg-background/80 backdrop-blur">
        <div className="container max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{selectedLocation?.name}</h1>
                <p className="text-sm text-muted-foreground">Choose your booking preference</p>
              </div>
            </div>
            <UserProfileButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="container max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              How would you like to book?
            </h2>
            <p className="text-muted-foreground text-lg">
              Choose your preferred booking method
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Service First Card */}
            <Card
              onClick={() => handleSelectFlow('service-first')}
              className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-2 hover:border-primary/50 bg-gradient-to-br from-background to-primary/5"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Pick a Service</h3>
                  <p className="text-muted-foreground">
                    Browse our services and we'll match you with available staff
                  </p>
                </div>
                <Button 
                  size="lg" 
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectFlow('service-first');
                  }}
                >
                  Choose Services
                </Button>
              </div>
            </Card>

            {/* Staff First Card */}
            <Card
              onClick={() => handleSelectFlow('staff-first')}
              className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-2 hover:border-accent/50 bg-gradient-to-br from-background to-accent/5"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                  <Users className="h-10 w-10 text-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Pick a Staff Member</h3>
                  <p className="text-muted-foreground">
                    Choose your favorite staff member and see their available services
                  </p>
                </div>
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectFlow('staff-first');
                  }}
                >
                  Choose Staff Member
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
