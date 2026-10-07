import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header style={{ backgroundColor: '#052659', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '24px' }}>♾️</span>
        <h1 style={{ margin: 0, fontSize: '22px', color: 'white' }}>TruAcess</h1>
      </Link>

      <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Início</Link>

        {user ? (
          <>
            {user.user_type === 'BUSINESS' && (
              <Link to="/dashboard" style={{ color: '#C1E8FF', textDecoration: 'none', fontWeight: 'bold' }}>Dashboard</Link>
            )}
            <span style={{ color: '#C1E8FF' }}>Olá, {user.full_name?.split(' ')[0]}</span>
            <button onClick={handleLogout} style={{ backgroundColor: '#c62828', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Sair</button>
          </>
        ) : (
          <Link to="/login" style={{ backgroundColor: '#2AC2D2', color: '#052659', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>Entrar</Link>
        )}
      </nav>
    </header>
  );
}