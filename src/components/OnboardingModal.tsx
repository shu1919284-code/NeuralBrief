import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'welcome' | 'role' | 'intent' | 'referral' | 'done';

interface Choice {
  value: string;
  label: string;
  emoji: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROLES: Choice[] = [
  { value: 'developer',   label: 'Developer',   emoji: '⌨️' },
  { value: 'researcher',  label: 'Researcher',  emoji: '🔬' },
  { value: 'student',     label: 'Student',     emoji: '🎓' },
  { value: 'founder',     label: 'Founder',     emoji: '🚀' },
  { value: 'other',       label: 'Other',       emoji: '✦'  },
];

const INTENTS: Choice[] = [
  { value: 'stay_updated',   label: 'Stay updated on AI',      emoji: '📡' },
  { value: 'deep_research',  label: 'Deep research',           emoji: '🧠' },
  { value: 'work_projects',  label: 'Work projects',           emoji: '💼' },
  { value: 'curiosity',      label: 'General curiosity',       emoji: '✦'  },
];

const REFERRALS: Choice[] = [
  { value: 'twitter',        label: 'Twitter / X',             emoji: '𝕏'  },
  { value: 'friend',         label: 'A friend',                emoji: '👋' },
  { value: 'google',         label: 'Google Search',           emoji: '🔍' },
  { value: 'product_hunt',   label: 'Product Hunt',            emoji: '🐱' },
  { value: 'other',          label: 'Other',                   emoji: '✦'  },
];

const SCREEN_ORDER: Screen[] = ['welcome', 'role', 'intent', 'referral', 'done'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCountryFromTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function getSessionCount(): number {
  const raw = localStorage.getItem('nb_session_count');
  return raw ? parseInt(raw, 10) : 0;
}

function incrementSessionCount(): void {
  const count = getSessionCount();
  localStorage.setItem('nb_session_count', String(count + 1));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressDots({ current }: { current: number }) {
  // Steps: role(1), intent(2), referral(3)
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <div
          key={step}
          className="transition-all duration-300"
          style={{
            width: current === step ? 20 : 6,
            height: 6,
            borderRadius: 3,
            background: current >= step
              ? 'var(--color-accent, rgba(212,178,106,1))'
              : 'rgba(240,234,214,0.15)',
          }}
        />
      ))}
    </div>
  );
}

