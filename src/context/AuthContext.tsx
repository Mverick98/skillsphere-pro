import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '@/services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  job_role_id?: string;
  job_role_name?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  userType: 'admin' | 'candidate' | null;
  isLoading: boolean;
}

interface LoginResult {
  success: boolean;
  needsRoleSelection?: boolean;
}

interface AuthContextType extends AuthState {
  loginAdmin: (email: string, password: string) => Promise<boolean>;
  loginCandidate: (email: string, password: string) => Promise<LoginResult>;
  registerCandidate: (name: string, email: string, password: string, job_role_id: string) => Promise<boolean>;
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
  // Using sessionStorage so each tab has independent auth (admin + candidate can be open simultaneously)
  useEffect(() => {
    const token = sessionStorage.getItem('auth_token');
    const userType = sessionStorage.getItem('user_type') as 'admin' | 'candidate' | null;
    const userData = sessionStorage.getItem('user_data');

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
      sessionStorage.setItem('auth_token', result.token);
      sessionStorage.setItem('user_type', 'admin');
      sessionStorage.setItem('user_data', JSON.stringify(result.user));
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

  const loginCandidate = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const result = await api.candidate.login(email, password);
    if (result.success && result.token && result.user) {
      sessionStorage.setItem('auth_token', result.token);
      sessionStorage.setItem('user_type', 'candidate');
      sessionStorage.setItem('user_data', JSON.stringify(result.user));
      setState({
        isAuthenticated: true,
        user: result.user,
        userType: 'candidate',
        isLoading: false,
      });
      // Check if user needs to select a role
      const needsRoleSelection = !result.user.job_role_id;
      return { success: true, needsRoleSelection };
    }
    return { success: false };
  }, []);

  const registerCandidate = useCallback(async (name: string, email: string, password: string, job_role_id: string) => {
    const result = await api.candidate.register(name, email, password, job_role_id);
    if (result.success && result.token && result.user) {
      sessionStorage.setItem('auth_token', result.token);
      sessionStorage.setItem('user_type', 'candidate');
      sessionStorage.setItem('user_data', JSON.stringify(result.user));
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
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_type');
    sessionStorage.removeItem('user_data');
    // Drop any stashed invite redirect from a prior visit — otherwise a
    // user logging back in cleanly via /login would get hijacked to a
    // stale invite from before they logged out.
    sessionStorage.removeItem('pending_invite');
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
