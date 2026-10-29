import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import type { User, UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  isProfileComplete: () => boolean;
  getOnboardingStep: () => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('@TruAcess:user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('@TruAcess:token');
  });

  useEffect(() => {
    if (token && !user) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
          localStorage.setItem('@TruAcess:user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('@TruAcess:token');
          localStorage.removeItem('@TruAcess:user');
          setToken(null);
        });
    }
  }, [token, user]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('@TruAcess:token', newToken);
    localStorage.setItem('@TruAcess:user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('@TruAcess:token');
    localStorage.removeItem('@TruAcess:user');
    localStorage.removeItem('@TruAcess:profile');
    setToken(null);
    setUser(null);
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      profile: { ...(user.profile || {}), ...profile }
    };
    localStorage.setItem('@TruAcess:user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const isProfileComplete = (): boolean => {
    if (!user?.profile) return false;
    const p = user.profile;
    return !!(p.gender && p.ageRange && p.travelFrequency && p.companionType);
  };

  const getOnboardingStep = (): number => {
    return user?.profile?.onboardingStep || 0;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUserProfile, isProfileComplete, getOnboardingStep }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};