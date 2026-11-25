import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { User } from '../types';

type LinkMode = 'connect' | 'create' | null;

export function LinkedAccountPanel({ manage = true }: { manage?: boolean }) {
  const { user, switchLinkedAccount } = useAuth();
  const navigate = useNavigate();
  const [linkedAccount, setLinkedAccount] = useState<Pick<User, 'id' | 'full_name' | 'email' | 'user_type'> | null>(null);
  const [mode, setMode] = useState<LinkMode>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'load' | 'save' | 'switch' | 'unlink' | null>(null);

  useEffect(() => {
    let active = true;
    setError('');
    setNotice('');
    setLoadingAction('load');
    setLoading(true);
    api.get<{ account: typeof linkedAccount }>('/users/linked-account')
      .then(({ data }) => { if (active) setLinkedAccount(data.account); })
      .catch((loadError: unknown) => {
        console.error('Erro ao carregar conta conectada:', loadError);
        if (active) setError('Não foi possível verificar se há outro perfil conectado.');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setLoadingAction(null);
        }
      });
    return () => { active = false; };
  }, [user?.id]);

  const submitLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !mode) return;
    setLoading(true);
    setLoadingAction('save');
    setError('');
    setNotice('');
    try {
      const response = mode === 'connect'
        ? await api.post<{ account: NonNullable<typeof linkedAccount>; message: string }>('/users/linked-account/connect', { email, password })
        : await api.post<{ account: NonNullable<typeof linkedAccount>; message: string }>('/users/linked-account/create', { full_name: fullName, email, password });
      setLinkedAccount(response.data.account);
      setNotice(response.data.message);
      setMode(null);
      setFullName('');
      setEmail('');
      setPassword('');
    } catch (linkError: unknown) {
      const message = (linkError as { response?: { data?: { message?: string; error?: string } } }).response?.data;
      setError(message?.message || message?.error || 'Não foi possível conectar os perfis.');
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const handleSwitch = async () => {
    setLoading(true);
    setLoadingAction('switch');
    setError('');
    try {
      const switchedUser = await switchLinkedAccount();
      const travelerNeedsOnboarding = switchedUser.user_type === 'TRAVELER' && !switchedUser.profile?.profileCompleted;
      navigate(switchedUser.user_type === 'BUSINESS' ? '/dashboard' : travelerNeedsOnboarding ? '/onboarding' : '/perfil');
    } catch (switchError: unknown) {
      console.error('Erro ao alternar perfil:', switchError);
      setError('Não foi possível alternar para o perfil conectado. Tente novamente.');
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm('Desconectar os perfis? As duas contas continuarão existindo e poderão ser conectadas novamente.')) return;
    setLoading(true);
    setLoadingAction('unlink');
    setError('');
    try {
      await api.delete('/users/linked-account');
      setLinkedAccount(null);
      setNotice('Os perfis foram desconectados.');
    } catch (unlinkError: unknown) {
      console.error('Erro ao desconectar perfis:', unlinkError);
      setError('Não foi possível desconectar os perfis. Tente novamente.');
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const otherRoleLabel = user?.user_type === 'BUSINESS' ? 'viajante' : 'estabelecimento';

  return (
    <section style={{ marginTop: 24, padding: 22, border: '1px solid #DCE5EF', borderRadius: 14, background: '#F8FAFC' }}>
      <h3 style={{ margin: '0 0 8px', color: '#052659' }}>Perfis conectados</h3>
      <p style={{ margin: '0 0 16px', color: '#64748B', fontSize: 14 }}>
        A conta de {otherRoleLabel} usa e-mail e senha próprios. Os dados pessoais dos perfis permanecem separados.
      </p>
      {error && <p role="alert" style={{ color: '#991B1B', margin: '0 0 12px' }}>{error}</p>}
      {notice && <p role="status" style={{ color: '#047857', margin: '0 0 12px' }}>{notice}</p>}

      {linkedAccount ? (
        <div>
          <p style={{ margin: '0 0 12px', color: '#0F172A' }}>
            Conectado: <strong>{linkedAccount.user_type === 'BUSINESS' ? 'Estabelecimento' : 'Viajante'}</strong>
            {' · '}{linkedAccount.full_name || linkedAccount.email}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button type="button" onClick={() => void handleSwitch()} disabled={loading} className="btn-plan" style={{ border: 0, cursor: 'pointer' }}>
              {loadingAction === 'switch' ? 'Alternando...' : `Mudar para ${linkedAccount.user_type === 'BUSINESS' ? 'estabelecimento' : 'viajante'}`}
            </button>
            {manage && <button type="button" onClick={() => void handleUnlink()} disabled={loading} style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: '10px 14px', color: '#334155', background: 'white', cursor: 'pointer' }}>{loadingAction === 'unlink' ? 'Desconectando...' : 'Desconectar'}</button>}
          </div>
        </div>
      ) : manage ? (
        mode ? (
          <form onSubmit={(event) => void submitLink(event)} style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
            {mode === 'create' && (
              <label style={{ display: 'grid', gap: 6, color: '#334155', fontSize: 14 }}>
                Nome
                <input required value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </label>
            )}
            <label style={{ display: 'grid', gap: 6, color: '#334155', fontSize: 14 }}>
              {mode === 'connect' ? 'E-mail da conta existente' : 'Novo e-mail'}
              <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label style={{ display: 'grid', gap: 6, color: '#334155', fontSize: 14 }}>
              {mode === 'connect' ? 'Senha da conta existente' : 'Senha (mínimo 6 caracteres)'}
              <input required type="password" minLength={6} autoComplete={mode === 'connect' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" disabled={loading} className="btn-plan" style={{ border: 0, cursor: 'pointer' }}>{loadingAction === 'save' ? 'Salvando...' : mode === 'connect' ? 'Conectar conta' : 'Criar e conectar'}</button>
              <button type="button" disabled={loading} onClick={() => setMode(null)} style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: '10px 14px', background: 'white', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button type="button" onClick={() => setMode('connect')} className="btn-plan" style={{ border: 0, cursor: 'pointer' }}>Conectar conta de {otherRoleLabel}</button>
            <button type="button" onClick={() => setMode('create')} style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: '10px 14px', color: '#052659', background: 'white', cursor: 'pointer' }}>Criar perfil de {otherRoleLabel}</button>
          </div>
        )
      ) : (
        <p style={{ margin: 0, color: '#64748B', fontSize: 14 }}>Nenhum perfil de {otherRoleLabel} conectado.</p>
      )}
    </section>
  );
}
