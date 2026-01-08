import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '@/services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  userType: 'admin' | 'candidate' | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  loginAdmin: (email: string, password: string) => Promise<boolean>;
  loginCandidate: (email: string, password: string) => Promise<boolean>;
  registerCandidate: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    userType: null,
    isLoading: true,
  });

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userType = localStorage.getItem('user_type') as 'admin' | 'candidate' | null;
    const userData = localStorage.getItem('user_data');

    if (token && userType && userData) {
      setState({
        isAuthenticated: true,
        user: JSON.parse(userData),
        userType,
        isLoading: false,
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const loginAdmin = useCallback(async (email: string, password: string) => {
    const result = await api.admin.login(email, password);
    if (result.success && result.token && result.user) {
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user_type', 'admin');
      localStorage.setItem('user_data', JSON.stringify(result.user));
      setState({
        isAuthenticated: true,
        user: result.user,
        userType: 'admin',
        isLoading: false,
      });
      return true;
    }
    return false;
  }, []);

  const loginCandidate = useCallback(async (email: string, password: string) => {
    const result = await api.candidate.login(email, password);
    if (result.success && result.token && result.user) {
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user_type', 'candidate');
      localStorage.setItem('user_data', JSON.stringify(result.user));
      setState({
        isAuthenticated: true,
        user: result.user,
        userType: 'candidate',
        isLoading: false,
      });
      return true;
    }
    return false;
  }, []);

  const registerCandidate = useCallback(async (name: string, email: string, password: string) => {
    const result = await api.candidate.register(name, email, password);
    if (result.success && result.token && result.user) {
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('user_type', 'candidate');
      localStorage.setItem('user_data', JSON.stringify(result.user));
      setState({
        isAuthenticated: true,
        user: result.user,
        userType: 'candidate',
        isLoading: false,
      });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_data');
    setState({
      isAuthenticated: false,
      user: null,
      userType: null,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loginAdmin,
        loginCandidate,
        registerCandidate,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
