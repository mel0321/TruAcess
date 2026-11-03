import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserType } from '../types';
import { IconUser, IconBuilding, IconMail, IconLock, IconUserCircle } from '../components/Icons';

export function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirmPassword: '', user_type: 'TRAVELER' as UserType });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailPreview, setEmailPreview] = useState<string | null>(null);
  const { register, verifyEmail, resendVerificationCode } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    
    const result = await register({
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      user_type: form.user_type
    });
    
    setNotice('');
    if (result.success && result.requiresVerification) {
      setVerificationRequired(true);
      setEmailPreview(result.emailPreview || null);
      setError('');
    } else if (result.success) {
      navigate('/onboarding');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await verifyEmail(form.email, verificationCode);
    if (result.success) {
      navigate('/onboarding');
      return;
    }
    setError(result.message);
    setLoading(false);
  };

  const handleResendCode = async () => {
    setError('');
    setNotice('');
    setLoading(true);
    const result = await resendVerificationCode(form.email);
    if (result.success) setNotice(result.message);
    else setError(result.message);
    if (result.emailPreview) setEmailPreview(result.emailPreview);
    setLoading(false);
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

        {error && (
          <div style={{background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center', border: '1px solid #FECACA'}}>
            {error}
          </div>
        )}
        {notice && (
          <div role="status" style={{ background: '#D1FAE5', color: '#065F46', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14, textAlign: 'center' }}>
            {notice}
          </div>
        )}

        {verificationRequired ? (
          <form onSubmit={handleVerify}>
            <p style={{ color: '#475569', marginBottom: 20, textAlign: 'center' }}>
              Informe o código de 4 dígitos enviado para <strong>{form.email}</strong> para ativar sua conta.
            </p>
            {emailPreview && (
              <p style={{ textAlign: 'center', marginBottom: 16 }}>
                <a href={emailPreview} target="_blank" rel="noreferrer">Abrir e-mail de verificação</a>
              </p>
            )}
            <label htmlFor="verification-code" style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
              Código de verificação
            </label>
            <input
              id="verification-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              pattern="[0-9]{4}"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))}
              required
              style={{ width: '100%', padding: 14, border: '2px solid #E2E8F0', borderRadius: 10, fontSize: 20, letterSpacing: 8, textAlign: 'center', marginBottom: 20 }}
            />
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 16, background: '#052659', color: 'white', border: 0, borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
              {loading ? 'Verificando...' : 'Confirmar e continuar'}
            </button>
            <button type="button" onClick={() => void handleResendCode()} disabled={loading} style={{ width: '100%', padding: 14, marginTop: 12, background: 'transparent', color: '#052659', border: 0, fontWeight: 600, cursor: 'pointer' }}>
              Reenviar código
            </button>
          </form>
        ) : (
        <form onSubmit={handleRegister}>
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', fontWeight: '600', marginBottom: '10px', fontSize: '14px', color: '#0F172A'}}>Quero usar como</label>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <button type="button" onClick={() => setForm({...form, user_type: 'TRAVELER'})} style={{padding: '14px', border: `2px solid ${form.user_type === 'TRAVELER' ? '#052659' : '#E2E8F0'}`, borderRadius: '10px', background: form.user_type === 'TRAVELER' ? '#F0F9FF' : 'white', color: form.user_type === 'TRAVELER' ? '#052659' : '#64748B', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'}}>
                <IconUser width={18} height={18} /> Viajante
              </button>
              <button type="button" onClick={() => setForm({...form, user_type: 'BUSINESS'})} style={{padding: '14px', border: `2px solid ${form.user_type === 'BUSINESS' ? '#052659' : '#E2E8F0'}`, borderRadius: '10px', background: form.user_type === 'BUSINESS' ? '#F0F9FF' : 'white', color: form.user_type === 'BUSINESS' ? '#052659' : '#64748B', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'}}>
                <IconBuilding width={18} height={18} /> Empresa
              </button>
            </div>
          </div>

          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#0F172A'}}>Nome completo</label>
            <div style={{position: 'relative'}}>
              <IconUserCircle width={18} height={18} style={{position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8'}} />
              <input 
                type="text" 
                style={{width: '100%', padding: '14px 16px 14px 42px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'}} 
                value={form.full_name} 
                onChange={e => setForm({...form, full_name: e.target.value})} 
                required 
                placeholder="Seu nome completo"
                onFocus={e => e.target.style.borderColor = '#052659'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
          </div>

          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#0F172A'}}>E-mail</label>
            <div style={{position: 'relative'}}>
              <IconMail width={18} height={18} style={{position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8'}} />
              <input 
                type="email" 
                style={{width: '100%', padding: '14px 16px 14px 42px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'}} 
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
                required 
                placeholder="seu@email.com"
                onFocus={e => e.target.style.borderColor = '#052659'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
          </div>

          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#0F172A'}}>Senha</label>
            <div style={{position: 'relative'}}>
              <IconLock width={18} height={18} style={{position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8'}} />
              <input 
                type="password" 
                style={{width: '100%', padding: '14px 16px 14px 42px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'}} 
                value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})} 
                required 
                placeholder="Mínimo 6 caracteres"
                onFocus={e => e.target.style.borderColor = '#052659'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
          </div>

          <div style={{marginBottom: '24px'}}>
            <label style={{display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#0F172A'}}>Confirmar senha</label>
            <div style={{position: 'relative'}}>
              <IconLock width={18} height={18} style={{position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8'}} />
              <input 
                type="password" 
                style={{width: '100%', padding: '14px 16px 14px 42px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'}} 
                value={form.confirmPassword} 
                onChange={e => setForm({...form, confirmPassword: e.target.value})} 
                required 
                placeholder="Repita a senha"
                onFocus={e => e.target.style.borderColor = '#052659'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{width: '100%', padding: '16px', background: 'linear-gradient(135deg, #052659 0%, #0a3d7a 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(5, 38, 89, 0.2)', opacity: loading ? 0.7 : 1, transition: 'all 0.3s'}}>
            {loading ? 'Criando conta...' : 'Criar Conta e Continuar'}
          </button>
        </form>
        )}

        <div style={{textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748B', paddingTop: '20px', borderTop: '1px solid #E2E8F0'}}>
          Já tem conta? <Link to="/login" style={{color: '#2AC2D2', textDecoration: 'none', fontWeight: '700'}}>Fazer login</Link>
        </div>
      </div>
    </div>
  );
}