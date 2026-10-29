import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Gender, AgeRange, TravelFrequency, DisabilityType } from '../types';

// Ícones SVG minimalistas inline
const IconFemale = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M12 13v8"/><path d="M9 18h6"/></svg>;
const IconMale = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5"/><path d="M19 5l-5.4 5.4"/><path d="M19 5h-5"/><path d="M19 5v5"/></svg>;
const IconOther = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>;
const IconLock = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IconHome = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconPlane = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>;
const IconGlobe = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconMap = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;
const IconUser = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IconHeart = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const IconUsers = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconGroup = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconWheelchair = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="4" r="2"/><path d="M12 6v6"/><path d="M8 18h8"/><path d="M6 22a6 6 0 0 1 6-6"/><path d="M12 12l4 4"/></svg>;
const IconEye = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconEar = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 0 1-2 2"/></svg>;
const IconBrain = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;
const IconCheck = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconSparkles = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/><path d="M19 15l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z"/><path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z"/></svg>;
const IconBeach = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20c2-1 4-1 6 0s4 1 6 0 4-1 6 0"/><path d="M12 2v18"/><path d="M8 6c2-2 4-2 6 0"/><path d="M6 10c2-1 4-1 6 0"/></svg>;
const IconHotel = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/><path d="m9 16 .348-.24c1.465-1.013 3.84-1.013 5.304 0L15 16"/><path d="M8 7h.01"/><path d="M16 7h.01"/><path d="M12 7h.01"/><path d="M12 11h.01"/><path d="M12 15h.01"/><path d="M16 11h.01"/><path d="M16 15h.01"/><path d="M8 11h.01"/><path d="M8 15h.01"/></svg>;
const IconMuseum = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V10"/><path d="M19 21V10"/><path d="M9 21v-6h6v6"/><path d="M3 10l9-7 9 7"/><path d="M12 3v4"/></svg>;
const IconRestaurant = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>;
const IconTrail = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20l5-5 4 4 8-10"/><path d="M14 9l3 3"/><path d="M17 6l3 3"/></svg>;
const IconCulture = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
const IconTree = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-8"/><path d="M7 14l5-10 5 10H7z"/><path d="M5 18l7-6 7 6H5z"/></svg>;
const IconCity = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>;

const STEPS = [
  { id: 1, title: 'Qual é o seu gênero?', key: 'gender' },
  { id: 2, title: 'Qual é a sua faixa etária?', key: 'ageRange' },
  { id: 3, title: 'Com que frequência você viaja?', key: 'travelFrequency' },
  { id: 4, title: 'Como você costuma viajar?', key: 'companionType' },
  { id: 5, title: 'Você possui alguma necessidade específica?', key: 'disabilities' },
  { id: 6, title: 'Quais são seus interesses?', key: 'interests' },
];

const GENDER_OPTIONS: { value: Gender; label: string; icon: () => JSX.Element }[] = [
  { value: 'FEMALE', label: 'Mulher', icon: IconFemale },
  { value: 'MALE', label: 'Homem', icon: IconMale },
  { value: 'OTHER', label: 'Outro', icon: IconOther },
  { value: 'PREFER_NOT_SAY', label: 'Prefiro não dizer', icon: IconLock },
];

const AGE_OPTIONS: { value: AgeRange; label: string }[] = [
  { value: '18-24', label: '18 a 24 anos' },
  { value: '25-34', label: '25 a 34 anos' },
  { value: '35-44', label: '35 a 44 anos' },
  { value: '45-54', label: '45 a 54 anos' },
  { value: '55+', label: '55 anos ou mais' },
];

const FREQUENCY_OPTIONS: { value: TravelFrequency; label: string; icon: () => JSX.Element }[] = [
  { value: 'RARELY', label: 'Raramente', icon: IconHome },
  { value: 'SOMETIMES', label: 'Às vezes', icon: IconPlane },
  { value: 'OFTEN', label: 'Frequentemente', icon: IconGlobe },
  { value: 'ALWAYS', label: 'Sempre que possível', icon: IconMap },
];

const COMPANION_OPTIONS: { value: string; label: string; icon: () => JSX.Element }[] = [
  { value: 'ALONE', label: 'Sozinho(a)', icon: IconUser },
  { value: 'COUPLE', label: 'Com parceiro(a)', icon: IconHeart },
  { value: 'FAMILY', label: 'Com família', icon: IconUsers },
  { value: 'FRIENDS', label: 'Com amigos', icon: IconUsers },
  { value: 'GROUP', label: 'Em grupo', icon: IconGroup },
];

const DISABILITY_OPTIONS: { value: DisabilityType; label: string; icon: () => JSX.Element }[] = [
  { value: 'PHYSICAL', label: 'Mobilidade reduzida', icon: IconWheelchair },
  { value: 'VISUAL', label: 'Deficiência visual', icon: IconEye },
  { value: 'HEARING', label: 'Deficiência auditiva', icon: IconEar },
  { value: 'COGNITIVE', label: 'Deficiência cognitiva', icon: IconBrain },
  { value: 'NEURODIVERGENT', label: 'Neurodivergente', icon: IconBrain },
  { value: 'NONE', label: 'Nenhuma', icon: IconCheck },
  { value: 'OTHER', label: 'Outra', icon: IconSparkles },
];

