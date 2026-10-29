import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { Header } from '../components/Header';
import { IconHeart, IconSettings, IconUser, IconMail, IconBriefcase } from '../components/Icons';

export function ProfilePage() {
  const { user, logout, updateUserProfile } = useAuth();
  const { favorites } = useFavorites();
  const [activeTab, setActiveTab] = useState<'info' | 'preferences' | 'favorites'>('info');

  if (!user) return <div style={{padding: '100px', textAlign: 'center'}}>Faça login</div>;

  const profile = user.profile || {};
  const getGenderLabel = (g?: string) => ({FEMALE: 'Mulher', MALE: 'Homem', OTHER: 'Outro', PREFER_NOT_SAY: 'Prefiro não dizer'}[g || ''] || '—');
  const getAgeLabel = (a?: string) => a ? `${a} anos` : '—';
  const getFreqLabel = (f?: string) => ({RARELY: 'Raramente', SOMETIMES: 'Às vezes', OFTEN: 'Frequentemente', ALWAYS: 'Sempre'}[f || ''] || '—');
  const getCompanionLabel = (c?: string) => ({ALONE: 'Sozinho(a)', COUPLE: 'Com parceiro(a)', FAMILY: 'Com família', FRIENDS: 'Com amigos', GROUP: 'Em grupo'}[c || ''] || '—');

  const getInitials = () => {
    const parts = user.full_name?.split(' ') || [];
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  };

  return (
    <div style={{background: '#F8FAFC', minHeight: '100vh'}}>
      <Header />
      <div style={{maxWidth: '1000px', margin: '0 auto', padding: '40px 24px'}}>
        {/* Card do Perfil */}
        <div style={{background: 'linear-gradient(135deg, #052659 0%, #0a3d7a 100%)', padding: '40px', borderRadius: '20px', color: 'white', marginBottom: '32px', position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(42, 194, 210, 0.2)', borderRadius: '50%'}} />
          <div style={{display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1, flexWrap: 'wrap'}}>
            <div style={{width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #2AC2D2 0%, #0EA5E9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '36px', fontWeight: 800, boxShadow: '0 8px 24px rgba(42, 194, 210, 0.3)'}}>
              {getInitials()}
            </div>
            <div style={{flex: 1, minWidth: '200px'}}>
              <h1 style={{fontSize: '32px', fontWeight: 800, margin: '0 0 8px 0'}}>{user.full_name}</h1>
              <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', opacity: 0.9}}>
                <span style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px'}}><IconMail width={16} height={16} /> {user.email}</span>
                <span style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px'}}><IconBriefcase width={16} height={16} /> {user.user_type === 'BUSINESS' ? 'Empresa' : 'Viajante'}</span>
              </div>
              {profile.profileCompleted && (
                <div style={{marginTop: '12px', display: 'inline-block', background: 'rgba(42, 194, 210, 0.3)', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 600}}>
                  ✓ Perfil Completo
                </div>
              )}
            </div>
            <button onClick={() => { logout(); }} style={{background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', padding: '10px 20px', borderRadius: '100px', color: 'white', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(10px)'}}>
              Sair
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px'}}>
          <button onClick={() => setActiveTab('info')} style={{padding: '12px 24px', border: 'none', background: activeTab === 'info' ? '#052659' : 'transparent', color: activeTab === 'info' ? 'white' : '#64748B', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <IconUser width={18} height={18} /> Informações
          </button>
          <button onClick={() => setActiveTab('preferences')} style={{padding: '12px 24px', border: 'none', background: activeTab === 'preferences' ? '#052659' : 'transparent', color: activeTab === 'preferences' ? 'white' : '#64748B', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <IconSettings width={18} height={18} /> Preferências
          </button>
          <button onClick={() => setActiveTab('favorites')} style={{padding: '12px 24px', border: 'none', background: activeTab === 'favorites' ? '#052659' : 'transparent', color: activeTab === 'favorites' ? 'white' : '#64748B', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <IconHeart width={18} height={18} /> Favoritos ({favorites.length})
          </button>
        </div>

        {/* Conteúdo */}
        <div style={{background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}>
          {activeTab === 'info' && (
            <div>
              <h2 style={{color: '#052659', marginBottom: '24px', fontSize: '24px', fontWeight: 700}}>Informações Pessoais</h2>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
                <InfoCard label="Nome Completo" value={user.full_name} />
                <InfoCard label="E-mail" value={user.email} />
                <InfoCard label="Tipo de Conta" value={user.user_type === 'BUSINESS' ? 'Empresa' : 'Viajante'} />
                <InfoCard label="Gênero" value={getGenderLabel(profile.gender)} />
                <InfoCard label="Faixa Etária" value={getAgeLabel(profile.ageRange)} />
                <InfoCard label="Frequência de Viagem" value={getFreqLabel(profile.travelFrequency)} />
                <InfoCard label="Costuma Viajar" value={getCompanionLabel(profile.companionType)} />
                <InfoCard label="Status do Perfil" value={profile.profileCompleted ? '✓ Completo' : '⚠ Incompleto'} highlight={profile.profileCompleted} />
              </div>
              {!profile.profileCompleted && (
                <Link to="/onboarding" style={{display: 'inline-block', marginTop: '24px', background: '#2AC2D2', color: 'white', padding: '12px 24px', borderRadius: '100px', textDecoration: 'none', fontWeight: 600}}>
                  Completar Perfil →
                </Link>
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div>
              <h2 style={{color: '#052659', marginBottom: '24px', fontSize: '24px', fontWeight: 700}}>Minhas Preferências</h2>
              {profile.disabilities && profile.disabilities.length > 0 ? (
                <div style={{marginBottom: '24px'}}>
                  <h3 style={{fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#0F172A'}}>Necessidades Específicas</h3>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                    {profile.disabilities.map((d: string) => (
                      <span key={d} style={{background: '#F0F9FF', color: '#052659', padding: '8px 16px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, border: '1px solid #BAE6FD'}}>{d}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{color: '#64748B', marginBottom: '24px'}}>Nenhuma necessidade específica cadastrada.</p>
              )}

              {profile.interests && profile.interests.length > 0 ? (
                <div>
                  <h3 style={{fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#0F172A'}}>Interesses</h3>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                    {profile.interests.map((i: string) => (
                      <span key={i} style={{background: '#FEF3C7', color: '#92400E', padding: '8px 16px', borderRadius: '100px', fontSize: '14px', fontWeight: 600, border: '1px solid #FDE68A'}}>{i}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{color: '#64748B'}}>Nenhum interesse cadastrado.</p>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div style={{textAlign: 'center', padding: '60px', color: '#64748B'}}>
              <IconHeart width={48} height={48} style={{marginBottom: '16px', opacity: 0.3}} />
              <p style={{fontSize: '16px', marginBottom: '8px'}}>Você ainda não salvou nenhum local</p>
              <Link to="/" style={{color: '#2AC2D2', fontWeight: 600}}>Explorar destinos →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{padding: '20px', background: '#F8FAFC', borderRadius: '12px', border: highlight ? '2px solid #2AC2D2' : '1px solid #E2E8F0'}}>
      <div style={{fontSize: '12px', color: '#64748B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600}}>{label}</div>
      <div style={{fontSize: '16px', fontWeight: 600, color: highlight ? '#059669' : '#0F172A'}}>{value}</div>
    </div>
  );
}