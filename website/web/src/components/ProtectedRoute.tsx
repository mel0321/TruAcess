import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Exige apenas que esteja logado
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Exige que esteja logado E seja de um tipo específico (TRAVELER ou BUSINESS)
export function RoleRoute({ 
  children, 
  allowedRole 
}: { 
  children: React.ReactNode;
  allowedRole: 'TRAVELER' | 'BUSINESS';
}) {
  const { token, user } = useAuth();

  if (!token) return <Navigate to="/login" replace />;
  if (user?.user_type !== allowedRole) return <Navigate to="/" replace />;

  return <>{children}</>;
}