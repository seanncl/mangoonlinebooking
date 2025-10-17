import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockUsers } from '@/data/mockUsers';

interface User {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'customer' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string, customerData: Partial<User>) => Promise<void>;
  signup: (userData: Omit<User, 'id' | 'role'> & { password: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<Omit<User, 'id' | 'role'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('mockUser');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Find user in mock database
    const foundUser = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!foundUser) {
      throw new Error('Invalid email or password');
    }

    const { password: _, ...userWithoutPassword } = foundUser;
    setUser(userWithoutPassword);
    localStorage.setItem('mockUser', JSON.stringify(userWithoutPassword));
  };

  const loginWithPhone = async (phone: string, customerData: Partial<User>) => {
    // Create authenticated user from phone verification
    const mockUser: User = {
      id: customerData.id || 'mock-user-' + Date.now(),
      phone,
      firstName: customerData.firstName || '',
      lastName: customerData.lastName || '',
      email: customerData.email,
      role: 'customer'
    };
    
    setUser(mockUser);
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
  };

  const signup = async (userData: Omit<User, 'id' | 'role'> & { password: string }) => {
    // Mock signup - always assign customer role
    const { password, ...userDataWithoutPassword } = userData;
    const mockUser: User = {
      id: 'mock-user-' + Date.now(),
      ...userDataWithoutPassword,
      role: 'customer'
    };
    
    setUser(mockUser);
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
  };

  const logout = () => {
    // TODO: Replace with actual POS API logout call
    // Example: await fetch('/api/auth/logout', { method: 'POST' });
    
    setUser(null);
    localStorage.removeItem('mockUser');
  };

  const updateProfile = async (userData: Partial<Omit<User, 'id' | 'role'>>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('mockUser', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        loginWithPhone,
        signup,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
