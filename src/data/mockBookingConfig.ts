export interface BookingConfig {
  bookingFlow: {
    enableLocationSelection: boolean;
    enableFlowTypeSelection: boolean;
    requireStaffSelection: boolean;
    allowStaffAutoAssignment: boolean;
  };
  multipleServices: {
    allowMultipleServices: boolean;
    requireSameStaff: boolean;
    serviceExecutionOrder: 'sequential' | 'parallel';
  };
  customerInfo: {
    collectionTiming: 'start' | 'after_services' | 'confirmation';
    requiredFields: {
      firstName: boolean;
      lastName: boolean;
      phone: boolean;
      email: boolean;
      birthday: boolean;
      notes: boolean;
    };
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
    deliveryMethods: {
      sms: boolean;
      email: boolean;
      push: boolean;
    };
  };
  availability: {
    bookingLeadTimeHours: number;
    maxAdvanceBookingDays: number;
    bufferBetweenAppointmentsMinutes: number;
  };
  rescheduling: {
    allowRescheduling: boolean;
    rescheduleDeadlineHours: number;
    maxReschedules: number;
  };
  noShow: {
    chargeNoShowFee: boolean;
    noShowFeeType: 'fixed' | 'percentage';
    noShowFeeAmount: number;
  };
  waitingList: {
    enableWaitingList: boolean;
    autoNotifyWhenAvailable: boolean;
    maxWaitingListSize: number;
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
  multipleServices: {
    allowMultipleServices: true,
    requireSameStaff: false,
    serviceExecutionOrder: 'sequential',
  },
  customerInfo: {
    collectionTiming: 'start',
    requiredFields: {
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      birthday: false,
      notes: false,
    },
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
    deliveryMethods: {
      sms: false,
      email: true,
      push: false,
    },
  },
  availability: {
    bookingLeadTimeHours: 2,
    maxAdvanceBookingDays: 30,
    bufferBetweenAppointmentsMinutes: 15,
  },
  rescheduling: {
    allowRescheduling: true,
    rescheduleDeadlineHours: 24,
    maxReschedules: 2,
  },
  noShow: {
    chargeNoShowFee: false,
    noShowFeeType: 'fixed',
    noShowFeeAmount: 25,
  },
  waitingList: {
    enableWaitingList: true,
    autoNotifyWhenAvailable: true,
    maxWaitingListSize: 10,
  },
  policies: {
    termsAndConditions: 'By booking an appointment, you agree to our terms and conditions.',
    privacyPolicy: 'Your personal information will be kept confidential and used only for booking purposes.',
    lateFeePolicy: 'Customers arriving more than 15 minutes late may need to reschedule.',
  },
};
