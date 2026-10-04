"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';

type User = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (access: string, refresh: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const loadUser = async () => {
      const accessToken = Cookies.get('access_token');
      if (accessToken) {
        try {
          const res = await api.get('/auth/me/');
          setUser(res.data);
        } catch (_error) {
          console.error("Failed to load user");
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  useEffect(() => {
    // Protected routes logic
    const protectedRoutes = ['/dashboard', '/resume', '/profile', '/interviews'];
    const isProtected = protectedRoutes.some(r => pathname.startsWith(r));
    if (!loading && isProtected && !user) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  const login = (access: string, refresh: string, userData: User) => {
    Cookies.set('access_token', access);
    Cookies.set('refresh_token', refresh);
    setUser(userData);
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      const refresh = Cookies.get('refresh_token');
      if (refresh) {
        await api.post('/auth/logout/', { refresh });
      }
    } catch (e) {
      console.error(e);
    } finally {
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      setUser(null);
      router.push('/login');
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
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
