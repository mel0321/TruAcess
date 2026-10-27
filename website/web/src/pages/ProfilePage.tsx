import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { Header } from '../components/Header';
import { IconSettings, IconHeart, IconShield, IconBrain, IconLibras, IconRamp, IconUser } from '../components/Icons';
import type { Place } from '../types';

export function ProfilePage() {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const [activeTab, setActiveTab] = useState<'info' | 'favorites'>('info');
  const [preferences, setPreferences] = useState({ needs_ramp: false, needs_tea: false, needs_libras: false, needs_braille: false, allows_guide_dog: false });
  const [favoritePlaces, setFavoritePlaces] = useState<Place[]>([]);

  useEffect(() => {
    const savedPrefs = localStorage.getItem(`@TruAcess:preferencias:${user?.id}`);
    if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
    setFavoritePlaces([]);
  }, [user, favorites]);

  const savePreferences = () => {
    localStorage.setItem(`@TruAcess:preferencias:${user?.id}`, JSON.stringify(preferences));
    alert('Preferências salvas!');
  };

  if (!user) return <div style={{padding: '100px', textAlign: 'center'}}>Faça login</div>;

  return (
    <div style={{background: '#F8FAFC', minHeight: '100vh'}}>
      <Header />
      <div className="container" style={{maxWidth: '1000px', padding: '40px 24px'}}>
        <div style={{background: 'white', padding: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px'}}>
          <div style={{width: '80px', height: '80px', borderRadius: '50%', background: '#052659', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px', fontWeight: 800}}>
            {user.full_name?.charAt(0)}
          </div>
          <div>
            <h1 style={{fontSize: '28px', fontWeight: 800, color: '#052659', margin: 0}}>{user.full_name}</h1>
            <p style={{color: '#64748B', margin: '4px 0 0 0'}}>{user.email}</p>
          </div>
        </div>

        <div style={{display: 'flex', gap: '8px', marginBottom: '24px'}}>
          <button onClick={() => setActiveTab('info')} style={{padding: '12px 24px', border: 'none', background: activeTab === 'info' ? '#052659' : '#E2E8F0', color: activeTab === 'info' ? 'white' : '#64748B', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'}}>Preferências</button>
          <button onClick={() => setActiveTab('favorites')} style={{padding: '12px 24px', border: 'none', background: activeTab === 'favorites' ? '#052659' : '#E2E8F0', color: activeTab === 'favorites' ? 'white' : '#64748B', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'}}>Favoritos ({favorites.length})</button>
        </div>

        <div style={{background: 'white', padding: '32px', borderRadius: '16px'}}>
          {activeTab === 'info' && (
            <div>
              <h2 style={{color: '#052659', marginBottom: '24px'}}>Minhas Necessidades</h2>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px'}}>
                {[
                  { key: 'needs_ramp', label: 'Preciso de rampas' },
                  { key: 'needs_tea', label: 'Ambiente TEA' },
                  { key: 'needs_libras', label: 'Intérprete de Libras' },
                  { key: 'needs_braille', label: 'Sinalização Braille' },
                  { key: 'allows_guide_dog', label: 'Viajo com cão-guia' },
                ].map(item => (
                  <label key={item.key} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#F8FAFC', border: '2px solid #E2E8F0', borderRadius: '12px', cursor: 'pointer'}}>
                    <input type="checkbox" checked={preferences[item.key as keyof typeof preferences]} onChange={e => setPreferences({...preferences, [item.key]: e.target.checked})} />
                    <span style={{fontWeight: 600}}>{item.label}</span>
                  </label>
                ))}
              </div>
              <button onClick={savePreferences} style={{background: '#052659', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '100px', fontWeight: 600, cursor: 'pointer'}}>Salvar</button>
            </div>
          )}
          {activeTab === 'favorites' && (
            <div style={{textAlign: 'center', padding: '60px', color: '#64748B'}}>
              <p>Você ainda não salvou nenhum local</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}