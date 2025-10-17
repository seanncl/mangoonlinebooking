import { useState, useEffect } from 'react';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { mockBookingConfig, BookingConfig } from '@/data/mockBookingConfig';
import { Save } from 'lucide-react';

const BookingConfiguration = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<BookingConfig>(mockBookingConfig);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem('salonBookingConfig');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('salonBookingConfig', JSON.stringify(config));
      toast({
        title: 'Success',
        description: 'Booking configuration saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <BookingHeader title="Booking Configuration" showProfile={true} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Booking Configuration</h1>
            <p className="text-muted-foreground">Customize your salon's booking settings</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <Tabs defaultValue="booking-flow" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="booking-flow">Booking Flow</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="booking-flow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booking Flow Settings</CardTitle>
                <CardDescription>Configure the customer booking experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="location-selection">Enable Location Selection</Label>
                  <Switch
                    id="location-selection"
                    checked={config.bookingFlow.enableLocationSelection}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        bookingFlow: { ...config.bookingFlow, enableLocationSelection: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="flow-type">Enable Flow Type Selection</Label>
                  <Switch
                    id="flow-type"
                    checked={config.bookingFlow.enableFlowTypeSelection}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        bookingFlow: { ...config.bookingFlow, enableFlowTypeSelection: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="staff-required">Require Staff Selection</Label>
                  <Switch
                    id="staff-required"
                    checked={config.bookingFlow.requireStaffSelection}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        bookingFlow: { ...config.bookingFlow, requireStaffSelection: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-assign">Allow Staff Auto-Assignment</Label>
                  <Switch
                    id="auto-assign"
                    checked={config.bookingFlow.allowStaffAutoAssignment}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        bookingFlow: { ...config.bookingFlow, allowStaffAutoAssignment: checked },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Availability Settings</CardTitle>
                <CardDescription>Configure booking time windows</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lead-time">Booking Lead Time (hours)</Label>
                  <Input
                    id="lead-time"
                    type="number"
                    value={config.availability.bookingLeadTimeHours}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        availability: { ...config.availability, bookingLeadTimeHours: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-advance">Max Advance Booking (days)</Label>
                  <Input
                    id="max-advance"
                    type="number"
                    value={config.availability.maxAdvanceBookingDays}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        availability: { ...config.availability, maxAdvanceBookingDays: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buffer">Buffer Between Appointments (minutes)</Label>
                  <Input
                    id="buffer"
                    type="number"
                    value={config.availability.bufferBetweenAppointmentsMinutes}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        availability: { ...config.availability, bufferBetweenAppointmentsMinutes: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deposit Settings</CardTitle>
                <CardDescription>Configure deposit requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="require-deposit">Require Deposit</Label>
                  <Switch
                    id="require-deposit"
                    checked={config.deposits.requireDeposit}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        deposits: { ...config.deposits, requireDeposit: checked },
                      })
                    }
                  />
                </div>
                {config.deposits.requireDeposit && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="deposit-amount">Deposit Amount ($)</Label>
                      <Input
                        id="deposit-amount"
                        type="number"
                        value={config.deposits.depositAmount}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            deposits: { ...config.deposits, depositAmount: parseFloat(e.target.value) },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deposit-percentage">Deposit Percentage (%)</Label>
                      <Input
                        id="deposit-percentage"
                        type="number"
                        value={config.deposits.depositPercentage}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            deposits: { ...config.deposits, depositPercentage: parseFloat(e.target.value) },
                          })
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Select accepted payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="credit-card">Credit Card</Label>
                  <Switch
                    id="credit-card"
                    checked={config.payments.acceptCreditCard}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        payments: { ...config.payments, acceptCreditCard: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="debit-card">Debit Card</Label>
                  <Switch
                    id="debit-card"
                    checked={config.payments.acceptDebitCard}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        payments: { ...config.payments, acceptDebitCard: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="cash">Cash</Label>
                  <Switch
                    id="cash"
                    checked={config.payments.acceptCash}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        payments: { ...config.payments, acceptCash: checked },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="authentication" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Settings</CardTitle>
                <CardDescription>Configure customer authentication requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="require-login">Require Login</Label>
                  <Switch
                    id="require-login"
                    checked={config.authentication.requireLogin}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        authentication: { ...config.authentication, requireLogin: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="guest-checkout">Allow Guest Checkout</Label>
                  <Switch
                    id="guest-checkout"
                    checked={config.authentication.allowGuestCheckout}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        authentication: { ...config.authentication, allowGuestCheckout: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="phone-verification">Require Phone Verification</Label>
                  <Switch
                    id="phone-verification"
                    checked={config.authentication.requirePhoneVerification}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        authentication: { ...config.authentication, requirePhoneVerification: checked },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure customer notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confirmation">Send Booking Confirmation</Label>
                  <Switch
                    id="confirmation"
                    checked={config.notifications.sendBookingConfirmation}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        notifications: { ...config.notifications, sendBookingConfirmation: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="reminders">Send Reminders</Label>
                  <Switch
                    id="reminders"
                    checked={config.notifications.sendReminders}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        notifications: { ...config.notifications, sendReminders: checked },
                      })
                    }
                  />
                </div>
                {config.notifications.sendReminders && (
                  <div className="space-y-2">
                    <Label htmlFor="reminder-hours">Reminder Hours Before</Label>
                    <Input
                      id="reminder-hours"
                      type="number"
                      value={config.notifications.reminderHoursBefore}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          notifications: { ...config.notifications, reminderHoursBefore: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cancellation Policy</CardTitle>
                <CardDescription>Configure cancellation and refund policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow-cancel">Allow Cancellation</Label>
                  <Switch
                    id="allow-cancel"
                    checked={config.cancellationPolicy.allowCancellation}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        cancellationPolicy: { ...config.cancellationPolicy, allowCancellation: checked },
                      })
                    }
                  />
                </div>
                {config.cancellationPolicy.allowCancellation && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="cancel-deadline">Cancellation Deadline (hours)</Label>
                      <Input
                        id="cancel-deadline"
                        type="number"
                        value={config.cancellationPolicy.cancellationDeadlineHours}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            cancellationPolicy: { ...config.cancellationPolicy, cancellationDeadlineHours: parseInt(e.target.value) },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="refund-percentage">Refund Percentage (%)</Label>
                      <Input
                        id="refund-percentage"
                        type="number"
                        value={config.cancellationPolicy.refundPercentage}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            cancellationPolicy: { ...config.cancellationPolicy, refundPercentage: parseFloat(e.target.value) },
                          })
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy Texts</CardTitle>
                <CardDescription>Customize policy text shown to customers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="terms">Terms and Conditions</Label>
                  <Textarea
                    id="terms"
                    value={config.policies.termsAndConditions}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        policies: { ...config.policies, termsAndConditions: e.target.value },
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="privacy">Privacy Policy</Label>
                  <Textarea
                    id="privacy"
                    value={config.policies.privacyPolicy}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        policies: { ...config.policies, privacyPolicy: e.target.value },
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="late-fee">Late Fee Policy</Label>
                  <Textarea
                    id="late-fee"
                    value={config.policies.lateFeePolicy}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        policies: { ...config.policies, lateFeePolicy: e.target.value },
                      })
                    }
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BookingConfiguration;
