import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { DisabilityType, UserType } from '../types';
import { IconUser, IconBuilding, IconMail, IconLock, IconUserCircle } from '../components/Icons';

export function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirmPassword: '', user_type: 'TRAVELER' as UserType,
    disabilityDeclared: false,
    disabilities: [] as DisabilityType[],
    businessCategory: '', businessCity: '', businessPhone: '',
    accessibilityMode: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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
      user_type: form.user_type,
      profile: form.user_type === 'TRAVELER'
        ? { disabilityDeclared: form.disabilityDeclared, disabilities: form.disabilities, accessibilityMode: form.accessibilityMode }
        : { businessCategory: form.businessCategory, businessCity: form.businessCity, businessPhone: form.businessPhone, accessibilityMode: form.accessibilityMode }
    });
    
    if (result.success) {
      navigate(form.user_type === 'BUSINESS' ? '/register-place?welcome=1' : '/onboarding');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)', padding: '24px'}}>
      <div style={{background: 'white', padding: '48px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(5, 38, 89, 0.1)', maxWidth: '480px', width: '100%'}}>
        <div style={{textAlign: 'center', marginBottom: '32px'}}>
          <Link to="/" style={{fontSize: 'calc(36px * var(--a11y-font-scale, 1))', fontWeight: '800', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
            <span style={{color: '#052659'}}>Tru</span><span style={{color: '#2AC2D2'}}>Acess</span>
          </Link>
          <p style={{color: '#64748B', marginTop: '12px', fontSize: 'calc(15px * var(--a11y-font-scale, 1))'}}>Crie sua conta em segundos</p>
        </div>

        {error && (
          <div style={{background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: 'calc(14px * var(--a11y-font-scale, 1))', textAlign: 'center', border: '1px solid #FECACA'}}>
            {error}
          </div>
        )}
        <form onSubmit={handleRegister}>
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', fontWeight: '600', marginBottom: '10px', fontSize: 'calc(14px * var(--a11y-font-scale, 1))', color: '#0F172A'}}>Quero usar como</label>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
              <button type="button" onClick={() => setForm({...form, user_type: 'TRAVELER'})} style={{padding: '14px', border: `2px solid ${form.user_type === 'TRAVELER' ? '#052659' : '#E2E8F0'}`, borderRadius: '10px', background: form.user_type === 'TRAVELER' ? '#F0F9FF' : 'white', color: form.user_type === 'TRAVELER' ? '#052659' : '#64748B', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'}}>
                <IconUser width={18} height={18} /> Viajante
              </button>
              <button type="button" onClick={() => setForm({...form, user_type: 'BUSINESS'})} style={{padding: '14px', border: `2px solid ${form.user_type === 'BUSINESS' ? '#052659' : '#E2E8F0'}`, borderRadius: '10px', background: form.user_type === 'BUSINESS' ? '#F0F9FF' : 'white', color: form.user_type === 'BUSINESS' ? '#052659' : '#64748B', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'}}>
                <IconBuilding width={18} height={18} /> Empresa
              </button>
            </div>
          </div>

          {form.user_type === 'TRAVELER' ? (
            <fieldset style={{margin: '0 0 20px', padding: '16px', border: '1px solid #DDE8F0', borderRadius: '12px'}}>
              <legend style={{padding: '0 8px', color: '#052659', fontWeight: 700, fontSize: 'calc(14px * var(--a11y-font-scale, 1))'}}>Você possui alguma deficiência ou necessidade de acessibilidade?</legend>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                {([
                  ['PHYSICAL', 'Física / mobilidade'], ['VISUAL', 'Visual'], ['HEARING', 'Auditiva'],
                  ['COGNITIVE', 'Cognitiva'], ['NEURODIVERGENT', 'Neurodivergente'], ['NONE', 'Não possuo']
                ] as [DisabilityType, string][]).map(([value, label]) => (
                  <label key={value} style={{display: 'flex', gap: '8px', alignItems: 'center', padding: '10px', borderRadius: '8px', background: form.disabilities.includes(value) ? '#E8F8FA' : '#F8FAFC', color: '#334155', fontSize: 'calc(13px * var(--a11y-font-scale, 1))'}}>
                    <input type="checkbox" checked={form.disabilities.includes(value)} onChange={(event) => setForm(current => ({
                      ...current,
                      disabilityDeclared: true,
                      disabilities: event.target.checked
                        ? [...current.disabilities.filter(item => item !== 'NONE'), value === 'NONE' ? 'NONE' : value]
                        : current.disabilities.filter(item => item !== value)
                    }))} /> {label}
                  </label>
                ))}
              </div>
              <label style={{display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginTop: 12, padding: '12px', borderRadius: '10px', background: form.accessibilityMode ? '#DDF7F7' : '#F1F5F9', fontWeight: 700, color: '#052659'}}>
                Ativar modo de acessibilidade no site
                <input type="checkbox" checked={form.accessibilityMode} onChange={(e) => setForm({...form, accessibilityMode: e.target.checked})} />
              </label>
            </fieldset>
          ) : (
            <fieldset style={{margin: '0 0 20px', padding: '16px', border: '1px solid #DDE8F0', borderRadius: '12px'}}>
              <legend style={{padding: '0 8px', color: '#052659', fontWeight: 700, fontSize: 'calc(14px * var(--a11y-font-scale, 1))'}}>Informações do estabelecimento</legend>
              <div style={{display: 'grid', gap: '10px'}}>
                <label style={{display: 'grid', gap: '6px', color: '#334155', fontSize: 'calc(13px * var(--a11y-font-scale, 1))', fontWeight: 600}}>Categoria
                  <select required value={form.businessCategory} onChange={e => setForm({...form, businessCategory: e.target.value})} style={{padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px'}}>
                    <option value="">Selecione</option><option>Hospedagem</option><option>Gastronomia</option><option>Atração turística</option><option>Compras</option><option>Saúde e bem-estar</option><option>Transporte</option><option>Educação</option><option>Entretenimento</option><option>Esportes e lazer</option><option>Espaço religioso</option><option>Serviço público</option><option>Outro</option>
                  </select>
                </label>
                <label style={{display: 'grid', gap: '6px', color: '#334155', fontSize: 'calc(13px * var(--a11y-font-scale, 1))', fontWeight: 600}}>Cidade
                  <input required value={form.businessCity} onChange={e => setForm({...form, businessCity: e.target.value})} placeholder="Cidade do estabelecimento" style={{padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px'}} />
                </label>
                <label style={{display: 'grid', gap: '6px', color: '#334155', fontSize: 'calc(13px * var(--a11y-font-scale, 1))', fontWeight: 600}}>Telefone
                  <input value={form.businessPhone} onChange={e => setForm({...form, businessPhone: e.target.value})} placeholder="(00) 00000-0000" style={{padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px'}} />
                </label>
              </div>
              <div style={{marginTop: 14, padding: '14px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0'}}>
                <strong style={{display: 'block', color: '#052659', marginBottom: 10}}>Como empresa, deseja ativar o modo de acessibilidade?</strong>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
                  <button type="button" onClick={() => setForm({...form, accessibilityMode: true})} style={{padding: '12px', border: `2px solid ${form.accessibilityMode ? '#087F8C' : '#CBD5E1'}`, borderRadius: '8px', background: form.accessibilityMode ? '#DDF7F7' : 'white', color: '#052659', fontWeight: 700}}>Sim</button>
                  <button type="button" onClick={() => setForm({...form, accessibilityMode: false})} style={{padding: '12px', border: `2px solid ${!form.accessibilityMode ? '#052659' : '#CBD5E1'}`, borderRadius: '8px', background: !form.accessibilityMode ? '#EFF6FF' : 'white', color: '#052659', fontWeight: 700}}>Não</button>
                </div>
              </div>
            </fieldset>
          )}

          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: 'calc(14px * var(--a11y-font-scale, 1))', color: '#0F172A'}}>Nome completo</label>
            <div style={{position: 'relative'}}>
              <IconUserCircle width={18} height={18} style={{position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8'}} />
              <input 
                type="text" 
                style={{width: '100%', padding: '14px 16px 14px 42px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: 'calc(15px * var(--a11y-font-scale, 1))', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'}}
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
            <label style={{display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: 'calc(14px * var(--a11y-font-scale, 1))', color: '#0F172A'}}>E-mail</label>
            <div style={{position: 'relative'}}>
              <IconMail width={18} height={18} style={{position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8'}} />
              <input 
                type="email" 
                style={{width: '100%', padding: '14px 16px 14px 42px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: 'calc(15px * var(--a11y-font-scale, 1))', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'}}
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
            <label style={{display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: 'calc(14px * var(--a11y-font-scale, 1))', color: '#0F172A'}}>Senha</label>
            <div style={{position: 'relative'}}>
              <IconLock width={18} height={18} style={{position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8'}} />
              <input 
                type="password" 
                style={{width: '100%', padding: '14px 16px 14px 42px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: 'calc(15px * var(--a11y-font-scale, 1))', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'}}
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
            <label style={{display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: 'calc(14px * var(--a11y-font-scale, 1))', color: '#0F172A'}}>Confirmar senha</label>
            <div style={{position: 'relative'}}>
              <IconLock width={18} height={18} style={{position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8'}} />
              <input 
                type="password" 
                style={{width: '100%', padding: '14px 16px 14px 42px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: 'calc(15px * var(--a11y-font-scale, 1))', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'}}
                value={form.confirmPassword} 
                onChange={e => setForm({...form, confirmPassword: e.target.value})} 
                required 
                placeholder="Repita a senha"
                onFocus={e => e.target.style.borderColor = '#052659'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{width: '100%', padding: '16px', background: 'linear-gradient(135deg, #052659 0%, #0a3d7a 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: 'calc(16px * var(--a11y-font-scale, 1))', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(5, 38, 89, 0.2)', opacity: loading ? 0.7 : 1, transition: 'all 0.3s'}}>
            {loading ? 'Criando conta...' : 'Criar Conta e Continuar'}
          </button>
        </form>

        <div style={{textAlign: 'center', marginTop: '24px', fontSize: 'calc(14px * var(--a11y-font-scale, 1))', color: '#64748B', paddingTop: '20px', borderTop: '1px solid #E2E8F0'}}>
          Já tem conta? <Link to="/login" style={{color: '#2AC2D2', textDecoration: 'none', fontWeight: '700'}}>Fazer login</Link>
        </div>
      </div>
    </div>
  );
}
