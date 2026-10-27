import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { IconUser, IconBuilding } from '../components/Icons';
import type { UserType } from '../types';

export function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', user_type: 'TRAVELER' as UserType });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setSuccess('Conta criada! Redirecionando...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta.');
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
          <p style={{ color: '#64748B', marginTop: '8px', fontSize: '15px' }}>Crie sua conta gratuitamente</p>
        </div>
        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ background: '#D1FAE5', color: '#065F46', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{success}</div>}
        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px', fontSize: '14px', color: '#0F172A' }}>Sou um(a)</label>
            <div className="role-selector">
              <button type="button" onClick={() => setForm({...form, user_type: 'TRAVELER'})} className={`role-btn ${form.user_type === 'TRAVELER' ? 'active' : ''}`}>
                <IconUser width={18} height={18} /> Viajante
              </button>
              <button type="button" onClick={() => setForm({...form, user_type: 'BUSINESS'})} className={`role-btn ${form.user_type === 'BUSINESS' ? 'active' : ''}`}>
                <IconBuilding width={18} height={18} /> Empresa
              </button>
            </div>
          </div>
          <input type="text" className="form-input" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required placeholder="Nome completo" />
          <input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required placeholder="E-mail" />
          <input type="password" className="form-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required placeholder="Senha" />
          <button type="submit" disabled={loading} className="btn-submit">{loading ? 'Criando...' : 'Criar Conta'}</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748B' }}>
          Já tem conta? <Link to="/login" style={{ color: '#2AC2D2', textDecoration: 'none', fontWeight: '700' }}>Fazer login</Link>
        </div>
      </div>
    </div>
  );
}