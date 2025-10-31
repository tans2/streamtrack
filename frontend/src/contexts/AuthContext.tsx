"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User } from '@/services/authService';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, initialShows?: number[]) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updatePreferences: (updates: Partial<User>) => Promise<void>;
  upgradeToPremium: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('streamtrack_token');
    if (storedToken) {
      setToken(storedToken);
      // Verify token and get user data
      verifyToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('streamtrack_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await authService.login(email, password);
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem('streamtrack_token', result.token);
      toast.success('Welcome back!');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (email: string, password: string, name?: string, initialShows?: number[]) => {
    try {
      const result = await authService.register(email, password, name, initialShows);
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem('streamtrack_token', result.token);
      toast.success('Account created successfully!');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('streamtrack_token');
      toast.success('Logged out successfully');
    }
  };

  const updatePreferences = async (updates: Partial<User>) => {
    if (!token) throw new Error('Not authenticated');

    try {
      const updatedUser = await authService.updatePreferences(updates);
      setUser(updatedUser);
      toast.success('Preferences updated successfully');
    } catch (error: any) {
      console.error('Update preferences error:', error);
      toast.error(error.message || 'Failed to update preferences');
      throw error;
    }
  };

  const upgradeToPremium = async () => {
    if (!token) throw new Error('Not authenticated');

    try {
      const updatedUser = await authService.upgradeToPremium();
      setUser(updatedUser);
      toast.success('Welcome to Premium!');
    } catch (error: any) {
      console.error('Upgrade premium error:', error);
      toast.error(error.message || 'Failed to upgrade to premium');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      loading,
      updatePreferences,
      upgradeToPremium
    }}>
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

