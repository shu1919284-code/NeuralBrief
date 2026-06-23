import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { TopicsTab } from './profile/TopicsTab';
import { PreferencesTab } from './profile/PreferencesTab';
import { BookmarksTab } from './profile/BookmarksTab';
import { useLanguage } from '../contexts/LanguageContext';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GOLD = 'rgba(212,178,106,1)';
const GOLD_MID = 'rgba(212,178,106,0.3)';
const GOLD_DIM = 'rgba(212,178,106,0.1)';

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [wantsNewsletter, setWantsNewsletter] = useState(false);
  const [frequency, setFrequency] = useState('daily');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [topicsLastChanged, setTopicsLastChanged] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'topics' | 'preferences' | 'bookmarks'>('topics');

  useEffect(() => {
    if (isOpen && user) loadPreferences();
  }, [isOpen, user]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWantsNewsletter(data.wantsNewsletter ?? (data.digestFrequency !== 'none'));
        setFrequency(data.frequency ?? data.digestFrequency ?? 'daily');
        setSelectedTopics(data.topics ?? []);
        setTelegramUsername(data.telegramUsername ?? '');
        setTopicsLastChanged(data.topicsLastChanged ?? null);
      }
    } catch (e) {
      console.error('Failed to load preferences:', e);
    } finally {
      setLoading(false);
    }
  };

  const canChangeTopics = (): boolean => {
    if (!topicsLastChanged) return true;
    return Date.now() - topicsLastChanged > SEVEN_DAYS_MS;
  };

  const daysUntilTopicChange = (): number => {
    if (!topicsLastChanged) return 0;
    const diff = SEVEN_DAYS_MS - (Date.now() - topicsLastChanged);
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  };

  const toggleTopic = (topicId: string) => {
    if (!canChangeTopics()) return;
    setSelectedTopics(prev =>
      prev.includes(topicId) ? prev.filter(t => t !== topicId) : [...prev, topicId]
    );
  };

  const savePreferences = async () => {
    if (!user) return;
    if (selectedTopics.length === 0) {
      alert(t('profile.select_at_least_one_topic') || 'Please select at least one topic!');
      return;
    }
    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      const topicsChanged = canChangeTopics();
      const digestFreq = wantsNewsletter ? frequency : 'none';
      await setDoc(docRef, {
        wantsNewsletter,
        frequency,
        digestFrequency: digestFreq,
        topics: selectedTopics,
        telegramUsername: telegramUsername.replace('@', '').trim(),
        topicsLastChanged: topicsChanged ? Date.now() : topicsLastChanged,
        updatedAt: serverTimestamp(),
        email: user.email,
        displayName: user.displayName,
      }, { merge: true });
      if (topicsChanged) setTopicsLastChanged(Date.now());
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      console.error('Failed to save preferences:', e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'topics',      label: t('profile.topics')      },
    { id: 'preferences', label: t('profile.preferences') },
    { id: 'bookmarks',   label: t('profile.bookmarks')   },
  ] as const;

  return (
    <AnimatePresence>
      <motion.div
        key="profile-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(8,8,6,0.88)', backdropFilter: 'blur(12px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="profile-modal"
          initial={{ y: 24, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 16, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[480px] flex flex-col overflow-hidden"
          style={{
            background: '#111109',
            border: `0.5px solid ${GOLD_MID}`,
            maxHeight: '88vh',
          }}
        >
          {/* Gold accent top bar */}
          <div style={{ height: 1.5, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, flexShrink: 0 }} />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 transition-opacity hover:opacity-60 cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'rgba(240,234,214,0.4)' }}
          >
            <X size={16} />
          </button>

          {/* ── Header ── */}
          <div style={{ padding: '18px 22px 0', flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, opacity: 0.7, marginBottom: 12 }}>
              NeuralBrief
            </div>

            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                {/* Animated avatar ring */}
                <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                  <div style={{
                    position: 'absolute', inset: -3, borderRadius: '50%',
                    background: 'conic-gradient(rgba(212,178,106,0.8) 0deg, transparent 120deg, rgba(212,178,106,0.8) 240deg, transparent 360deg)',
                    animation: 'pm-spin 4s linear infinite',
                  }} />
                  <div style={{
                    position: 'absolute', inset: -3, borderRadius: '50%',
                    background: 'conic-gradient(transparent 0deg, rgba(212,178,106,0.35) 60deg, transparent 180deg)',
                    animation: 'pm-spin 3s linear infinite reverse',
                  }} />
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      referrerPolicy="no-referrer"
                      style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', position: 'relative', zIndex: 2, border: '2px solid #111109' }}
                    />
                  ) : (
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', background: '#1f1f1b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: GOLD,
                      position: 'relative', zIndex: 2, border: '2px solid #111109',
                    }}>
                      {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#f0ead6' }}>{user.displayName || 'Anonymous'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(240,234,214,0.4)', marginTop: 2 }}>{user.email}</div>
                  {/* Active badge */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, animation: 'pm-pulse 2s infinite' }} />
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD, opacity: 0.65 }}>{t('profile.active_subscriber') || 'Active subscriber'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 0.5, background: 'rgba(240,234,214,0.08)', margin: '0 22px', flexShrink: 0 }} />

          {/* ── Tabs ── */}
          <div style={{ display: 'flex', padding: '0 22px', borderBottom: '0.5px solid rgba(240,234,214,0.08)', flexShrink: 0 }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="cursor-pointer transition-colors"
                style={{
                  flex: 1,
                  padding: '13px 0 11px',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  border: 'none',
                  background: 'none',
                  color: activeTab === tab.id ? '#f0ead6' : 'rgba(240,234,214,0.3)',
                  position: 'relative',
                }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-underline"
                    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, background: GOLD }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* ── Tab body ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px 22px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(240,234,214,0.08) transparent' }}>
            {!user ? (
              <div style={{ fontSize: 13, color: 'rgba(240,234,214,0.4)', textAlign: 'center', paddingTop: 32 }}>
                {t('profile.login_required')}
              </div>
            ) : loading ? (
              <div style={{ fontSize: 12, color: 'rgba(240,234,214,0.35)', textAlign: 'center', paddingTop: 32, fontStyle: 'italic' }}>
                {t('profile.loading')}
              </div>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  {activeTab === 'topics' && (
                    <motion.div key="topics" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
                      <TopicsTab
                        selectedTopics={selectedTopics}
                        toggleTopic={toggleTopic}
                        canChangeTopics={canChangeTopics}
                        daysUntilTopicChange={daysUntilTopicChange}
                      />
                    </motion.div>
                  )}
                  {activeTab === 'preferences' && (
                    <motion.div key="preferences" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
                      <PreferencesTab
                        wantsNewsletter={wantsNewsletter}
                        setWantsNewsletter={setWantsNewsletter}
                        frequency={frequency}
                        setFrequency={setFrequency}
                        telegramUsername={telegramUsername}
                        setTelegramUsername={setTelegramUsername}
                      />
                    </motion.div>
                  )}
                  {activeTab === 'bookmarks' && (
                    <motion.div key="bookmarks" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
                      <BookmarksTab />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Save button */}
                {activeTab !== 'bookmarks' && (
                  <div style={{ marginTop: 20 }}>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={savePreferences}
                      disabled={saving}
                      className="cursor-pointer w-full transition-all"
                      style={{
                        background: 'transparent',
                        border: `0.5px solid ${GOLD_MID}`,
                        color: GOLD,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        padding: '11px 0',
                        opacity: saving ? 0.5 : 1,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = GOLD_DIM)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {saving ? t('profile.saving') : t('profile.save')}
                    </motion.button>

                    <AnimatePresence>
                      {saveStatus === 'success' && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ fontSize: 10, textAlign: 'center', marginTop: 10, color: '#4ade80', letterSpacing: '0.04em' }}>
                          {t('profile.saved')}
                        </motion.div>
                      )}
                      {saveStatus === 'error' && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          style={{ fontSize: 10, textAlign: 'center', marginTop: 10, color: '#f87171', letterSpacing: '0.04em' }}>
                          {t('profile.save_error')}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Keyframes */}
          <style>{`
            @keyframes pm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes pm-pulse { 0%,100% { opacity:0.5; transform:scale(1); } 50% { opacity:1; transform:scale(1.3); } }
          `}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}