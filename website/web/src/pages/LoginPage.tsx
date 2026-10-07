import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { UserType } from '../types';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserType>('TRAVELER');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password, expected_role: role });
      login(res.data.token, res.data.user);
      navigate(res.data.user.user_type === 'BUSINESS' ? '/dashboard' : '/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login.');
    }
  };

  return (
    <div className="bg-gelo" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '40px' }}>
        
        <h2 className="text-profundo" style={{ textAlign: 'center', marginBottom: '30px' }}>Entrar no TruAcess</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <label htmlFor="email" className="text-noite" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>E-mail</label>
          <input id="email" type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required />

          <label htmlFor="password" className="text-noite" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Senha</label>
          <input id="password" type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />

          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', marginTop: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} className="text-noite">
              <input type="radio" checked={role === 'TRAVELER'} onChange={() => setRole('TRAVELER')} /> Viajante
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} className="text-noite">
              <input type="radio" checked={role === 'BUSINESS'} onChange={() => setRole('BUSINESS')} /> Empresa
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Acessar Conta</button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link to="/recover-password">Esqueci minha senha</Link>
          <Link to="/register">Criar nova conta</Link>
        </div>
      </div>
    </div>
  );
}