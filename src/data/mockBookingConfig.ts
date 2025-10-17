export interface BookingConfig {
  bookingFlow: {
    enableLocationSelection: boolean;
    enableFlowTypeSelection: boolean;
    requireStaffSelection: boolean;
    allowStaffAutoAssignment: boolean;
  };
  deposits: {
    requireDeposit: boolean;
    depositType: 'percentage' | 'fixed';
    depositAmount: number;
    depositPercentage: number;
  };
  authentication: {
    requireLogin: boolean;
    allowGuestCheckout: boolean;
    requirePhoneVerification: boolean;
  };
  cancellationPolicy: {
    allowCancellation: boolean;
    cancellationDeadlineHours: number;
    refundPolicy: 'full' | 'partial' | 'none';
    refundPercentage: number;
  };
  payments: {
    acceptCreditCard: boolean;
    acceptDebitCard: boolean;
    acceptCash: boolean;
    acceptPayPal: boolean;
    acceptApplePay: boolean;
    acceptGooglePay: boolean;
  };
  notifications: {
    sendBookingConfirmation: boolean;
    sendReminders: boolean;
    reminderHoursBefore: number;
    sendFollowUp: boolean;
  };
  availability: {
    bookingLeadTimeHours: number;
    maxAdvanceBookingDays: number;
    bufferBetweenAppointmentsMinutes: number;
  };
  policies: {
    termsAndConditions: string;
    privacyPolicy: string;
    lateFeePolicy: string;
  };
}

export const mockBookingConfig: BookingConfig = {
  bookingFlow: {
    enableLocationSelection: true,
    enableFlowTypeSelection: true,
    requireStaffSelection: false,
    allowStaffAutoAssignment: true,
  },
  deposits: {
    requireDeposit: false,
    depositType: 'percentage',
    depositAmount: 25,
    depositPercentage: 20,
  },
  authentication: {
    requireLogin: false,
    allowGuestCheckout: true,
    requirePhoneVerification: false,
  },
  cancellationPolicy: {
    allowCancellation: true,
    cancellationDeadlineHours: 24,
    refundPolicy: 'full',
    refundPercentage: 100,
  },
  payments: {
    acceptCreditCard: true,
    acceptDebitCard: true,
    acceptCash: true,
    acceptPayPal: false,
    acceptApplePay: false,
    acceptGooglePay: false,
  },
  notifications: {
    sendBookingConfirmation: true,
    sendReminders: true,
    reminderHoursBefore: 24,
    sendFollowUp: false,
  },
  availability: {
    bookingLeadTimeHours: 2,
    maxAdvanceBookingDays: 30,
    bufferBetweenAppointmentsMinutes: 15,
  },
  policies: {
    termsAndConditions: 'By booking an appointment, you agree to our terms and conditions.',
    privacyPolicy: 'Your personal information will be kept confidential and used only for booking purposes.',
    lateFeePolicy: 'Customers arriving more than 15 minutes late may need to reschedule.',
  },
};
