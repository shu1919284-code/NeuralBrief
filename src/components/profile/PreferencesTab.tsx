import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PreferencesTabProps {
  wantsNewsletter: boolean;
  setWantsNewsletter: (val: boolean) => void;
  frequency: string;
  setFrequency: (val: string) => void;
  telegramUsername: string;
  setTelegramUsername: (val: string) => void;
  onboardingData?: {
    profession?: string;
    usageIntent?: string;
    referralSource?: string;
  } | null;
}

const ROLES: Record<string, { label: string, emoji: string }> = {
  'developer':  { label: 'Developer',   emoji: '⌨️' },
  'researcher': { label: 'Researcher',  emoji: '🔬' },
  'student':    { label: 'Student',     emoji: '🎓' },
  'founder':    { label: 'Founder',     emoji: '🚀' },
  'other':      { label: 'Other',       emoji: '✦'  },
};

const INTENTS: Record<string, { label: string, emoji: string }> = {
  'stay_updated':  { label: 'Stay updated on AI',      emoji: '📡' },
  'deep_research': { label: 'Deep research',           emoji: '🧠' },
  'work_projects': { label: 'Work projects',           emoji: '💼' },
  'curiosity':     { label: 'General curiosity',       emoji: '✦'  },
};

const REFERRALS: Record<string, { label: string, emoji: string }> = {
  'twitter':       { label: 'Twitter / X',             emoji: '𝕏'  },
  'friend':        { label: 'A friend',                emoji: '👋' },
  'google':        { label: 'Google Search',           emoji: '🔍' },
  'product_hunt':  { label: 'Product Hunt',            emoji: '🐱' },
  'other':         { label: 'Other',                   emoji: '✦'  },
};

const BORDER = 'rgba(240,234,214,0.08)';
const BORDER_H = 'rgba(240,234,214,0.2)';
const TEXT = '#f0ead6';
const TEXT_DIM = 'rgba(240,234,214,0.5)';
const TEXT_FAINT = 'rgba(240,234,214,0.25)';
const SURFACE2 = '#191916';
const GOLD = 'rgba(212,178,106,1)';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: TEXT_FAINT, marginBottom: 8 }}>
      {children}
    </div>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: SURFACE2, border: `0.5px solid ${BORDER}`, overflow: 'hidden' }}>
      {children}
    </div>
  );
}