const INTEREST_OPTIONS: { value: string; label: string; icon: () => JSX.Element }[] = [
  { value: 'beach', label: 'Praias', icon: IconBeach },
  { value: 'hotel', label: 'Hotéis', icon: IconHotel },
  { value: 'museum', label: 'Museus', icon: IconMuseum },
  { value: 'restaurant', label: 'Restaurantes', icon: IconRestaurant },
  { value: 'trail', label: 'Trilhas', icon: IconTrail },
  { value: 'culture', label: 'Cultura', icon: IconCulture },
  { value: 'nature', label: 'Natureza', icon: IconTree },
  { value: 'city', label: 'Cidades', icon: IconCity },
];

export function OnboardingPage() {
  const { user, updateUserProfile, isProfileComplete, getOnboardingStep } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(getOnboardingStep());
  const [answers, setAnswers] = useState<any>({});
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isProfileComplete()) {
      navigate('/');
      return;
    }
    const saved = user.profile || {};
    setAnswers({
      gender: saved.gender,
      ageRange: saved.ageRange,
      travelFrequency: saved.travelFrequency,
      companionType: saved.companionType,
      disabilities: saved.disabilities || [],
      interests: saved.interests || [],
    });
  }, [user, navigate, isProfileComplete]);

  const handleNext = () => {
    setAnimating(true);
    setTimeout(() => {
      const step = STEPS[currentStep];
      if (step) {
        updateUserProfile({ [step.key]: answers[step.key], onboardingStep: currentStep + 1 });
      }
      setAnimating(false);
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        updateUserProfile({ profileCompleted: true, onboardingStep: STEPS.length });
        navigate('/');
      }
    }, 300);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    updateUserProfile({ profileCompleted: true, onboardingStep: STEPS.length });
    navigate('/');
  };

  if (!user) return null;

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const step = STEPS[currentStep];

  return (
    <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #052659 0%, #0a3d7a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'rgba(42, 194, 210, 0.1)', borderRadius: '50%'}} />
      <div style={{position: 'absolute', bottom: '-100px', left: '-100px', width: '300px', height: '300px', background: 'rgba(42, 194, 210, 0.1)', borderRadius: '50%'}} />

      <div style={{background: 'white', borderRadius: '24px', padding: '48px', maxWidth: '600px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative', zIndex: 1}}>
        <div style={{marginBottom: '32px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
            <span style={{fontSize: '14px', color: '#64748B', fontWeight: 600}}>Passo {currentStep + 1} de {STEPS.length}</span>
            <button onClick={handleSkip} style={{background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '13px', fontWeight: 600}}>Pular →</button>
          </div>
          <div style={{height: '6px', background: '#E2E8F0', borderRadius: '100px', overflow: 'hidden'}}>
            <div style={{height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #2AC2D2 0%, #0EA5E9 100%)', borderRadius: '100px', transition: 'width 0.5s ease'}} />
          </div>
        </div>

        <h1 style={{fontSize: '28px', fontWeight: 800, color: '#052659', marginBottom: '8px', transition: 'all 0.3s', opacity: animating ? 0 : 1, transform: animating ? 'translateX(20px)' : 'translateX(0)'}}>
          {step?.title}
        </h1>
        <p style={{color: '#64748B', marginBottom: '32px', fontSize: '15px'}}>
          {currentStep === 0 && 'Essa informação nos ajuda a personalizar sua experiência.'}
          {currentStep === 1 && 'Queremos oferecer destinos adequados para sua idade.'}
          {currentStep === 2 && 'Assim podemos sugerir lugares com base nos seus hábitos.'}
          {currentStep === 3 && 'Para recomendar acomodações e atividades ideais.'}
          {currentStep === 4 && 'Selecione todas que se aplicam a você.'}
          {currentStep === 5 && 'Escolha os temas que mais te interessam.'}
        </p>

        <div style={{display: 'grid', gap: '12px', marginBottom: '32px', opacity: animating ? 0 : 1, transform: animating ? 'translateX(20px)' : 'translateX(0)', transition: 'all 0.3s'}}>
          {currentStep === 0 && GENDER_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button key={opt.value} onClick={() => setAnswers({...answers, gender: opt.value})} style={{padding: '18px 20px', border: `2px solid ${answers.gender === opt.value ? '#052659' : '#E2E8F0'}`, borderRadius: '12px', background: answers.gender === opt.value ? '#F0F9FF' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s', fontSize: '15px', fontWeight: 600, color: '#0F172A', textAlign: 'left'}}>
                <div style={{width: '40px', height: '40px', borderRadius: '10px', background: answers.gender === opt.value ? '#052659' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: answers.gender === opt.value ? 'white' : '#64748B', transition: 'all 0.2s'}}>
                  <Icon />
                </div>
                {opt.label}
                {answers.gender === opt.value && <span style={{marginLeft: 'auto', color: '#052659', fontSize: '20px', fontWeight: 800}}>✓</span>}
              </button>
            );
          })}

          {currentStep === 1 && AGE_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setAnswers({...answers, ageRange: opt.value})} style={{padding: '18px 20px', border: `2px solid ${answers.ageRange === opt.value ? '#052659' : '#E2E8F0'}`, borderRadius: '12px', background: answers.ageRange === opt.value ? '#F0F9FF' : 'white', cursor: 'pointer', fontSize: '15px', fontWeight: 600, color: '#0F172A', textAlign: 'left', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              {opt.label}
              {answers.ageRange === opt.value && <span style={{color: '#052659', fontSize: '20px', fontWeight: 800}}>✓</span>}
            </button>
          ))}

          {currentStep === 2 && FREQUENCY_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button key={opt.value} onClick={() => setAnswers({...answers, travelFrequency: opt.value})} style={{padding: '18px 20px', border: `2px solid ${answers.travelFrequency === opt.value ? '#052659' : '#E2E8F0'}`, borderRadius: '12px', background: answers.travelFrequency === opt.value ? '#F0F9FF' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s', fontSize: '15px', fontWeight: 600, color: '#0F172A', textAlign: 'left'}}>
                <div style={{width: '40px', height: '40px', borderRadius: '10px', background: answers.travelFrequency === opt.value ? '#052659' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: answers.travelFrequency === opt.value ? 'white' : '#64748B', transition: 'all 0.2s'}}>
                  <Icon />
                </div>
                {opt.label}
                {answers.travelFrequency === opt.value && <span style={{marginLeft: 'auto', color: '#052659', fontSize: '20px', fontWeight: 800}}>✓</span>}
              </button>
            );
          })}

          {currentStep === 3 && COMPANION_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button key={opt.value} onClick={() => setAnswers({...answers, companionType: opt.value})} style={{padding: '18px 20px', border: `2px solid ${answers.companionType === opt.value ? '#052659' : '#E2E8F0'}`, borderRadius: '12px', background: answers.companionType === opt.value ? '#F0F9FF' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.2s', fontSize: '15px', fontWeight: 600, color: '#0F172A', textAlign: 'left'}}>
                <div style={{width: '40px', height: '40px', borderRadius: '10px', background: answers.companionType === opt.value ? '#052659' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: answers.companionType === opt.value ? 'white' : '#64748B', transition: 'all 0.2s'}}>
                  <Icon />
                </div>
                {opt.label}
                {answers.companionType === opt.value && <span style={{marginLeft: 'auto', color: '#052659', fontSize: '20px', fontWeight: 800}}>✓</span>}
              </button>
            );
          })}

          {currentStep === 4 && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'}}>
              {DISABILITY_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const selected = answers.disabilities?.includes(opt.value);
                return (
                  <button key={opt.value} onClick={() => {
                    const current = answers.disabilities || [];
                    const updated = selected ? current.filter(v => v !== opt.value) : [...current, opt.value];
                    setAnswers({...answers, disabilities: updated});
                  }} style={{padding: '16px', border: `2px solid ${selected ? '#052659' : '#E2E8F0'}`, borderRadius: '12px', background: selected ? '#F0F9FF' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', fontSize: '14px', fontWeight: 600, color: '#0F172A', textAlign: 'left'}}>
                    <div style={{width: '36px', height: '36px', borderRadius: '8px', background: selected ? '#052659' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selected ? 'white' : '#64748B', flexShrink: 0}}>
                      <Icon />
                    </div>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {currentStep === 5 && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'}}>
              {INTEREST_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const selected = answers.interests?.includes(opt.value);
                return (
                  <button key={opt.value} onClick={() => {
                    const current = answers.interests || [];
                    const updated = selected ? current.filter(v => v !== opt.value) : [...current, opt.value];
                    setAnswers({...answers, interests: updated});
                  }} style={{padding: '16px', border: `2px solid ${selected ? '#052659' : '#E2E8F0'}`, borderRadius: '12px', background: selected ? '#F0F9FF' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', fontSize: '14px', fontWeight: 600, color: '#0F172A', textAlign: 'left'}}>
                    <div style={{width: '36px', height: '36px', borderRadius: '8px', background: selected ? '#052659' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selected ? 'white' : '#64748B', flexShrink: 0}}>
                      <Icon />
                    </div>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{display: 'flex', gap: '12px'}}>
          {currentStep > 0 && (
            <button onClick={handleBack} style={{flex: 1, padding: '16px', background: '#F1F5F9', color: '#052659', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit'}}>
              ← Voltar
            </button>
          )}
          <button onClick={handleNext} disabled={!answers[step?.key] && step?.key !== 'disabilities' && step?.key !== 'interests'} style={{flex: 1, padding: '16px', background: 'linear-gradient(135deg, #052659 0%, #0a3d7a 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '15px', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(5, 38, 89, 0.2)', opacity: (!answers[step?.key] && step?.key !== 'disabilities' && step?.key !== 'interests') ? 0.5 : 1, transition: 'all 0.3s'}}>
            {currentStep === STEPS.length - 1 ? 'Finalizar e Explorar →' : 'Continuar →'}
          </button>
        </div>
      </div>
    </div>
  );
}