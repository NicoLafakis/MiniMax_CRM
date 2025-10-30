import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../lib/api';

type User = {
  id: string;
  email: string;
  full_name?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, full_name?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await authAPI.getUser();
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  // Auth methods
  async function signIn(email: string, password: string) {
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  async function signUp(email: string, password: string, full_name?: string) {
    try {
      const response = await authAPI.register(email, password, full_name);
      const { token, user } = response.data;
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  }

  async function signOut() {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
