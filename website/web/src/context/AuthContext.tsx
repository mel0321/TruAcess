import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import api from '../services/api';
import type { User, UserProfile, AuthResponse, LoginRequest, RegisterRequest, UpdateProfileRequest, DeleteAccountRequest } from '../types';

interface AuthResult {
  success: boolean;
  message: string;
  emailPreview?: string | null;
}

interface ApiErrorResponse {
  message?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<AuthResult>;
  register: (data: RegisterRequest) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string, code: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  deleteAccount: (data: DeleteAccountRequest) => Promise<{ success: boolean; message: string }>;
  updateUser: (data: UpdateProfileRequest) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  switchLinkedAccount: () => Promise<User>;
  isProfileComplete: () => boolean;
  getOnboardingStep: () => number;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const disabilities = user?.profile?.disabilities || [];
    const accessibilityMode = user?.profile?.accessibilityMode === true;
    root.classList.toggle('a11y-enabled', accessibilityMode);
    root.classList.toggle('a11y-visual', accessibilityMode && disabilities.includes('VISUAL'));
    root.classList.toggle('a11y-motor', accessibilityMode && disabilities.includes('PHYSICAL'));
    root.classList.toggle('a11y-hearing', accessibilityMode && disabilities.includes('HEARING'));
    root.classList.toggle('a11y-calm', accessibilityMode && (disabilities.includes('COGNITIVE') || disabilities.includes('NEURODIVERGENT')));
    root.dataset.accessibilityProfile = disabilities.join(',');
    const stored = JSON.parse(localStorage.getItem('@TruAcess:a11y') || '{}');
    root.dataset.fontScale = String(stored.fontScale || 100);
    root.classList.toggle('a11y-font-large', (stored.fontScale || 100) >= 125);
    root.classList.toggle('a11y-font-small', (stored.fontScale || 100) <= 85);
    root.classList.toggle('a11y-contrast', stored.highContrast === true);
    root.classList.toggle('a11y-spacing', stored.spacing === true);
    root.classList.toggle('a11y-simple', stored.simple === true);
    root.classList.toggle('a11y-read', stored.reading === true);

    return () => {
      root.classList.remove('a11y-enabled', 'a11y-visual', 'a11y-motor', 'a11y-hearing', 'a11y-calm', 'a11y-font-large', 'a11y-font-small', 'a11y-contrast', 'a11y-spacing', 'a11y-simple', 'a11y-read');
      delete root.dataset.accessibilityProfile;
    };
  }, [user?.id, user?.user_type, user?.profile?.disabilities, user?.profile?.accessibilityMode]);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('@TruAcess:token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get<{ user: User }>('/auth/me');
      const savedUser = localStorage.getItem('@TruAcess:user');
      const savedUserData = savedUser ? JSON.parse(savedUser) as User : null;
      const localProfile = response.data.user.user_type === 'TRAVELER' && savedUserData?.id === response.data.user.id
        ? savedUserData.profile
        : undefined;
      const userData = {
        ...response.data.user,
        profile: response.data.user.profile ?? localProfile ?? null
      };
      setUser(userData);
      localStorage.setItem('@TruAcess:user', JSON.stringify(userData));
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        console.error('Erro ao carregar usuário:', error);
      }
      localStorage.removeItem('@TruAcess:token');
      localStorage.removeItem('@TruAcess:user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);
      const { token, user } = response.data;
      const savedUser = localStorage.getItem('@TruAcess:user');
      const savedUserData = savedUser ? JSON.parse(savedUser) as User : null;
      const localProfile = user.user_type === 'TRAVELER' && savedUserData?.id === user.id
        ? savedUserData.profile
        : undefined;
      const userData = { ...user, profile: user.profile ?? localProfile ?? null };

      localStorage.setItem('@TruAcess:token', token);
      localStorage.setItem('@TruAcess:user', JSON.stringify(userData));
      setUser(userData);

      return { success: true, message: 'Login realizado com sucesso!' };
    } catch (error: unknown) {
      const apiError = axios.isAxiosError<ApiErrorResponse>(error) ? error.response?.data : undefined;
      return {
        success: false,
        message: apiError?.message || 'Erro ao fazer login. Verifique suas credenciais.',
      };
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await api.post<AuthResponse & { message: string }>('/auth/register', data);
      const { token, user } = response.data;
      const userData = { ...user };

      localStorage.setItem('@TruAcess:token', token);
      localStorage.setItem('@TruAcess:user', JSON.stringify(userData));
      setUser(userData);

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: unknown) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? error.response?.data?.message
        : undefined;
      return { success: false, message: message || 'Erro ao criar conta. Tente novamente.' };
    }
  };

  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    try {
      const response = await api.post<{ message: string; emailPreview: string | null }>('/auth/forgot-password', { email });
      return { success: true, message: response.data.message, emailPreview: response.data.emailPreview };
    } catch (error: unknown) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? error.response?.data?.message
        : undefined;
      return { success: false, message: message || 'Não foi possível solicitar a recuperação da senha.' };
    }
  };

  const resetPassword = async (email: string, code: string, password: string): Promise<AuthResult> => {
    try {
      const response = await api.post<{ message: string }>('/auth/reset-password', { email, code, password });
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? error.response?.data?.message
        : undefined;
      return { success: false, message: message || 'Não foi possível redefinir a senha.' };
    }
  };

  const logout = () => {
    if (user?.id) {
      localStorage.removeItem(`@TruAcess:favoritos:${user.id}`);
    }
    localStorage.removeItem('@TruAcess:token');
    localStorage.removeItem('@TruAcess:user');
    setUser(null);
  };

  const deleteAccount = async (data: DeleteAccountRequest) => {
    try {
      await api.delete('/users/profile', { data });
      logout();
      return { success: true, message: 'Conta excluída com sucesso.' };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao excluir conta. Verifique sua senha.';
      return { success: false, message };
    }
  };

  const updateUser = async (data: UpdateProfileRequest) => {
    try {
      const response = await api.put<{ user: User }>('/users/profile', data);
      const userData = { ...response.data.user, profile: user?.profile };
      setUser(userData);
      localStorage.setItem('@TruAcess:user', JSON.stringify(userData));
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    if (!user) return;
    const updatedProfile = { ...user.profile, ...profile };
    const response = await api.put<{ user: User }>('/users/profile', { profile: updatedProfile });
    const userData = { ...response.data.user, profile: updatedProfile };
    setUser(userData);
    localStorage.setItem('@TruAcess:user', JSON.stringify(userData));
  };

  const switchLinkedAccount = async (): Promise<User> => {
    const response = await api.post<{ token: string; user: User }>('/users/linked-account/switch');
    localStorage.setItem('@TruAcess:token', response.data.token);
    localStorage.setItem('@TruAcess:user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    return response.data.user;
  };

  const isProfileComplete = (): boolean => {
    if (!user?.profile || user.user_type !== 'TRAVELER') return false;
    const p = user.profile;
    return !!(p.gender && p.ageRange && p.travelFrequency && p.companionType);
  };

  const getOnboardingStep = (): number => {
    return user?.profile?.onboardingStep || 0;
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      requestPasswordReset,
      resetPassword,
      logout,
      deleteAccount,
      updateUser,
      updateUserProfile,
      switchLinkedAccount,
      isProfileComplete,
      getOnboardingStep,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
