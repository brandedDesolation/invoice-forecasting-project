/**
 * Mock Authentication System
 * Simple authentication for development
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  company?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Mock users database
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@invoiceforecast.com',
    name: 'Admin User',
    role: 'admin',
    company: 'Invoice Forecast Corp'
  },
  {
    id: '2',
    email: 'user@company.com',
    name: 'John Doe',
    role: 'user',
    company: 'ABC Company'
  },
  {
    id: '3',
    email: 'demo@demo.com',
    name: 'Demo User',
    role: 'user',
    company: 'Demo Corp'
  }
];

// Simple password validation (in real app, this would be hashed)
const MOCK_PASSWORDS: Record<string, string> = {
  'admin@invoiceforecast.com': 'admin123',
  'user@company.com': 'user123',
  'demo@demo.com': 'demo123'
};

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;

  private constructor() {
    // Check if user is already logged in (from localStorage)
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('invoice_forecast_user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = MOCK_USERS.find(u => u.email === credentials.email);
    const correctPassword = MOCK_PASSWORDS[credentials.email];

    if (!user || !correctPassword) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (correctPassword !== credentials.password) {
      return { success: false, error: 'Invalid email or password' };
    }

    this.currentUser = user;
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('invoice_forecast_user', JSON.stringify(user));
    }

    return { success: true, user };
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('invoice_forecast_user');
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  hasRole(role: 'admin' | 'user'): boolean {
    return this.currentUser?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!this.currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const currentPassword = MOCK_PASSWORDS[this.currentUser.email];
    if (currentPassword !== oldPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // In a real app, you would hash the new password and update the database
    MOCK_PASSWORDS[this.currentUser.email] = newPassword;
    
    return { success: true };
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
