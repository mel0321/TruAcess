import { useState } from 'react';
import { Link } from 'react-router-dom';

export function RecoverPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ fontSize: '32px', fontWeight: '800', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#052659' }}>Tru</span><span style={{ color: '#2AC2D2' }}>Acess</span>
          </Link>
          <p style={{ color: '#64748B', marginTop: '8px', fontSize: '15px' }}>Recupere o acesso à sua conta</p>
        </div>
        {sent ? (
          <div style={{ background: '#D1FAE5', color: '#065F46', padding: '24px', borderRadius: '8px', textAlign: 'center', marginBottom: '24px' }}>
            <p style={{ fontWeight: '700', marginBottom: '8px' }}>E-mail enviado!</p>
            <p style={{ fontSize: '14px' }}>Verifique sua caixa de entrada.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#0F172A' }}>E-mail cadastrado</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" />
            </div>
            <button type="submit" disabled={loading} className="btn-submit">{loading ? 'Enviando...' : 'Enviar Código'}</button>
          </form>
        )}
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          <Link to="/login" style={{ color: '#052659', textDecoration: 'none', fontWeight: '600' }}>← Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}