function FieldRow({ icon, title, children, isLast = false }: { icon: React.ReactNode; title: React.ReactNode; children: React.ReactNode; isLast?: boolean }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 10, borderBottom: isLast ? 'none' : `0.5px solid ${BORDER}` }}
      onFocus={e => (e.currentTarget.style.borderColor = BORDER_H)}
      onBlur={e => (e.currentTarget.style.borderColor = isLast ? 'none' : BORDER)}
    >
      <div style={{ fontSize: 14, color: TEXT_FAINT, width: 16, flexShrink: 0, textAlign: 'center' }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: TEXT_DIM, marginBottom: 2 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function StyledSelect({ value, onChange, disabled, children }: { value: string; onChange: (v: string) => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          background: 'transparent', border: 'none', outline: 'none',
          fontSize: 12, color: TEXT, width: '100%',
          appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {children}
      </select>
      <svg style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: TEXT_FAINT }} width="10" height="6" viewBox="0 0 10 6" fill="none">
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function PreferencesTab({
  wantsNewsletter,
  setWantsNewsletter,
  frequency,
  setFrequency,
  telegramUsername,
  setTelegramUsername,
  onboardingData,
}: PreferencesTabProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Account Details ── */}
      {onboardingData && (onboardingData.profession || onboardingData.usageIntent) && (
        <div>
          <SectionLabel>{t('profile.account_details') || 'Account Details'}</SectionLabel>
          <FieldGroup>
            {onboardingData.profession && (
              <FieldRow icon={<span style={{ fontSize: 12 }}>{ROLES[onboardingData.profession]?.emoji || '👤'}</span>} title={t('profile.role') || 'Role'}>
                <div style={{ fontSize: 12, color: TEXT }}>
                  {ROLES[onboardingData.profession]?.label || onboardingData.profession}
                </div>
              </FieldRow>
            )}
            {onboardingData.usageIntent && (
              <FieldRow icon={<span style={{ fontSize: 12 }}>{INTENTS[onboardingData.usageIntent]?.emoji || '🎯'}</span>} title={t('profile.primary_intent') || 'Primary Intent'}>
                <div style={{ fontSize: 12, color: TEXT }}>
                  {INTENTS[onboardingData.usageIntent]?.label || onboardingData.usageIntent}
                </div>
              </FieldRow>
            )}
            {onboardingData.referralSource && (
              <FieldRow icon={<span style={{ fontSize: 12 }}>{REFERRALS[onboardingData.referralSource]?.emoji || '🌐'}</span>} title={t('profile.discovered_via') || 'Discovered Via'} isLast>
                <div style={{ fontSize: 12, color: TEXT }}>
                  {REFERRALS[onboardingData.referralSource]?.label || onboardingData.referralSource}
                </div>
              </FieldRow>
            )}
          </FieldGroup>
        </div>
      )}

      {/* ── Digest delivery ── */}
      <div>
        <SectionLabel>{t('profile.digest_delivery') || 'Digest delivery'}</SectionLabel>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: SURFACE2, border: `0.5px solid ${BORDER}` }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{t('profile.receive_weekly_digest') || 'Receive weekly digest'}</div>
            <div style={{ fontSize: 10, color: TEXT_FAINT, marginTop: 2 }}>{t('profile.get_briefing_by_email') || 'Get your AI briefing by email'}</div>
          </div>
          {/* Toggle */}
          <div
            onClick={() => setWantsNewsletter(!wantsNewsletter)}
            style={{
              width: 34, height: 19, borderRadius: 10, position: 'relative', cursor: 'pointer', flexShrink: 0,
              background: wantsNewsletter ? GOLD : 'transparent',
              border: `0.5px solid ${wantsNewsletter ? GOLD : BORDER_H}`,
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 2.5, borderRadius: '50%', width: 14, height: 14,
              background: wantsNewsletter ? '#111109' : TEXT_FAINT,
              left: wantsNewsletter ? 17.5 : 2.5,
              transition: 'all 0.2s',
            }} />
          </div>
        </div>
      </div>

      {/* ── Delivery settings ── */}
      <div>
        <SectionLabel>{t('profile.delivery_settings') || 'Delivery settings'}</SectionLabel>
        <FieldGroup>
          <FieldRow icon={<span style={{ fontSize: 12 }}>◷</span>} title={t('profile.frequency') || 'Frequency'}>
            <StyledSelect value={frequency} onChange={setFrequency} disabled={!wantsNewsletter}>
              <option value="daily"  style={{ background: '#191916', color: TEXT }}>{t('profile.daily_utc') || 'Daily — 07:00 UTC'}</option>
              <option value="weekly" style={{ background: '#191916', color: TEXT }}>{t('profile.weekly_monday') || 'Weekly — Monday'}</option>
            </StyledSelect>
          </FieldRow>
          <FieldRow icon={<span style={{ fontSize: 12 }}>✈</span>} title={<>{t('profile.telegram_optional') || 'Telegram (optional)'}</>} isLast>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, color: TEXT_FAINT }}>@</span>
              <input
                type="text"
                value={telegramUsername}
                onChange={e => setTelegramUsername(e.target.value.replace('@', ''))}
                placeholder="your_telegram_username"
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: TEXT, width: '100%' }}
              />
            </div>
          </FieldRow>
        </FieldGroup>
        <div style={{ fontSize: 10, color: TEXT_FAINT, marginTop: 6, lineHeight: 1.5 }}>
          {t('profile.telegram_hint') || 'Telegram pings you the moment your digest is ready.'}
        </div>
      </div>

      {/* ── Interface ── */}
      <div>
        <SectionLabel>{t('profile.interface') || 'Interface'}</SectionLabel>
        <FieldGroup>
          <FieldRow icon={<span style={{ fontSize: 12 }}>⌗</span>} title={t('profile.language') || 'Language'} isLast>
            <StyledSelect value={language} onChange={v => setLanguage(v as any)}>
              <option value="en" style={{ background: '#191916', color: TEXT }}>English</option>
              <option value="hi" style={{ background: '#191916', color: TEXT }}>Hindi</option>
              <option value="hg" style={{ background: '#191916', color: TEXT }}>Hinglish</option>
              <option value="es" style={{ background: '#191916', color: TEXT }}>Spanish</option>
              <option value="fr" style={{ background: '#191916', color: TEXT }}>French</option>
              <option value="de" style={{ background: '#191916', color: TEXT }}>German</option>
              <option value="ja" style={{ background: '#191916', color: TEXT }}>Japanese</option>
              <option value="it" style={{ background: '#191916', color: TEXT }}>Italian</option>
              <option value="pt" style={{ background: '#191916', color: TEXT }}>Portuguese</option>
              <option value="ru" style={{ background: '#191916', color: TEXT }}>Russian</option>
              <option value="ar" style={{ background: '#191916', color: TEXT }}>Arabic</option>
              <option value="nl" style={{ background: '#191916', color: TEXT }}>Dutch</option>
              <option value="ko" style={{ background: '#191916', color: TEXT }}>Korean</option>
              <option value="zh" style={{ background: '#191916', color: TEXT }}>Chinese</option>
            </StyledSelect>
          </FieldRow>
        </FieldGroup>
      </div>

    </div>
  );
}