function ChoiceGrid({
  choices,
  selected,
  onSelect,
  type,
}: {
  choices: Choice[];
  selected: string;
  onSelect: (v: string) => void;
  type: 'role' | 'intent' | 'referral';
}) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-2 gap-2 mt-6">
      {choices.map((c) => {
        const active = selected === c.value;
        return (
          <motion.button
            key={c.value}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(c.value)}
            className="flex items-center gap-3 px-4 py-3 border text-left transition-all duration-150 cursor-pointer focus:outline-none"
            style={{
              background: active ? 'rgba(212,178,106,0.1)' : 'rgba(255,255,255,0.03)',
              borderColor: active ? 'rgba(212,178,106,0.5)' : 'rgba(240,234,214,0.1)',
            }}
          >
            <span className="text-base leading-none flex-shrink-0">{c.emoji}</span>
            <span
              className="text-xs font-semibold leading-tight transition-colors"
              style={{ color: active ? 'var(--color-text-main, #f0ead6)' : 'rgba(240,234,214,0.55)' }}
            >
              {t(`onboarding_${type}_${c.value}`)}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const { user, isNewUser } = useAuth();
  const { t } = useLanguage();

  const [screen, setScreen]         = useState<Screen>('welcome');
  const [role, setRole]             = useState('');
  const [intent, setIntent]         = useState('');
  const [referral, setReferral]     = useState('');
  const [saving, setSaving]         = useState(false);
  const [visible, setVisible]       = useState(false);

  // Decide whether to show based on isNewUser + session count for returning skippers
  useEffect(() => {
    if (!user) return;
    if (isNewUser) {
      setVisible(true);
      return;
    }
    // Returning user who skipped: nudge after 3 sessions
    incrementSessionCount();
    const count = getSessionCount();
    if (count >= 3) {
      setVisible(true);
    }
  }, [user, isNewUser]);

  if (!visible || !user) return null;

  const stepIndex = SCREEN_ORDER.indexOf(screen);

  // ── Save to Firestore ──
  const saveOnboarding = async (skipped: boolean) => {
    if (!user) return;
    setSaving(true);
    try {
      const ref = doc(db, 'users', user.uid);
      await updateDoc(ref, {
        profession:             skipped ? null : role,
        usageIntent:            skipped ? null : intent,
        referralSource:         skipped ? null : referral,
        timezone:               getCountryFromTimezone(),
        onboardingComplete:     !skipped,
        onboardingSkipped:      skipped,
        onboardingCompletedAt:  skipped ? null : serverTimestamp(),
      });
    } catch (e) {
      console.error('[Onboarding] Failed to save:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    await saveOnboarding(true);
    localStorage.setItem('nb_session_count', '0');
    setVisible(false);
    onComplete();
  };

  const handleFinish = async () => {
    await saveOnboarding(false);
    setScreen('done');
    setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 2200);
  };

  const canContinue = () => {
    if (screen === 'role')    return role !== '';
    if (screen === 'intent')  return intent !== '';
    if (screen === 'referral')return referral !== '';
    return true;
  };

  const handleContinue = () => {
    const next = SCREEN_ORDER[stepIndex + 1];
    if (next === 'done') {
      handleFinish();
    } else {
      setScreen(next);
    }
  };

  // ── Slide direction ──
  const variants = {
    enter:  { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0  },
    exit:   { opacity: 0, x: -24 },
  };

  return (
    <AnimatePresence>
      <motion.div
        key="onboarding-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{ background: 'rgba(8,8,6,0.92)', backdropFilter: 'blur(12px)' }}
      >
        <motion.div
          key="onboarding-modal"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md overflow-hidden"
          style={{
            background: '#111109',
            border: '0.5px solid rgba(212,178,106,0.3)',
          }}
        >
          {/* Gold top bar */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(212,178,106,0.8), transparent)' }} />

          <div className="p-8">
            {/* Eyebrow */}
            <div
              className="text-[9px] font-bold tracking-[0.16em] uppercase mb-6"
              style={{ color: 'rgba(212,178,106,0.7)' }}
            >
              NeuralBrief
            </div>

            <AnimatePresence mode="wait">

              {/* ── WELCOME ── */}
              {screen === 'welcome' && (
                <motion.div key="welcome" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <div className="mb-8">
                    {/* Animated avatar ring */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <div
                          className="absolute inset-[-3px] rounded-full"
                          style={{
                            background: 'conic-gradient(rgba(212,178,106,0.8) 0deg, transparent 120deg, rgba(212,178,106,0.8) 240deg, transparent 360deg)',
                            animation: 'nb-spin 4s linear infinite',
                          }}
                        />
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="Profile"
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full relative z-10"
                            style={{ border: '2px solid #111109' }}
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full relative z-10 flex items-center justify-center text-sm font-bold"
                            style={{ background: '#1f1f1b', color: 'rgba(212,178,106,1)', border: '2px solid #111109' }}
                          >
                            {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: '#f0ead6' }}>
                          {t('onboarding_welcome_back').replace('{name}', user.displayName?.split(' ')[0] ?? 'there')}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'rgba(240,234,214,0.4)' }}>{user.email}</div>
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold leading-tight mb-3" style={{ color: '#f0ead6', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                      {t('onboarding_welcome_title')}
                    </h2>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,234,214,0.45)' }}>
                      {t('onboarding_welcome_desc')}
                    </p>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setScreen('role')}
                    className="w-full py-3 text-xs font-bold tracking-[0.12em] uppercase transition-all cursor-pointer"
                    style={{ background: 'rgba(212,178,106,0.12)', border: '0.5px solid rgba(212,178,106,0.4)', color: 'rgba(212,178,106,1)' }}
                    whileHover={{ background: 'rgba(212,178,106,0.18)' }}
                  >
                    {t('onboarding_welcome_start')}
                  </motion.button>

                  <button
                    onClick={handleSkip}
                    className="w-full mt-3 py-2 text-[10px] tracking-widest uppercase cursor-pointer transition-opacity hover:opacity-70"
                    style={{ background: 'none', border: 'none', color: 'rgba(240,234,214,0.25)' }}
                  >
                    {t('onboarding_skip')}
                  </button>
                </motion.div>
              )}

              {/* ── ROLE ── */}
              {screen === 'role' && (
                <motion.div key="role" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <ProgressDots current={1} />
                  <h2 className="text-lg font-bold mb-1" style={{ color: '#f0ead6' }}>{t('onboarding_role_title')}</h2>
                  <p className="text-xs" style={{ color: 'rgba(240,234,214,0.4)' }}>{t('onboarding_role_desc')}</p>
                  <ChoiceGrid choices={ROLES} selected={role} onSelect={setRole} type="role" />
                  <div className="flex items-center justify-between mt-6">
                    <button onClick={handleSkip} className="text-[10px] uppercase tracking-widest cursor-pointer hover:opacity-70 transition-opacity" style={{ background: 'none', border: 'none', color: 'rgba(240,234,214,0.25)' }}>
                      {t('onboarding_skip_short')}
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleContinue}
                      disabled={!canContinue()}
                      className="px-6 py-2.5 text-xs font-bold tracking-[0.1em] uppercase transition-all cursor-pointer disabled:opacity-30"
                      style={{ background: 'rgba(212,178,106,0.12)', border: '0.5px solid rgba(212,178,106,0.4)', color: 'rgba(212,178,106,1)' }}
                    >
                      {t('onboarding_continue')}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── INTENT ── */}
              {screen === 'intent' && (
                <motion.div key="intent" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <ProgressDots current={2} />
                  <h2 className="text-lg font-bold mb-1" style={{ color: '#f0ead6' }}>{t('onboarding_intent_title')}</h2>
                  <p className="text-xs" style={{ color: 'rgba(240,234,214,0.4)' }}>{t('onboarding_intent_desc')}</p>
                  <ChoiceGrid choices={INTENTS} selected={intent} onSelect={setIntent} type="intent" />
                  <div className="flex items-center justify-between mt-6">
                    <button onClick={() => setScreen('role')} className="text-[10px] uppercase tracking-widest cursor-pointer hover:opacity-70 transition-opacity" style={{ background: 'none', border: 'none', color: 'rgba(240,234,214,0.25)' }}>
                      {t('onboarding_back')}
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleContinue}
                      disabled={!canContinue()}
                      className="px-6 py-2.5 text-xs font-bold tracking-[0.1em] uppercase transition-all cursor-pointer disabled:opacity-30"
                      style={{ background: 'rgba(212,178,106,0.12)', border: '0.5px solid rgba(212,178,106,0.4)', color: 'rgba(212,178,106,1)' }}
                    >
                      {t('onboarding_continue')}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── REFERRAL ── */}
              {screen === 'referral' && (
                <motion.div key="referral" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <ProgressDots current={3} />
                  <h2 className="text-lg font-bold mb-1" style={{ color: '#f0ead6' }}>{t('onboarding_referral_title')}</h2>
                  <p className="text-xs" style={{ color: 'rgba(240,234,214,0.4)' }}>{t('onboarding_referral_desc')}</p>
                  <ChoiceGrid choices={REFERRALS} selected={referral} onSelect={setReferral} type="referral" />
                  <div className="flex items-center justify-between mt-6">
                    <button onClick={() => setScreen('intent')} className="text-[10px] uppercase tracking-widest cursor-pointer hover:opacity-70 transition-opacity" style={{ background: 'none', border: 'none', color: 'rgba(240,234,214,0.25)' }}>
                      {t('onboarding_back')}
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleContinue}
                      disabled={!canContinue() || saving}
                      className="px-6 py-2.5 text-xs font-bold tracking-[0.1em] uppercase transition-all cursor-pointer disabled:opacity-30"
                      style={{ background: 'rgba(212,178,106,0.12)', border: '0.5px solid rgba(212,178,106,0.4)', color: 'rgba(212,178,106,1)' }}
                    >
                      {saving ? t('onboarding_saving') : t('onboarding_done')}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ── DONE ── */}
              {screen === 'done' && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="py-8 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 14 }}
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: 'rgba(212,178,106,0.12)', border: '0.5px solid rgba(212,178,106,0.4)' }}
                  >
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <path d="M4 11.5L8.5 16L18 7" stroke="rgba(212,178,106,1)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: '#f0ead6', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                    {t('onboarding_done_title')}
                  </h2>
                  <p className="text-sm" style={{ color: 'rgba(240,234,214,0.45)' }}>
                    {t('onboarding_done_desc')}
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Spin keyframe injected inline */}
          <style>{`@keyframes nb-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
