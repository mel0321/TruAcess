import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RecoverPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [requested, setRequested] = useState(false);
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [emailPreview, setEmailPreview] = useState<string | null>(null);
  const { requestPasswordReset, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    if (!requested) {
      const result = await requestPasswordReset(email);
      if (result.success) {
        setRequested(true);
        setNotice(result.message);
        setEmailPreview(result.emailPreview || null);
      } else {
        setError(result.message);
      }
    } else {
      const result = await resetPassword(email, code, password);
      if (result.success) {
        setComplete(true);
        setNotice(result.message);
      } else {
        setError(result.message);
      }
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)', padding: '24px'}}>
      <div style={{background: 'white', padding: '48px', borderRadius: '20px', boxShadow: '0 20px 60px rgba(5, 38, 89, 0.1)', maxWidth: '480px', width: '100%'}}>
        <div style={{textAlign: 'center', marginBottom: '32px'}}>
          <Link to="/" style={{fontSize: '36px', fontWeight: '800', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
            <span style={{color: '#052659'}}>Tru</span><span style={{color: '#2AC2D2'}}>Acess</span>
          </Link>
          <p style={{color: '#64748B', marginTop: '12px', fontSize: '15px'}}>Recupere o acesso à sua conta</p>
        </div>
        {error && <p role="alert" style={{ background: '#FEE2E2', color: '#991B1B', padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</p>}
        {notice && (
          <div role="status" style={{background: '#D1FAE5', color: '#065F46', padding: '16px', borderRadius: '8px', textAlign: 'center', marginBottom: '24px'}}>
            <p style={{fontSize: '14px'}}>{notice}</p>
            {emailPreview && <p style={{ marginTop: 12 }}><a href={emailPreview} target="_blank" rel="noreferrer">Abrir e-mail de recuperação</a></p>}
          </div>
        )}
        {complete ? (
          <p style={{ textAlign: 'center', marginBottom: 20 }}>Agora você pode entrar com sua nova senha.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{marginBottom: '24px'}}>
              <label htmlFor="recovery-email" style={{display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#0F172A'}}>E-mail cadastrado</label>
              <input id="recovery-email" type="email" autoComplete="email" style={{width: '100%', padding: '14px 16px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'}} value={email} onChange={e => setEmail(e.target.value)} required disabled={requested} placeholder="seu@email.com" />
            </div>
            {requested && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="recovery-code" style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Código enviado por e-mail</label>
                  <input id="recovery-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} inputMode="numeric" autoComplete="one-time-code" maxLength={4} pattern="[0-9]{4}" required style={{ width: '100%', padding: 14, border: '2px solid #E2E8F0', borderRadius: 10, fontSize: 20, letterSpacing: 8, textAlign: 'center' }} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label htmlFor="new-password" style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Nova senha</label>
                  <input id="new-password" type="password" autoComplete="new-password" minLength={6} value={password} onChange={event => setPassword(event.target.value)} required placeholder="Mínimo 6 caracteres" style={{ width: '100%', padding: 14, border: '2px solid #E2E8F0', borderRadius: 10, fontSize: 15 }} />
                </div>
              </>
            )}
            <button type="submit" disabled={loading} style={{width: '100%', padding: '16px', background: 'linear-gradient(135deg, #052659 0%, #0a3d7a 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit'}}>
              {loading ? 'Aguarde...' : requested ? 'Redefinir senha' : 'Enviar Código'}
            </button>
          </form>
        )}
        <div style={{textAlign: 'center', marginTop: '24px', fontSize: '14px'}}>
          <Link to="/login" style={{color: '#052659', textDecoration: 'none', fontWeight: '600'}}>← Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}