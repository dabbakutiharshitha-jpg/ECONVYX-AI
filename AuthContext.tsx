// ECONVYX AI — Authentication & Workspace Tenant Context
// Real JWT-based auth: register, login (email+password), Google OAuth, logout

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, BusinessWorkspace, WorkspaceRole } from '../types/index.js';
import { api } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  workspaces: BusinessWorkspace[];
  activeWorkspace: BusinessWorkspace | null;
  userRole: WorkspaceRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  setActiveWorkspace: (workspaceId: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, password: string) => Promise<void>;
  logout: () => void;
  reloadAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<BusinessWorkspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<BusinessWorkspace | null>(null);
  const [userRole, setUserRole] = useState<WorkspaceRole>('owner');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!user && !!localStorage.getItem('econvyx_token');

  const applyAuthResult = useCallback((res: any) => {
    if (res.token) {
      localStorage.setItem('econvyx_token', res.token);
    }
    setUser(res.user);
    setWorkspaces(res.workspaces || []);

    const savedWsId = localStorage.getItem('econvyx_active_workspace');
    const matched = (res.workspaces || []).find((w: BusinessWorkspace) => w.id === savedWsId);
    const target = matched || res.workspaces?.[0] || null;
    setActiveWorkspaceState(target);
    if (target) {
      localStorage.setItem('econvyx_active_workspace', target.id);
    }
    setUserRole((res.user?.role as WorkspaceRole) || 'owner');
  }, []);

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem('econvyx_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await api.getMe();
      applyAuthResult(res);
    } catch (err) {
      // Token invalid or expired — clear and show sign-in
      localStorage.removeItem('econvyx_token');
      localStorage.removeItem('econvyx_active_workspace');
      setUser(null);
      setWorkspaces([]);
      setActiveWorkspaceState(null);
    } finally {
      setIsLoading(false);
    }
  }, [applyAuthResult]);

  useEffect(() => {
    // Handle OAuth callback redirect (Microsoft / Social)
    const urlParams = new URLSearchParams(window.location.search);
    const oauthToken = urlParams.get('token');
    const oauthRedirectTo = urlParams.get('redirectTo');

    if (
      (window.location.pathname === '/auth/oauth-callback' ||
        window.location.pathname === '/auth/google-callback') &&
      oauthToken
    ) {
      localStorage.setItem('econvyx_token', oauthToken);
      window.location.href = oauthRedirectTo || '/';
      return;
    }

    loadProfile();
  }, [loadProfile]);

  const setActiveWorkspace = (workspaceId: string) => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws) {
      setActiveWorkspaceState(ws);
      localStorage.setItem('econvyx_active_workspace', ws.id);
      window.location.reload();
    }
  };

  // Real email + password login
  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    applyAuthResult(res);
  };

  // Real registration
  const register = async (email: string, fullName: string, password: string) => {
    const res = await api.register({ email, fullName, password });
    applyAuthResult(res);
  };

  const logout = () => {
    localStorage.removeItem('econvyx_token');
    localStorage.removeItem('econvyx_active_workspace');
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspaceState(null);
    window.location.href = '/signin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspaces,
        activeWorkspace,
        userRole,
        isLoading,
        isAuthenticated,
        setActiveWorkspace,
        login,
        register,
        logout,
        reloadAuth: loadProfile,
      }}
    >
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
