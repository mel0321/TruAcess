import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IconUser, IconBuilding } from '../components/Icons';
import type { UserType } from '../types';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserType>('TRAVELER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password, expected_role: role });
      login(res.data.token, res.data.user);
      navigate(res.data.user.user_type === 'BUSINESS' ? '/dashboard' : '/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ fontSize: '32px', fontWeight: '800', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#052659' }}>Tru</span><span style={{ color: '#2AC2D2' }}>Acess</span>
          </Link>
          <p style={{ color: '#64748B', marginTop: '8px', fontSize: '15px' }}>Entre na sua conta para continuar</p>
        </div>
        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px', fontSize: '14px', color: '#0F172A' }}>Tipo de conta</label>
            <div className="role-selector">
              <button type="button" onClick={() => setRole('TRAVELER')} className={`role-btn ${role === 'TRAVELER' ? 'active' : ''}`}>
                <IconUser width={18} height={18} /> Viajante
              </button>
              <button type="button" onClick={() => setRole('BUSINESS')} className={`role-btn ${role === 'BUSINESS' ? 'active' : ''}`}>
                <IconBuilding width={18} height={18} /> Empresa
              </button>
            </div>
          </div>
          <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="E-mail" />
          <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Senha" />
          <button type="submit" disabled={loading} className="btn-submit">{loading ? 'Entrando...' : 'Acessar Conta'}</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link to="/recover-password" style={{ color: '#052659', textDecoration: 'none', fontWeight: '600' }}>Esqueci minha senha</Link>
          <div style={{ color: '#64748B' }}>Não tem conta? <Link to="/register" style={{ color: '#2AC2D2', textDecoration: 'none', fontWeight: '700' }}>Criar agora</Link></div>
        </div>
      </div>
    </div>
  );
}