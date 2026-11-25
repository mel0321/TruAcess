import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const key = '@TruAcess:a11y';

export function AccessibilityPanel() {
  const { user, updateUserProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    try { return { enabled: false, fontScale: 100, highContrast: false, spacing: false, simple: false, reading: false, reduceMotion: false, ...(JSON.parse(localStorage.getItem(key) || '{}') as object) }; }
    catch { return { enabled: false, fontScale: 100, highContrast: false, spacing: false, simple: false, reading: false, reduceMotion: false }; }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(settings));
    const root = document.documentElement;
    root.classList.toggle('a11y-panel-enabled', settings.enabled);
    root.classList.toggle('a11y-high-contrast', settings.highContrast);
    root.classList.toggle('a11y-expanded-spacing', settings.spacing);
    root.classList.toggle('a11y-simple-layout', settings.simple);
    root.classList.toggle('a11y-reading-mode', settings.reading);
    root.classList.toggle('a11y-reduced-motion', settings.reduceMotion);
    root.style.setProperty('--a11y-font-scale', `${settings.fontScale}%`);
  }, [settings]);

  const save = (next: typeof settings) => {
    setSettings(next);
    if (user) void updateUserProfile({ ...user.profile, accessibilityMode: next.enabled, accessibilitySettings: next }).catch(() => undefined);
  };

  const toggle = (name: 'enabled' | 'highContrast' | 'spacing' | 'simple' | 'reading' | 'reduceMotion') =>
    save({ ...settings, [name]: !settings[name] });

  return (
    <>
      <button type="button" className="a11y-float-button" aria-label="Abrir configurações de acessibilidade" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span aria-hidden="true">A</span><b>Acessibilidade</b>
      </button>
      {open && (
        <aside className="a11y-panel" aria-label="Painel de acessibilidade">
          <div className="a11y-panel-head"><div><span>PREFERÊNCIAS</span><h2>Acessibilidade</h2></div><button type="button" aria-label="Fechar painel" onClick={() => setOpen(false)}>×</button></div>
          <label className="a11y-master"><span><strong>Ativar modo acessível</strong><small>Aplica ajustes em todas as páginas</small></span><button type="button" role="switch" aria-checked={settings.enabled} className={settings.enabled ? 'is-on' : ''} onClick={() => toggle('enabled')}><span /></button></label>
          <div className="a11y-control"><span>Tamanho do texto</span><div><button type="button" aria-label="Diminuir fonte" onClick={() => save({...settings, fontScale: Math.max(85, settings.fontScale - 10)})}>A−</button><strong>{settings.fontScale}%</strong><button type="button" aria-label="Aumentar fonte" onClick={() => save({...settings, fontScale: Math.min(150, settings.fontScale + 10)})}>A+</button></div></div>
          <div className="a11y-options-grid">
            {([
              ['highContrast','Alto contraste'],['spacing','Mais espaçamento'],['simple','Interface simples'],['reading','Facilidade de leitura'],['reduceMotion','Reduzir movimentos']
            ] as const).map(([name,label]) => <label className="a11y-option" key={name}><span>{label}</span><input type="checkbox" checked={settings[name]} onChange={() => toggle(name)} /></label>)}
          </div>
        </aside>
      )}
    </>
  );
}
