import { useState, useEffect } from 'react';
import { BookingHeader } from '@/components/layout/BookingHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="booking-flow">Booking Flow</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
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

            <Card>
              <CardHeader>
                <CardTitle>Multiple Services</CardTitle>
                <CardDescription>Configure multiple service booking options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow-multiple">Allow Multiple Services in One Booking</Label>
                  <Switch
                    id="allow-multiple"
                    checked={config.multipleServices.allowMultipleServices}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        multipleServices: { ...config.multipleServices, allowMultipleServices: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="same-staff">Same Staff Required for All Services</Label>
                  <Switch
                    id="same-staff"
                    checked={config.multipleServices.requireSameStaff}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        multipleServices: { ...config.multipleServices, requireSameStaff: checked },
                      })
                    }
                  />
                </div>
                <div className="space-y-3">
                  <Label>Service Execution Order</Label>
                  <RadioGroup
                    value={config.multipleServices.serviceExecutionOrder}
                    onValueChange={(value: 'sequential' | 'parallel') =>
                      setConfig({
                        ...config,
                        multipleServices: { ...config.multipleServices, serviceExecutionOrder: value },
                      })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sequential" id="sequential" />
                      <Label htmlFor="sequential" className="font-normal">Sequential (one after another)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="parallel" id="parallel" />
                      <Label htmlFor="parallel" className="font-normal">Parallel (at the same time)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>Configure when and what customer info to collect</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>When to Collect Customer Information</Label>
                  <RadioGroup
                    value={config.customerInfo.collectionTiming}
                    onValueChange={(value: 'start' | 'after_services' | 'confirmation') =>
                      setConfig({
                        ...config,
                        customerInfo: { ...config.customerInfo, collectionTiming: value },
                      })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="start" id="start" />
                      <Label htmlFor="start" className="font-normal">At Start of Booking</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="after_services" id="after_services" />
                      <Label htmlFor="after_services" className="font-normal">After Service Selection</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="confirmation" id="confirmation" />
                      <Label htmlFor="confirmation" className="font-normal">At Confirmation Step</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label>Required Fields</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="first-name"
                        checked={config.customerInfo.requiredFields.firstName}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            customerInfo: {
                              ...config.customerInfo,
                              requiredFields: { ...config.customerInfo.requiredFields, firstName: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="first-name" className="font-normal">First Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="last-name"
                        checked={config.customerInfo.requiredFields.lastName}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            customerInfo: {
                              ...config.customerInfo,
                              requiredFields: { ...config.customerInfo.requiredFields, lastName: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="last-name" className="font-normal">Last Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="phone"
                        checked={config.customerInfo.requiredFields.phone}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            customerInfo: {
                              ...config.customerInfo,
                              requiredFields: { ...config.customerInfo.requiredFields, phone: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="phone" className="font-normal">Phone</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="email"
                        checked={config.customerInfo.requiredFields.email}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            customerInfo: {
                              ...config.customerInfo,
                              requiredFields: { ...config.customerInfo.requiredFields, email: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="email" className="font-normal">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="birthday"
                        checked={config.customerInfo.requiredFields.birthday}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            customerInfo: {
                              ...config.customerInfo,
                              requiredFields: { ...config.customerInfo.requiredFields, birthday: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="birthday" className="font-normal">Birthday</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notes"
                        checked={config.customerInfo.requiredFields.notes}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            customerInfo: {
                              ...config.customerInfo,
                              requiredFields: { ...config.customerInfo.requiredFields, notes: !!checked },
                            },
                          })
                        }
                      />
                      <Label htmlFor="notes" className="font-normal">Notes/Preferences</Label>
                    </div>
                  </div>
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
                    <div className="space-y-3">
                      <Label>Deposit Type</Label>
                      <RadioGroup
                        value={config.deposits.depositType}
                        onValueChange={(value: 'percentage' | 'fixed') =>
                          setConfig({
                            ...config,
                            deposits: { ...config.deposits, depositType: value },
                          })
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="percentage" id="deposit-percentage-type" />
                          <Label htmlFor="deposit-percentage-type" className="font-normal">Percentage of Total</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fixed" id="deposit-fixed-type" />
                          <Label htmlFor="deposit-fixed-type" className="font-normal">Fixed Amount</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {config.deposits.depositType === 'fixed' && (
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
                    )}
                    {config.deposits.depositType === 'percentage' && (
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
                    )}
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="paypal">PayPal</Label>
                  <Switch
                    id="paypal"
                    checked={config.payments.acceptPayPal}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        payments: { ...config.payments, acceptPayPal: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="apple-pay">Apple Pay</Label>
                  <Switch
                    id="apple-pay"
                    checked={config.payments.acceptApplePay}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        payments: { ...config.payments, acceptApplePay: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="google-pay">Google Pay</Label>
                  <Switch
                    id="google-pay"
                    checked={config.payments.acceptGooglePay}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        payments: { ...config.payments, acceptGooglePay: checked },
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
                  <>
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
                    <div className="space-y-3">
                      <Label>Reminder Delivery Methods</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="sms-reminder"
                            checked={config.notifications.deliveryMethods.sms}
                            onCheckedChange={(checked) =>
                              setConfig({
                                ...config,
                                notifications: {
                                  ...config.notifications,
                                  deliveryMethods: { ...config.notifications.deliveryMethods, sms: !!checked },
                                },
                              })
                            }
                          />
                          <Label htmlFor="sms-reminder" className="font-normal">SMS</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="email-reminder"
                            checked={config.notifications.deliveryMethods.email}
                            onCheckedChange={(checked) =>
                              setConfig({
                                ...config,
                                notifications: {
                                  ...config.notifications,
                                  deliveryMethods: { ...config.notifications.deliveryMethods, email: !!checked },
                                },
                              })
                            }
                          />
                          <Label htmlFor="email-reminder" className="font-normal">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="push-reminder"
                            checked={config.notifications.deliveryMethods.push}
                            onCheckedChange={(checked) =>
                              setConfig({
                                ...config,
                                notifications: {
                                  ...config.notifications,
                                  deliveryMethods: { ...config.notifications.deliveryMethods, push: !!checked },
                                },
                              })
                            }
                          />
                          <Label htmlFor="push-reminder" className="font-normal">Push Notification</Label>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between">
                  <Label htmlFor="follow-up">Send Follow-Up</Label>
                  <Switch
                    id="follow-up"
                    checked={config.notifications.sendFollowUp}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        notifications: { ...config.notifications, sendFollowUp: checked },
                      })
                    }
                  />
                </div>
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
                    <div className="space-y-3">
                      <Label>Refund Policy</Label>
                      <RadioGroup
                        value={config.cancellationPolicy.refundPolicy}
                        onValueChange={(value: 'full' | 'partial' | 'none') =>
                          setConfig({
                            ...config,
                            cancellationPolicy: { ...config.cancellationPolicy, refundPolicy: value },
                          })
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="full" id="refund-full" />
                          <Label htmlFor="refund-full" className="font-normal">Full Refund</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="partial" id="refund-partial" />
                          <Label htmlFor="refund-partial" className="font-normal">Partial Refund</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="none" id="refund-none" />
                          <Label htmlFor="refund-none" className="font-normal">No Refund</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {config.cancellationPolicy.refundPolicy === 'partial' && (
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
                    )}
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

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rescheduling Policy</CardTitle>
                <CardDescription>Configure appointment rescheduling options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allow-reschedule">Allow Rescheduling</Label>
                  <Switch
                    id="allow-reschedule"
                    checked={config.rescheduling.allowRescheduling}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        rescheduling: { ...config.rescheduling, allowRescheduling: checked },
                      })
                    }
                  />
                </div>
                {config.rescheduling.allowRescheduling && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="reschedule-deadline">Reschedule Deadline (hours)</Label>
                      <Input
                        id="reschedule-deadline"
                        type="number"
                        value={config.rescheduling.rescheduleDeadlineHours}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            rescheduling: { ...config.rescheduling, rescheduleDeadlineHours: parseInt(e.target.value) },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-reschedules">Max Reschedules Allowed</Label>
                      <Input
                        id="max-reschedules"
                        type="number"
                        value={config.rescheduling.maxReschedules}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            rescheduling: { ...config.rescheduling, maxReschedules: parseInt(e.target.value) },
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
                <CardTitle>No-Show Policy</CardTitle>
                <CardDescription>Configure no-show fee settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="charge-no-show">Charge No-Show Fee</Label>
                  <Switch
                    id="charge-no-show"
                    checked={config.noShow.chargeNoShowFee}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        noShow: { ...config.noShow, chargeNoShowFee: checked },
                      })
                    }
                  />
                </div>
                {config.noShow.chargeNoShowFee && (
                  <>
                    <div className="space-y-3">
                      <Label>No-Show Fee Type</Label>
                      <RadioGroup
                        value={config.noShow.noShowFeeType}
                        onValueChange={(value: 'fixed' | 'percentage') =>
                          setConfig({
                            ...config,
                            noShow: { ...config.noShow, noShowFeeType: value },
                          })
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fixed" id="no-show-fixed" />
                          <Label htmlFor="no-show-fixed" className="font-normal">Fixed Amount</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="percentage" id="no-show-percentage" />
                          <Label htmlFor="no-show-percentage" className="font-normal">Percentage of Total</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="no-show-amount">
                        {config.noShow.noShowFeeType === 'fixed' ? 'No-Show Fee Amount ($)' : 'No-Show Fee Percentage (%)'}
                      </Label>
                      <Input
                        id="no-show-amount"
                        type="number"
                        value={config.noShow.noShowFeeAmount}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            noShow: { ...config.noShow, noShowFeeAmount: parseFloat(e.target.value) },
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
                <CardTitle>Waiting List</CardTitle>
                <CardDescription>Configure waiting list functionality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-waiting-list">Enable Waiting List</Label>
                  <Switch
                    id="enable-waiting-list"
                    checked={config.waitingList.enableWaitingList}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        waitingList: { ...config.waitingList, enableWaitingList: checked },
                      })
                    }
                  />
                </div>
                {config.waitingList.enableWaitingList && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-notify">Auto-Notify When Available</Label>
                      <Switch
                        id="auto-notify"
                        checked={config.waitingList.autoNotifyWhenAvailable}
                        onCheckedChange={(checked) =>
                          setConfig({
                            ...config,
                            waitingList: { ...config.waitingList, autoNotifyWhenAvailable: checked },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-waiting">Max Waiting List Size</Label>
                      <Input
                        id="max-waiting"
                        type="number"
                        value={config.waitingList.maxWaitingListSize}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            waitingList: { ...config.waitingList, maxWaitingListSize: parseInt(e.target.value) },
                          })
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BookingConfiguration;
