import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { RecoverPage } from '../pages/RecoverPage';
import { PlaceDetailsPage } from '../pages/PlaceDetailsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProfilePage } from '../pages/ProfilePage';
import { OnboardingPage } from '../pages/OnboardingPage';
import type { ReactNode } from 'react';

// Rota protegida: só acessa se estiver logado
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/recover-password" element={<RecoverPage />} />
            <Route path="/onboarding" element={
              <ProtectedRoute><OnboardingPage /></ProtectedRoute>
            } />
            <Route path="/local/:id" element={<PlaceDetailsPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/perfil" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />
            <Route path="/destinos" element={<div style={{padding: '100px', textAlign: 'center'}}>Destinos (em breve)</div>} />
            <Route path="/sobre" element={<div style={{padding: '100px', textAlign: 'center'}}>Sobre (em breve)</div>} />
          </Routes>
        </BrowserRouter>
      </FavoritesProvider>
    </AuthProvider>
  );
}