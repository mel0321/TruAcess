import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconMail, IconLock } from '../components/Icons';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login({ email, password });
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)', padding: '24px'}}>
      <div style={{background: 'white', padding: '48px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(5, 38, 89, 0.1)', maxWidth: '440px', width: '100%'}}>
        <div style={{textAlign: 'center', marginBottom: '32px'}}>
          <Link to="/" style={{fontSize: '36px', fontWeight: '800', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
            <span style={{color: '#052659'}}>Tru</span><span style={{color: '#2AC2D2'}}>Acess</span>
          </Link>
          <p style={{color: '#64748B', marginTop: '12px', fontSize: '15px'}}>Bem-vindo(a) de volta!</p>
        </div>

        {error && (
          <div style={{background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', border: '1px solid #FECACA'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#0F172A'}}>E-mail</label>
            <div style={{position: 'relative'}}>
              <IconMail width={18} height={18} style={{position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8'}} />
              <input 
                type="email" 
                style={{width: '100%', padding: '14px 16px 14px 42px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s'}} 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="seu@email.com"
                onFocus={e => e.target.style.borderColor = '#052659'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
          </div>

          <div style={{marginBottom: '24px'}}>
            <label style={{display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#0F172A'}}>Senha</label>
            <div style={{position: 'relative'}}>
              <IconLock width={18} height={18} style={{position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8'}} />
              <input 
                type="password" 
                style={{width: '100%', padding: '14px 16px 14px 42px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s'}} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="Sua senha"
                onFocus={e => e.target.style.borderColor = '#052659'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{width: '100%', padding: '16px', background: 'linear-gradient(135deg, #052659 0%, #0a3d7a 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(5, 38, 89, 0.2)', transition: 'all 0.3s', opacity: loading ? 0.7 : 1}}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{textAlign: 'center', marginTop: '24px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
          <Link to="/recover-password" style={{color: '#052659', textDecoration: 'none', fontWeight: '600'}}>Esqueci minha senha</Link>
          <div style={{color: '#64748B', paddingTop: '12px', borderTop: '1px solid #E2E8F0'}}>
            Não tem conta? <Link to="/register" style={{color: '#2AC2D2', textDecoration: 'none', fontWeight: '700'}}>Criar agora</Link>
          </div>
        </div>
      </div>
    </div>
  );
}