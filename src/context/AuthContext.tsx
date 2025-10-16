import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: Omit<User, 'id'> & { password: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<Omit<User, 'id'>>) => Promise<void>;
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
    // TODO: Replace with actual POS API authentication call
    // Example: const response = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    
    // Mock login - accept any email/password combination
    const mockUser: User = {
      id: 'mock-user-' + Date.now(),
      email,
      firstName: email.split('@')[0],
      lastName: 'User',
      phone: ''
    };
    
    setUser(mockUser);
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
  };

  const signup = async (userData: Omit<User, 'id'> & { password: string }) => {
    // TODO: Replace with actual POS API registration call
    // Example: const response = await fetch('/api/auth/signup', { method: 'POST', body: JSON.stringify(userData) });
    
    // Mock signup
    const { password, ...userDataWithoutPassword } = userData;
    const mockUser: User = {
      id: 'mock-user-' + Date.now(),
      ...userDataWithoutPassword
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

  const updateProfile = async (userData: Partial<Omit<User, 'id'>>) => {
    // TODO: Replace with actual POS API profile update call
    // Example: const response = await fetch('/api/user/profile', { method: 'PUT', body: JSON.stringify(userData) });
    
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
        login,
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
