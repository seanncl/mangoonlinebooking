import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Calendar, Users, MapPin, BarChart } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const adminMenuItems = [
    {
      title: 'Booking Configuration',
      description: 'Customize booking flow, deposits, and policies',
      icon: Settings,
      route: '/admin/booking-configuration',
      available: true,
    },
    {
      title: 'Manage Locations',
      description: 'Add, edit, or remove salon locations',
      icon: MapPin,
      route: '/admin/locations',
      available: false,
    },
    {
      title: 'Manage Services',
      description: 'Update service catalog and pricing',
      icon: Calendar,
      route: '/admin/services',
      available: false,
    },
    {
      title: 'Staff Management',
      description: 'Manage staff schedules and profiles',
      icon: Users,
      route: '/admin/staff',
      available: false,
    },
    {
      title: 'Reports & Analytics',
      description: 'View booking statistics and revenue',
      icon: BarChart,
      route: '/admin/reports',
      available: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <BookingHeader title="Admin Dashboard" showProfile={true} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Welcome, {user?.firstName}!</h1>
          <p className="text-muted-foreground">Manage your salon's online booking system</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card 
                key={item.route}
                className={!item.available ? 'opacity-50' : 'cursor-pointer hover:border-primary transition-colors'}
                onClick={() => item.available && navigate(item.route)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {item.title}
                    {!item.available && (
                      <span className="text-xs font-normal text-muted-foreground">(Coming Soon)</span>
                    )}
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                {item.available && (
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Open
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
