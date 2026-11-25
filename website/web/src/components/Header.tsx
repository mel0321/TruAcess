import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
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
      <div className={`container header-inner${user ? ' header-inner-authenticated' : ''}`}>
        <Link to="/" className="logo">
          <span className="tru">Tru</span>
          <span className="access">Acess</span>
        </Link>
        <nav className={`nav${menuOpen ? ' nav-open' : ''}`}>
          <NavLink to="/" end className="nav-link" onClick={() => setMenuOpen(false)}>Início</NavLink>
          <NavLink to="/destinos" className="nav-link" onClick={() => setMenuOpen(false)}>Destinos</NavLink>
          {user && <NavLink to="/comunidade" className="nav-link" onClick={() => setMenuOpen(false)}>Comunidade</NavLink>}
          {user?.user_type === 'BUSINESS' && (
            <NavLink to="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Painel</NavLink>
          )}
          <NavLink to="/sobre" className="nav-link" onClick={() => setMenuOpen(false)}>Sobre</NavLink>
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
        <div className={user ? 'header-user-actions' : undefined}>
          {user ? (
            <>
              <Link to="/perfil" className="header-profile-link">
                {user.profile_picture ? (
                  <img src={user.profile_picture} alt="Foto do perfil" className="header-profile-avatar" />
                ) : (
                  <div className="header-profile-avatar header-profile-initials">
                    {getInitials()}
                  </div>
                )}
                <span className="header-profile-name">Olá, {user.full_name?.split(' ')[0]}</span>
              </Link>
              <button className="header-logout-button" onClick={() => { logout(); navigate('/login'); }}>Sair</button>
            </>
          ) : (
            <div className="header-auth-actions">
              <Link to="/login" className="btn-plan">Entrar</Link>
              <Link to="/register" className="btn-register">Cadastrar</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}