import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          <span className="tru">Tru</span><span className="access">Acess</span>
        </Link>
        <nav className="nav">
          <Link to="/">Início</Link>
          <Link to="/destinos">Destinos</Link>
          <Link to="/sobre">Sobre</Link>
        </nav>
        <div>
          {user ? (
            <>
              <Link to="/perfil" style={{marginRight: '16px', textDecoration: 'none', color: 'var(--dark)', fontWeight: 500, fontSize: '14px'}}>
                Olá, {user.full_name?.split(' ')[0]}
              </Link>
              {user.user_type === 'BUSINESS' && (
                <Link to="/dashboard" style={{marginRight: '16px', textDecoration: 'none', color: 'var(--dark)', fontWeight: 500, fontSize: '14px'}}>Painel</Link>
              )}
              <button onClick={() => { logout(); navigate('/'); }} style={{background: 'transparent', border: '1px solid var(--primary)', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px'}}>Sair</button>
            </>
          ) : (
            <Link to="/login" className="btn-plan">Entrar</Link>
          )}
        </div>
      </div>
    </header>
  );
}