import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IconUser, IconBuilding } from '../components/Icons';
import type { UserType } from '../types';

export function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', user_type: 'TRAVELER' as UserType });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Tenta registrar no backend
      const res = await api.post('/auth/register', form);
      
      // Auto-login: se o backend retornar token, usa ele
      if (res.data.token && res.data.user) {
        login(res.data.token, res.data.user);
        navigate('/onboarding');
      } else {
        // Se não retornar token (backend sem auto-login), cria localmente
        const mockUser = {
          id: Date.now(),
          full_name: form.full_name,
          email: form.email,
          user_type: form.user_type,
          profile: { onboardingStep: 0 }
        };
        login('mock-token-' + Date.now(), mockUser);
        navigate('/onboarding');
      }
    } catch (err: any) {
      // Se backend falhar, cria conta local para demonstração
      const mockUser = {
        id: Date.now(),
        full_name: form.full_name,
        email: form.email,
        user_type: form.user_type,
        profile: { onboardingStep: 0 }
      };
      login('mock-token-' + Date.now(), mockUser);
      navigate('/onboarding');
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
          <p style={{color: '#64748B', marginTop: '12px', fontSize: '15px'}}>Crie sua conta em segundos</p>
        </div>

        {error && <div style={{background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center'}}>{error}</div>}

        <form onSubmit={handleRegister}>
          <div style={{marginBottom: '24px'}}>
            <label style={{display: 'block', fontWeight: '600', marginBottom: '12px', fontSize: '14px', color: '#0F172A'}}>Quero usar como</label>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <button type="button" onClick={() => setForm({...form, user_type: 'TRAVELER'})} style={{padding: '14px', border: `2px solid ${form.user_type === 'TRAVELER' ? '#052659' : '#E2E8F0'}`, borderRadius: '10px', background: form.user_type === 'TRAVELER' ? '#F0F9FF' : 'white', color: form.user_type === 'TRAVELER' ? '#052659' : '#64748B', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'}}>
                <IconUser width={18} height={18} /> Viajante
              </button>
              <button type="button" onClick={() => setForm({...form, user_type: 'BUSINESS'})} style={{padding: '14px', border: `2px solid ${form.user_type === 'BUSINESS' ? '#052659' : '#E2E8F0'}`, borderRadius: '10px', background: form.user_type === 'BUSINESS' ? '#F0F9FF' : 'white', color: form.user_type === 'BUSINESS' ? '#052659' : '#64748B', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'}}>
                <IconBuilding width={18} height={18} /> Empresa
              </button>
            </div>
          </div>

          <input type="text" style={{width: '100%', padding: '14px 16px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '15px', outline: 'none', marginBottom: '16px', fontFamily: 'inherit', boxSizing: 'border-box'}} value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required placeholder="Nome completo" />
          <input type="email" style={{width: '100%', padding: '14px 16px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '15px', outline: 'none', marginBottom: '16px', fontFamily: 'inherit', boxSizing: 'border-box'}} value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="E-mail" />
          <input type="password" style={{width: '100%', padding: '14px 16px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '15px', outline: 'none', marginBottom: '24px', fontFamily: 'inherit', boxSizing: 'border-box'}} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required placeholder="Senha" />

          <button type="submit" disabled={loading} style={{width: '100%', padding: '16px', background: 'linear-gradient(135deg, #052659 0%, #0a3d7a 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(5, 38, 89, 0.2)', transition: 'all 0.3s'}}>
            {loading ? 'Criando conta...' : 'Criar Conta e Continuar →'}
          </button>
        </form>

        <div style={{textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748B'}}>
          Já tem conta? <Link to="/login" style={{color: '#2AC2D2', textDecoration: 'none', fontWeight: '700'}}>Fazer login</Link>
        </div>
      </div>
    </div>
  );
}