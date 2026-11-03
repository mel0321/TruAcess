import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const getInitials = () => {
    if (!user?.full_name) return '?';
    const parts = user.full_name.split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          <span className="tru">Tru</span>
          <span className="access">Acess</span>
        </Link>
        <nav className={`nav${menuOpen ? ' nav-open' : ''}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Início</Link>
          <Link to="/destinos" onClick={() => setMenuOpen(false)}>Destinos</Link>
          <Link to="/sobre" onClick={() => setMenuOpen(false)}>Sobre</Link>
        </nav>
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Fechar' : 'Menu'}
        </button>
        <div>
          {user ? (
            <>
              <Link to="/perfil" style={{marginRight: '16px', textDecoration: 'none', color: '#0f172a', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                {user.profile_picture ? (
                  <img src={user.profile_picture} alt="Foto" style={{width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover'}} />
                ) : (
                  <div style={{width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #052659, #2AC2D2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 800}}>
                    {getInitials()}
                  </div>
                )}
                Olá, {user.full_name?.split(' ')[0]}
              </Link>
              {user.user_type === 'BUSINESS' && (
                <Link to="/dashboard" style={{marginRight: '16px', textDecoration: 'none', color: '#0f172a', fontWeight: 500, fontSize: '14px'}}>Painel</Link>
              )}
              <button onClick={() => { logout(); navigate('/login'); }} style={{background: 'transparent', border: '1px solid #052659', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px'}}>Sair</button>
            </>
          ) : (
            <Link to="/login" className="btn-plan">Entrar</Link>
          )}
        </div>
      </div>
    </header>
  );
}