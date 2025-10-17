export interface MockUser {
  id: string;
  email: string;
  password: string; // In mock only - never store real passwords like this!
  firstName: string;
  lastName: string;
  phone: string;
  role: 'customer' | 'admin';
}

export const mockUsers: MockUser[] = [
  {
    id: 'admin-001',
    email: 'admin@salon.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    phone: '(555) 000-0001',
    role: 'admin',
  },
  {
    id: 'customer-001',
    email: 'customer@example.com',
    password: 'customer123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '(555) 123-4567',
    role: 'customer',
  },
];
