import React, { createContext, useContext, useState, useEffect } from 'react';
import { BookingState, Location, CartService, Customer } from '@/types/booking';

interface BookingContextType extends BookingState {
  setSelectedLocation: (location: Location | undefined) => void;
  addToCart: (item: CartService) => void;
  removeFromCart: (serviceId: string) => void;
  updateCartItemStaff: (serviceId: string, staffId: string | undefined) => void;
  clearCart: () => void;
  setSelectedDate: (date: Date | undefined) => void;
  setSelectedTime: (time: string | undefined) => void;
  setStartAllSameTime: (value: boolean) => void;
  setServiceOrder: (order: string[]) => void;
  setCustomer: (customer: Customer | undefined) => void;
  setPhoneVerified: (verified: boolean) => void;
  resetBooking: () => void;
  cartTotal: number;
  cartCount: number;
  depositAmount: number;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const STORAGE_KEY = 'mango-booking-state';

const initialState: BookingState = {
  cart: [],
  startAllSameTime: true,
  serviceOrder: [],
  phoneVerified: false,
};

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BookingState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          selectedDate: parsed.selectedDate ? new Date(parsed.selectedDate) : undefined,
        };
      } catch {
        return initialState;
      }
    }
    return initialState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const setSelectedLocation = (location: Location | undefined) => {
    setState(prev => ({ ...prev, selectedLocation: location, cart: [] }));
  };

  const addToCart = (item: CartService) => {
    setState(prev => ({
      ...prev,
      cart: [...prev.cart, item],
      serviceOrder: [...prev.serviceOrder, item.service.id],
    }));
  };

  const removeFromCart = (serviceId: string) => {
    setState(prev => ({
      ...prev,
      cart: prev.cart.filter(item => item.service.id !== serviceId),
      serviceOrder: prev.serviceOrder.filter(id => id !== serviceId),
    }));
  };

  const updateCartItemStaff = (serviceId: string, staffId: string | undefined) => {
    setState(prev => ({
      ...prev,
      cart: prev.cart.map(item =>
        item.service.id === serviceId ? { ...item, staffId } : item
      ),
    }));
  };

  const clearCart = () => {
    setState(prev => ({ ...prev, cart: [], serviceOrder: [] }));
  };

  const setSelectedDate = (date: Date | undefined) => {
    setState(prev => ({ ...prev, selectedDate: date }));
  };

  const setSelectedTime = (time: string | undefined) => {
    setState(prev => ({ ...prev, selectedTime: time }));
  };

  const setStartAllSameTime = (value: boolean) => {
    setState(prev => ({ ...prev, startAllSameTime: value }));
  };

  const setServiceOrder = (order: string[]) => {
    setState(prev => ({ ...prev, serviceOrder: order }));
  };

  const setCustomer = (customer: Customer | undefined) => {
    setState(prev => ({ ...prev, customer }));
  };

  const setPhoneVerified = (verified: boolean) => {
    setState(prev => ({ ...prev, phoneVerified: verified }));
  };

  const resetBooking = () => {
    setState(initialState);
    localStorage.removeItem(STORAGE_KEY);
  };

  const cartTotal = state.cart.reduce((total, item) => {
    const servicePrice = item.service.price_card;
    const addOnsTotal = item.addOns.reduce((sum, addOn) => {
      const discountedPrice = addOn.price_card - addOn.discount_when_bundled;
      return sum + discountedPrice;
    }, 0);
    return total + servicePrice + addOnsTotal;
  }, 0);

  const cartCount = state.cart.length;

  const depositAmount = state.selectedLocation?.has_deposit_policy
    ? (cartTotal * (state.selectedLocation.deposit_percentage / 100))
    : 0;

  return (
    <BookingContext.Provider
      value={{
        ...state,
        setSelectedLocation,
        addToCart,
        removeFromCart,
        updateCartItemStaff,
        clearCart,
        setSelectedDate,
        setSelectedTime,
        setStartAllSameTime,
        setServiceOrder,
        setCustomer,
        setPhoneVerified,
        resetBooking,
        cartTotal,
        cartCount,
        depositAmount,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
};
