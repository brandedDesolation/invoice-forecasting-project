/**
 * Backend-backed authentication utilities.
 */

export const AUTH_TOKEN_KEY = "invoice_forecast_token";
export const AUTH_USER_KEY = "invoice_forecast_user";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "finance_manager" | "accountant" | "auditor" | "user";
  company?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

const persistSession = (data: LoginResponse) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
  }
};

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem(AUTH_USER_KEY);
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
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Login failed" }));
        return { success: false, error: errorData.detail || "Invalid email or password" };
      }

      const data: LoginResponse = await response.json();
      this.currentUser = data.user;
      persistSession(data);

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: "Unable to reach the authentication service" };
    }
  }

  async loginWithGoogle(idToken: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_token: idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Google sign-in failed" }));
        return { success: false, error: errorData.detail || "Google sign-in failed" };
      }

      const data: LoginResponse = await response.json();
      this.currentUser = data.user;
      persistSession(data);
      return { success: true, user: data.user };
    } catch (_error) {
      return { success: false, error: "Unable to reach the Google SSO demo service" };
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    if (typeof window !== "undefined" && !this.currentUser) {
      const savedUser = localStorage.getItem(AUTH_USER_KEY);
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    }
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  hasRole(role: 'admin' | 'user'): boolean {
    return this.currentUser?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  async refreshCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) {
      this.currentUser = null;
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          await this.logout();
          return null;
        }

        // Keep the existing session during transient backend errors/reloads.
        return this.getCurrentUser();
      }

      const user: User = await response.json();
      this.currentUser = user;
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      }
      return user;
    } catch (_error) {
      // Do not drop the session on temporary network/backend restart issues.
      return this.getCurrentUser();
    }
  }
}

export const authService = AuthService.getInstance();
