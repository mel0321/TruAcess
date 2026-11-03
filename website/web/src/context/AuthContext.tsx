import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import api from '../services/api';
import type { User, UserProfile, AuthResponse, LoginRequest, RegisterRequest, UpdateProfileRequest, DeleteAccountRequest } from '../types';

interface AuthResult {
  success: boolean;
  message: string;
  requiresVerification?: boolean;
  email?: string;
  emailPreview?: string | null;
}

interface ApiErrorResponse {
  message?: string;
  requiresVerification?: boolean;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<AuthResult>;
  register: (data: RegisterRequest) => Promise<AuthResult>;
  verifyEmail: (email: string, code: string) => Promise<AuthResult>;
  resendVerificationCode: (email: string) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string, code: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  deleteAccount: (data: DeleteAccountRequest) => Promise<{ success: boolean; message: string }>;
  updateUser: (data: UpdateProfileRequest) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
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

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('@TruAcess:token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get<{ user: User }>('/auth/me');
      const savedUser = localStorage.getItem('@TruAcess:user');
      const profile = savedUser ? (JSON.parse(savedUser) as User).profile : undefined;
      const userData = { ...response.data.user, profile };
      setUser(userData);
      localStorage.setItem('@TruAcess:user', JSON.stringify(userData));
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
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
      const profile = savedUser ? (JSON.parse(savedUser) as User).profile : undefined;
      const userData = { ...user, profile };
      
      localStorage.setItem('@TruAcess:token', token);
      localStorage.setItem('@TruAcess:user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true, message: 'Login realizado com sucesso!' };
    } catch (error: unknown) {
      const apiError = axios.isAxiosError<ApiErrorResponse>(error) ? error.response?.data : undefined;
      return {
        success: false,
        message: apiError?.message || 'Erro ao fazer login. Verifique suas credenciais.',
        requiresVerification: apiError?.requiresVerification,
        email: apiError?.email,
      };
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await api.post<{ message: string; email: string; emailPreview: string | null }>('/auth/register', data);
      return {
        success: true,
        message: response.data.message,
        requiresVerification: true,
        email: response.data.email,
        emailPreview: response.data.emailPreview,
      };
    } catch (error: unknown) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? error.response?.data?.message
        : undefined;
      return { success: false, message: message || 'Erro ao criar conta. Tente novamente.' };
    }
  };

  const verifyEmail = async (email: string, code: string): Promise<AuthResult> => {
    try {
      const response = await api.post<AuthResponse & { message: string }>('/auth/verify-email', { email, code });
      const { token, user } = response.data;
      const userData = { ...user, profile: user.profile };
      localStorage.setItem('@TruAcess:token', token);
      localStorage.setItem('@TruAcess:user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, message: response.data.message };
    } catch (error: unknown) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? error.response?.data?.message
        : undefined;
      return { success: false, message: message || 'Não foi possível verificar o e-mail.' };
    }
  };

  const resendVerificationCode = async (email: string): Promise<AuthResult> => {
    try {
      const response = await api.post<{ message: string; emailPreview: string | null }>('/auth/resend-code', { email });
      return { success: true, message: response.data.message, emailPreview: response.data.emailPreview };
    } catch (error: unknown) {
      const message = axios.isAxiosError<ApiErrorResponse>(error)
        ? error.response?.data?.message
        : undefined;
      return { success: false, message: message || 'Não foi possível reenviar o código.' };
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
    const userData = { ...user, profile: { ...user.profile, ...profile } };
    setUser(userData);
    localStorage.setItem('@TruAcess:user', JSON.stringify(userData));
  };

  const isProfileComplete = (): boolean => {
    if (!user?.profile) return false;
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
      verifyEmail,
      resendVerificationCode,
      requestPasswordReset,
      resetPassword,
      logout, 
      deleteAccount, 
      updateUser, 
      updateUserProfile, 
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