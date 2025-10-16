import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useBooking } from '@/context/BookingContext';
import { bookingAPI } from '@/services/booking-api';
import { Location } from '@/types/booking';
import locationDowntownImg from '@/assets/location-downtown.jpg';
import locationBeverlyImg from '@/assets/location-beverly.jpg';

export default function LocationSelection() {
  const navigate = useNavigate();
  const { setSelectedLocation } = useBooking();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, []);

  // 🧪 TEMPORARY TEST - Verify Mock Booking API Works
  useEffect(() => {
    console.log('🧪 Testing Mock Booking API...');
    bookingAPI.getLocations()
      .then(response => {
        if (response.success && response.data) {
          console.log('✅ Mock API Success:', response.data.length, 'locations loaded');
          console.log('📍 First location:', response.data[0]?.name);
        }
      })
      .catch(error => {
        console.error('❌ Mock API Failed:', error);
      });
  }, []);

  const loadLocations = async () => {
    try {
      const response = await bookingAPI.getLocations();
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load locations');
      }

      setLocations(response.data);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (location: Location) => {
    setSelectedLocation(location);
    navigate('/booking-flow');
  };

  const getLocationImage = (locationName: string) => {
    if (locationName.includes('Downtown')) return locationDowntownImg;
    if (locationName.includes('Beverly')) return locationBeverlyImg;
    return locationDowntownImg;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">💅</div>
          <p className="text-muted-foreground">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="py-8 px-4 text-center border-b bg-background/80 backdrop-blur">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-4xl">💅</span>
          <h1 className="text-3xl font-bold text-accent">Mango Nail Spa</h1>
        </div>
        <p className="text-muted-foreground">Your beauty destination</p>
      </header>

      {/* Content */}
      <main className="container max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-12">Choose Location</h2>

        <div className="space-y-8">
          {locations.map((location) => (
            <Card
              key={location.id}
              className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50"
            >
              {/* Hero Image */}
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={getLocationImage(location.name)}
                  alt={location.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-bold">{location.name}</h3>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {location.address}, {location.city}, {location.state} {location.zip_code}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{location.phone}</span>
                  </div>

                  <div className="flex items-start gap-3 text-sm">
                    <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-muted-foreground">
                      <div>{location.hours_weekday}</div>
                      <div>{location.hours_weekend}</div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleSelectLocation(location)}
                  className="w-full h-12 text-base bg-primary hover:bg-primary-hover"
                  size="lg"
                >
                  Book Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
