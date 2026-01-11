'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  role: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to safely access localStorage (SSR-safe)
const getStoredValue = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStoredValue = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage might be full or disabled
    console.warn('Failed to save to localStorage');
  }
};

const removeStoredValue = (key: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage on mount (client-side only)
  useEffect(() => {
    const initAuth = () => {
      const token = getStoredValue('token');
      const storedUser = getStoredValue('user');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch {
          // Invalid stored user data, clear it
          removeStoredValue('token');
          removeStoredValue('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback((token: string, userData: User) => {
    setStoredValue('token', token);
    setStoredValue('user', JSON.stringify(userData));
    setUser(userData);

    // Redirect based on role
    const redirectPath = getRedirectPath(userData.role);
    router.push(redirectPath);
  }, [router]);

  const logout = useCallback(() => {
    removeStoredValue('token');
    removeStoredValue('user');
    setUser(null);
    router.push('/auth/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Helper function to determine redirect path based on role
function getRedirectPath(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'CUST_RESIDENTIAL':
    case 'CUST_COMMERCIAL':
      return '/dashboard/customer';
    case 'SUBCONTRACTOR':
      return '/dashboard/contractor';
    case 'EMPLOYEE':
      return '/dashboard/employee';
    default:
      return '/dashboard';
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
