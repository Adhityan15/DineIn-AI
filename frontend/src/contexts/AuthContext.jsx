import React, { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from localStorage on app mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('access_token');
      
      console.log("=== AUTH HYDRATION ===");
      console.log("stored access token exists:", !!token);
      console.log("stored user exists:", !!savedUser);
      
      if (savedUser && token && savedUser !== 'undefined' && savedUser !== 'null') {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        console.log("auth user:", parsedUser);
        console.log("isAuthenticated:", true);
      } else {
        console.log("auth user: null");
        console.log("isAuthenticated: false");
      }
    } catch (e) {
      console.error('Failed to parse saved user from localStorage:', e);
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
      console.log("auth loading: false");
    }
  }, []);

  const login = async (email, password) => {
    console.log("LOGIN REQUEST START");
    try {
      const response = await client.post('/auth/login/', { email, password });
      console.log("LOGIN RESPONSE:", response);
      console.log("LOGIN RESPONSE DATA:", response?.data);

      const payload = response.data?.data || response.data;
      const { access, refresh, user: userData } = payload;

      console.log("TOKEN RECEIVED:", !!access);
      console.log("AUTH USER:", userData);

      if (access) localStorage.setItem('access_token', access);
      if (refresh) localStorage.setItem('refresh_token', refresh);
      if (userData) localStorage.setItem('user', JSON.stringify(userData));

      if (userData?.branch) {
        localStorage.setItem('selected_branch', userData.branch);
        localStorage.setItem('branch_id', userData.branch);
      }

      setUser(userData);
      return { success: true, data: payload };
    } catch (error) {
      console.error("LOGIN ERROR:", error.response?.status, error.response?.data || error.message);
      const message = error.response?.data?.message || error.response?.data?.detail || 'Login failed. Please check your credentials.';
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      await client.post('/auth/register/', userData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed.';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      if (refreshToken) {
        await client.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const hasRole = (allowedRoles) => {
    return user && allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
