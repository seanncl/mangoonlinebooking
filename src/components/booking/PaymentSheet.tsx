import { useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

interface PaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  depositAmount: number;
  paymentDetails: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardholderName: string;
  };
  paymentErrors: {
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    cardholderName?: string;
  };
  saveCard: boolean;
  onPaymentDetailsChange: (details: any) => void;
  onPaymentErrorsChange: (errors: any) => void;
  onSaveCardChange: (checked: boolean) => void;
  onConfirm: () => void;
}

export function PaymentSheet({
  open,
  onOpenChange,
  depositAmount,
  paymentDetails,
  paymentErrors,
  saveCard,
  onPaymentDetailsChange,
  onPaymentErrorsChange,
  onSaveCardChange,
  onConfirm,
}: PaymentSheetProps) {
  const handleInputChange = (field: string, value: string) => {
    onPaymentDetailsChange({
      ...paymentDetails,
      [field]: value,
    });

    // Clear error for this field
    if (paymentErrors[field as keyof typeof paymentErrors]) {
      onPaymentErrorsChange({
        ...paymentErrors,
        [field]: undefined,
      });
    }
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : digits;
  };

  const formatExpiryDate = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add Payment Card
          </SheetTitle>
          <SheetDescription>
            Enter your card details to secure your booking
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Due Now Section */}
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
              Due Now
            </p>
            <p className="text-3xl font-bold text-primary">
              ${depositAmount.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Deposit to confirm your booking
            </p>
          </div>

          <Separator />

          {/* Card Details Form */}
          <div className="space-y-4">
            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={formatCardNumber(paymentDetails.cardNumber)}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '');
                  if (/^\d*$/.test(value) && value.length <= 16) {
                    handleInputChange('cardNumber', value);
                  }
                }}
                maxLength={19}
              />
              {paymentErrors.cardNumber && (
                <p className="text-sm text-destructive">{paymentErrors.cardNumber}</p>
              )}
            </div>

            {/* Expiry and CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={formatExpiryDate(paymentDetails.expiryDate)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 4) {
                      handleInputChange('expiryDate', value);
                    }
                  }}
                  maxLength={5}
                />
                {paymentErrors.expiryDate && (
                  <p className="text-sm text-destructive">{paymentErrors.expiryDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={paymentDetails.cvv}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value) && value.length <= 4) {
                      handleInputChange('cvv', value);
                    }
                  }}
                  maxLength={4}
                  type="password"
                />
                {paymentErrors.cvv && (
                  <p className="text-sm text-destructive">{paymentErrors.cvv}</p>
                )}
              </div>
            </div>

            {/* Cardholder Name */}
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                placeholder="John Doe"
                value={paymentDetails.cardholderName}
                onChange={(e) => handleInputChange('cardholderName', e.target.value)}
              />
              {paymentErrors.cardholderName && (
                <p className="text-sm text-destructive">{paymentErrors.cardholderName}</p>
              )}
            </div>

            {/* Save Card Checkbox */}
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="saveCard"
                checked={saveCard}
                onCheckedChange={(checked) => onSaveCardChange(checked as boolean)}
              />
              <Label
                htmlFor="saveCard"
                className="text-sm font-normal cursor-pointer"
              >
                Save card for future bookings
              </Label>
            </div>
          </div>

          {/* Security Note */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <Lock className="h-4 w-4" />
            <p>Your payment information is encrypted and secure</p>
          </div>

          {/* Confirm Button */}
          <Button
            onClick={onConfirm}
            className="w-full"
            size="lg"
          >
            Confirm Payment Method
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
