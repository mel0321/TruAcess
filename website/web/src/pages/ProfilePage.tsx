import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { Header } from '../components/Header';
import api from '../services/api';
import { IconHeart, IconSettings, IconUser, IconMail, IconBriefcase, IconCamera, IconTrash2, IconEdit3, IconLogOut, IconMessageCircle, IconMapPin, IconStar, IconCheck, IconX, IconAlertTriangle } from '../components/Icons';

interface Comment {
  id: number;
  place_id: number;
  place_name?: string;
  experience_rating: number;
  comment_text: string;
  created_at: string;
}

export function ProfilePage() {
  const { user, logout, deleteAccount, updateUser, refreshUser } = useAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'edit' | 'comments' | 'favorites' | 'settings'>('info');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.full_name);
      setEditNickname((user as any)?.nickname || '');
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'comments') {
      loadComments();
    }
  }, [user, activeTab]);

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const response = await api.get('/users/comments');
      setComments(response.data.comments);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  if (!user) return <div style={{padding: '100px', textAlign: 'center'}}>Faça login</div>;

  const profile = user.profile || {};
  const getInitials = () => {
    const parts = user.full_name?.split(' ') || [];
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await api.post('/users/avatar', formData);
      await refreshUser();
      setEditSuccess('Foto atualizada com sucesso!');
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (error) {
      console.error('Erro ao upload de foto:', error);
      alert('Erro ao fazer upload da foto');
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await api.put('/users/profile', { profile_picture: null });
      await refreshUser();
      setEditSuccess('Foto removida com sucesso!');
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (error) {
      alert('Erro ao remover foto');
    }
  };

  const handleSaveProfile = async () => {
    setEditLoading(true);
    try {
      await updateUser({ full_name: editName, nickname: editNickname });
      setEditSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (error) {
      alert('Erro ao atualizar perfil');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleteLoading(true);
    
    const result = await deleteAccount({ password: deletePassword });
    
    if (result.success) {
      navigate('/login');
    } else {
      setDeleteError(result.message);
    }
    
    setDeleteLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{background: '#F8FAFC', minHeight: '100vh'}}>
      <Header />
      <div style={{maxWidth: '1000px', margin: '0 auto', padding: '40px 24px'}}>
        
        <div style={{background: 'linear-gradient(135deg, #052659 0%, #0a3d7a 100%)', padding: '40px', borderRadius: '20px', color: 'white', marginBottom: '32px', position: 'relative', overflow: 'hidden'}}>
          <div style={{position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(42, 194, 210, 0.2)', borderRadius: '50%'}} />
          <div style={{display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1, flexWrap: 'wrap'}}>
            <div style={{position: 'relative'}}>
              {user.profile_picture ? (
                <img src={user.profile_picture} alt="Foto" style={{width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #2AC2D2', boxShadow: '0 8px 24px rgba(0,0,0,0.2)'}} />
              ) : (
                <div style={{width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #2AC2D2 0%, #0EA5E9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '36px', fontWeight: 800, boxShadow: '0 8px 24px rgba(42, 194, 210, 0.3)'}}>
                  {getInitials()}
                </div>
              )}
            </div>
            <div style={{flex: 1, minWidth: '200px'}}>
              <h1 style={{fontSize: '32px', fontWeight: 800, margin: '0 0 8px 0'}}>{user.full_name}</h1>
              {(user as any)?.nickname && <p style={{margin: '0 0 8px 0', opacity: 0.8, fontSize: '15px'}}>@{(user as any).nickname}</p>}
              <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', opacity: 0.9, fontSize: '14px'}}>
                <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><IconMail width={16} height={16} /> {user.email}</span>
                <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}><IconBriefcase width={16} height={16} /> {user.user_type === 'BUSINESS' ? 'Empresa' : 'Viajante'}</span>
              </div>
              {profile.profileCompleted && (
                <div style={{marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(42, 194, 210, 0.3)', padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 600}}>
                  <IconCheck width={14} height={14} /> Perfil Completo
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #E2E8F0', paddingBottom: '8px', flexWrap: 'wrap'}}>
          <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')} icon={<IconUser width={18} height={18} />}>Informações</TabButton>
          <TabButton active={activeTab === 'edit'} onClick={() => { setActiveTab('edit'); setEditName(user.full_name); setEditNickname((user as any)?.nickname || ''); }} icon={<IconEdit3 width={18} height={18} />}>Editar Perfil</TabButton>
          <TabButton active={activeTab === 'comments'} onClick={() => setActiveTab('comments')} icon={<IconMessageCircle width={18} height={18} />}>Comentários</TabButton>
          <TabButton active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} icon={<IconHeart width={18} height={18} />}>Favoritos</TabButton>
          <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<IconSettings width={18} height={18} />}>Configurações</TabButton>
        </div>

        <div style={{background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}>
          
          {activeTab === 'info' && (
            <div>
              <h2 style={{color: '#052659', marginBottom: '24px', fontSize: '24px', fontWeight: 700}}>Informações Pessoais</h2>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
                <InfoCard label="Nome Completo" value={user.full_name} />
                <InfoCard label="Apelido" value={(user as any)?.nickname || '—'} />
                <InfoCard label="E-mail" value={user.email} />
                <InfoCard label="Tipo de Conta" value={user.user_type === 'BUSINESS' ? 'Empresa' : 'Viajante'} />
                <InfoCard label="Gênero" value={profile.gender === 'FEMALE' ? 'Mulher' : profile.gender === 'MALE' ? 'Homem' : profile.gender === 'OTHER' ? 'Outro' : profile.gender === 'PREFER_NOT_SAY' ? 'Prefiro não dizer' : '—'} />
                <InfoCard label="Faixa Etária" value={profile.ageRange ? `${profile.ageRange} anos` : '—'} />
                <InfoCard label="Frequência de Viagem" value={profile.travelFrequency === 'RARELY' ? 'Raramente' : profile.travelFrequency === 'SOMETIMES' ? 'Às vezes' : profile.travelFrequency === 'OFTEN' ? 'Frequentemente' : profile.travelFrequency === 'ALWAYS' ? 'Sempre' : '—'} />
                <InfoCard label="Costuma Viajar" value={profile.companionType === 'ALONE' ? 'Sozinho(a)' : profile.companionType === 'COUPLE' ? 'Com parceiro(a)' : profile.companionType === 'FAMILY' ? 'Com família' : profile.companionType === 'FRIENDS' ? 'Com amigos' : profile.companionType === 'GROUP' ? 'Em grupo' : '—'} />
                <InfoCard label="Status do Perfil" value={profile.profileCompleted ? 'Completo' : 'Incompleto'} highlight={profile.profileCompleted} />
              </div>
              {!profile.profileCompleted && (
                <Link to="/onboarding" style={{display: 'inline-block', marginTop: '24px', background: '#2AC2D2', color: 'white', padding: '12px 24px', borderRadius: '100px', textDecoration: 'none', fontWeight: 600}}>
                  Completar Perfil
                </Link>
              )}
            </div>
          )}

          {activeTab === 'edit' && (
            <div>
              <h2 style={{color: '#052659', marginBottom: '24px', fontSize: '24px', fontWeight: 700}}>Editar Perfil</h2>
              
              {editSuccess && (
                <div style={{background: '#D1FAE5', color: '#065F46', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #6EE7B7'}}>
                  <IconCheck width={18} height={18} /> {editSuccess}
                </div>
              )}

              <div style={{marginBottom: '32px', padding: '24px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0'}}>
                <h3 style={{fontSize: '16px', fontWeight: 700, color: '#052659', marginBottom: '16px'}}>Foto de Perfil</h3>
                <div style={{display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap'}}>
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt="Foto" style={{width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #2AC2D2'}} />
                  ) : (
                    <div style={{width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #052659, #2AC2D2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '28px', fontWeight: 800}}>
                      {getInitials()}
                    </div>
                  )}
                  <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                    <button onClick={() => fileInputRef.current?.click()} style={{background: '#052659', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'}}>
                      <IconCamera width={16} height={16} /> {user.profile_picture ? 'Trocar foto' : 'Adicionar foto'}
                    </button>
                    {user.profile_picture && (
                      <button onClick={handleRemovePhoto} style={{background: '#FEE2E2', color: '#991B1B', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'}}>
                        <IconTrash2 width={16} height={16} /> Remover
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{display: 'none'}} />
                </div>
              </div>

              <div style={{display: 'grid', gap: '20px', marginBottom: '24px'}}>
                <div>
                  <label style={{display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#0F172A'}}>Nome completo</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={{width: '100%', padding: '14px 16px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'}} />
                </div>
                <div>
                  <label style={{display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#0F172A'}}>Apelido</label>
                  <input type="text" value={editNickname} onChange={e => setEditNickname(e.target.value)} placeholder="Como quer ser chamado(a)?" style={{width: '100%', padding: '14px 16px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'}} />
                </div>
              </div>

              <button onClick={handleSaveProfile} disabled={editLoading} style={{background: 'linear-gradient(135deg, #052659 0%, #0a3d7a 100%)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 15px rgba(5, 38, 89, 0.2)', opacity: editLoading ? 0.7 : 1}}>
                {editLoading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          )}

          {activeTab === 'comments' && (
            <div>
              <h2 style={{color: '#052659', marginBottom: '24px', fontSize: '24px', fontWeight: 700}}>Meus Comentários</h2>
              {commentsLoading ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#64748B'}}>Carregando comentários...</div>
              ) : comments.length > 0 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  {comments.map((comment) => (
                    <div key={comment.id} style={{padding: '20px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <IconMapPin width={16} height={16} style={{color: '#2AC2D2'}} />
                          <strong style={{color: '#052659'}}>{comment.place_name || `Local #${comment.place_id}`}</strong>
                        </div>
                        <span style={{fontSize: '13px', color: '#64748B'}}>{comment.created_at}</span>
                      </div>
                      <div style={{display: 'flex', gap: '4px', marginBottom: '8px'}}>
                        {[...Array(5)].map((_, i) => (
                          <IconStar key={i} width={16} height={16} fill={i < comment.experience_rating ? '#F59E0B' : 'none'} stroke={i < comment.experience_rating ? '#F59E0B' : '#E2E8F0'} />
                        ))}
                      </div>
                      <p style={{color: '#334155', lineHeight: '1.6', margin: 0}}>{comment.comment_text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '60px', color: '#64748B'}}>
                  <IconMessageCircle width={48} height={48} style={{marginBottom: '16px', opacity: 0.3}} />
                  <p style={{fontSize: '16px', marginBottom: '8px'}}>Você ainda não fez nenhum comentário</p>
                  <Link to="/" style={{color: '#2AC2D2', fontWeight: 600}}>Explorar destinos para comentar</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              <h2 style={{color: '#052659', marginBottom: '24px', fontSize: '24px', fontWeight: 700}}>Lugares Salvos</h2>
              {favorites.length > 0 ? (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px'}}>
                  {favorites.map(id => (
                    <div key={id} style={{padding: '20px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px'}}>
                      <IconMapPin width={24} height={24} style={{color: '#2AC2D2', flexShrink: 0}} />
                      <div>
                        <div style={{fontWeight: 600, color: '#052659', fontSize: '14px'}}>Local #{id}</div>
                        <Link to={`/local/${id}`} style={{fontSize: '13px', color: '#2AC2D2', textDecoration: 'none'}}>Ver detalhes</Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign: 'center', padding: '60px', color: '#64748B'}}>
                  <IconHeart width={48} height={48} style={{marginBottom: '16px', opacity: 0.3}} />
                  <p style={{fontSize: '16px', marginBottom: '8px'}}>Você ainda não salvou nenhum local</p>
                  <Link to="/" style={{color: '#2AC2D2', fontWeight: 600}}>Explorar destinos</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 style={{color: '#052659', marginBottom: '24px', fontSize: '24px', fontWeight: 700}}>Configurações da Conta</h2>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <SettingsButton 
                  icon={<IconEdit3 width={20} height={20} />} 
                  label="Editar perfil" 
                  description="Modificar informações pessoais"
                  onClick={() => setActiveTab('edit')} 
                />
                <SettingsButton 
                  icon={<IconCamera width={20} height={20} />} 
                  label="Alterar foto" 
                  description="Adicionar, trocar ou remover foto de perfil"
                  onClick={() => { setActiveTab('edit'); setTimeout(() => fileInputRef.current?.click(), 100); }} 
                />
                <SettingsButton 
                  icon={<IconSettings width={20} height={20} />} 
                  label="Configurações de acessibilidade" 
                  description="Personalizar opções de acessibilidade"
                  onClick={() => !profile.profileCompleted && navigate('/onboarding')} 
                />
                <SettingsButton 
                  icon={<IconMessageCircle width={20} height={20} />} 
                  label="Meus comentários" 
                  description="Consultar comentários publicados"
                  onClick={() => setActiveTab('comments')} 
                />
                <SettingsButton 
                  icon={<IconHeart width={20} height={20} />} 
                  label="Lugares salvos" 
                  description="Acessar lugares favoritos"
                  onClick={() => setActiveTab('favorites')} 
                />
                
                <div style={{height: '1px', background: '#E2E8F0', margin: '12px 0'}} />
                
                <SettingsButton 
                  icon={<IconLogOut width={20} height={20} />} 
                  label="Trocar de conta" 
                  description="Sair da conta atual"
                  onClick={handleLogout}
                  color="#052659"
                />
                <SettingsButton 
                  icon={<IconTrash2 width={20} height={20} />} 
                  label="Excluir perfil" 
                  description="Excluir permanentemente a conta"
                  onClick={() => setShowDeleteModal(true)}
                  color="#EF4444"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px', backdropFilter: 'blur(4px)'}}>
          <div style={{background: 'white', borderRadius: '20px', padding: '32px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'}}>
            <div style={{width: '64px', height: '64px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'}}>
              <IconAlertTriangle width={32} height={32} style={{color: '#EF4444'}} />
            </div>
            <h3 style={{fontSize: '22px', fontWeight: 800, color: '#052659', textAlign: 'center', marginBottom: '12px'}}>Excluir conta permanentemente?</h3>
            <p style={{color: '#64748B', textAlign: 'center', marginBottom: '24px', lineHeight: '1.6', fontSize: '14px'}}>
              Esta ação é <strong style={{color: '#EF4444'}}>irreversível</strong>. Todos os seus dados, comentários e favoritos serão excluídos permanentemente.
            </p>
            
            {deleteError && (
              <div style={{background: '#FEE2E2', color: '#991B1B', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', textAlign: 'center'}}>
                {deleteError}
              </div>
            )}

            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#0F172A'}}>Digite sua senha para confirmar</label>
              <input 
                type="password" 
                value={deletePassword} 
                onChange={e => setDeletePassword(e.target.value)} 
                placeholder="Sua senha atual"
                style={{width: '100%', padding: '14px 16px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'}} 
              />
            </div>

            <div style={{display: 'flex', gap: '12px'}}>
              <button onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }} style={{flex: 1, padding: '14px', background: '#F1F5F9', color: '#052659', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                <IconX width={18} height={18} /> Cancelar
              </button>
              <button onClick={handleDeleteAccount} disabled={deleteLoading} style={{flex: 1, padding: '14px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: deleteLoading ? 0.7 : 1}}>
                <IconTrash2 width={18} height={18} /> {deleteLoading ? 'Excluindo...' : 'Excluir Conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{padding: '12px 20px', border: 'none', background: active ? '#052659' : 'transparent', color: active ? 'white' : '#64748B', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', transition: 'all 0.2s'}}>
      {icon} {children}
    </button>
  );
}

function SettingsButton({ icon, label, description, onClick, color = '#052659' }: { icon: React.ReactNode; label: string; description: string; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} style={{width: '100%', padding: '18px 20px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s', textAlign: 'left'}}
      onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = color; }}
      onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}>
      <div style={{width: '44px', height: '44px', borderRadius: '10px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0}}>
        {icon}
      </div>
      <div style={{flex: 1}}>
        <div style={{fontWeight: 700, color: '#0F172A', fontSize: '15px', marginBottom: '2px'}}>{label}</div>
        <div style={{fontSize: '13px', color: '#64748B'}}>{description}</div>
      </div>
    </button>
  );
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{padding: '20px', background: '#F8FAFC', borderRadius: '12px', border: highlight ? '2px solid #2AC2D2' : '1px solid #E2E8F0'}}>
      <div style={{fontSize: '12px', color: '#64748B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600}}>{label}</div>
      <div style={{fontSize: '16px', fontWeight: 600, color: highlight ? '#059669' : '#0F172A', display: 'flex', alignItems: 'center', gap: '8px'}}>
        {highlight && <IconCheck width={18} height={18} />}
        {value}
      </div>
    </div>
  );
}