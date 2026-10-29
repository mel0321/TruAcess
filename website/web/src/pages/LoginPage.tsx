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
  const { login, isProfileComplete } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password, expected_role: role });
      login(res.data.token, res.data.user);
      
      // Redireciona baseado no perfil
      if (res.data.user.user_type === 'BUSINESS') {
        navigate('/dashboard');
      } else if (!isProfileComplete()) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      // Fallback local para demonstração
      const mockUser = {
        id: Date.now(),
        full_name: email.split('@')[0],
        email,
        user_type: role,
        profile: { onboardingStep: 0 }
      };
      login('mock-token-' + Date.now(), mockUser);
      if (role === 'BUSINESS') {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)', padding: '24px'}}>
      <div style={{background: 'white', padding: '48px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(5, 38, 89, 0.1)', maxWidth: '480px', width: '100%'}}>
        <div style={{textAlign: 'center', marginBottom: '32px'}}>
          <Link to="/" style={{fontSize: '36px', fontWeight: '800', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
            <span style={{color: '#052659'}}>Tru</span><span style={{color: '#2AC2D2'}}>Acess</span>
          </Link>
          <p style={{color: '#64748B', marginTop: '12px', fontSize: '15px'}}>Bem-vindo(a) de volta!</p>
        </div>

        {error && <div style={{background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center'}}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={{marginBottom: '24px'}}>
            <label style={{display: 'block', fontWeight: '600', marginBottom: '12px', fontSize: '14px', color: '#0F172A'}}>Tipo de conta</label>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <button type="button" onClick={() => setRole('TRAVELER')} style={{padding: '14px', border: `2px solid ${role === 'TRAVELER' ? '#052659' : '#E2E8F0'}`, borderRadius: '10px', background: role === 'TRAVELER' ? '#F0F9FF' : 'white', color: role === 'TRAVELER' ? '#052659' : '#64748B', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'}}>
                <IconUser width={18} height={18} /> Viajante
              </button>
              <button type="button" onClick={() => setRole('BUSINESS')} style={{padding: '14px', border: `2px solid ${role === 'BUSINESS' ? '#052659' : '#E2E8F0'}`, borderRadius: '10px', background: role === 'BUSINESS' ? '#F0F9FF' : 'white', color: role === 'BUSINESS' ? '#052659' : '#64748B', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'}}>
                <IconBuilding width={18} height={18} /> Empresa
              </button>
            </div>
          </div>

          <input type="email" style={{width: '100%', padding: '14px 16px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '15px', outline: 'none', marginBottom: '16px', fontFamily: 'inherit', boxSizing: 'border-box'}} value={email} onChange={e => setEmail(e.target.value)} required placeholder="E-mail" />
          <input type="password" style={{width: '100%', padding: '14px 16px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '15px', outline: 'none', marginBottom: '24px', fontFamily: 'inherit', boxSizing: 'border-box'}} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Senha" />

          <button type="submit" disabled={loading} style={{width: '100%', padding: '16px', background: 'linear-gradient(135deg, #052659 0%, #0a3d7a 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(5, 38, 89, 0.2)'}}>
            {loading ? 'Entrando...' : 'Acessar Conta →'}
          </button>
        </form>

        <div style={{textAlign: 'center', marginTop: '24px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
          <Link to="/recover-password" style={{color: '#052659', textDecoration: 'none', fontWeight: '600'}}>Esqueci minha senha</Link>
          <div style={{color: '#64748B'}}>Não tem conta? <Link to="/register" style={{color: '#2AC2D2', textDecoration: 'none', fontWeight: '700'}}>Criar agora</Link></div>
        </div>
      </div>
    </div>
  );
}