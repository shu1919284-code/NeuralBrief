import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { TopicsTab } from './profile/TopicsTab';
import { PreferencesTab } from './profile/PreferencesTab';
import { BookmarksTab } from './profile/BookmarksTab';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
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
      alert('Please select at least one topic!');
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
    { id: 'topics', label: 'Topics' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'bookmarks', label: 'Bookmarks' },
  ] as const;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-surface/90 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="bg-surface border border-border-subtle rounded-xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-text-muted hover:text-text-main transition-colors cursor-pointer z-10"
          >
            <X size={20} />
          </button>

          <h3 className="font-heading text-2xl italic mb-4">Your Profile</h3>

          {user ? (
            <div className="space-y-5">
              {/* User Info */}
              <div className="flex items-center gap-4 border-b border-border-subtle pb-4">
                {user.photoURL && (
                  <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-border-subtle object-cover" referrerPolicy="no-referrer" />
                )}
                <div>
                  <div className="font-bold text-sm">{user.displayName || 'Anon'}</div>
                  <div className="text-xs text-text-muted">{user.email}</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-surface-dim rounded-lg p-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 text-[10px] uppercase tracking-widest font-bold py-2 rounded-md transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-surface text-text-main shadow-sm'
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="text-sm text-text-muted italic py-4 text-center">Loading...</div>
              ) : (
                <>
                  {/* TOPICS TAB */}
                  {activeTab === 'topics' && (
                    <TopicsTab
                      selectedTopics={selectedTopics}
                      toggleTopic={toggleTopic}
                      canChangeTopics={canChangeTopics}
                      daysUntilTopicChange={daysUntilTopicChange}
                    />
                  )}

                  {/* PREFERENCES TAB */}
                  {activeTab === 'preferences' && (
                    <PreferencesTab
                      wantsNewsletter={wantsNewsletter}
                      setWantsNewsletter={setWantsNewsletter}
                      frequency={frequency}
                      setFrequency={setFrequency}
                      telegramUsername={telegramUsername}
                      setTelegramUsername={setTelegramUsername}
                    />
                  )}

                  {/* BOOKMARKS TAB */}
                  {activeTab === 'bookmarks' && (
                    <BookmarksTab />
                  )}

                  {/* Save Button */}
                  {activeTab !== 'bookmarks' && (
                    <button
                      onClick={savePreferences}
                      disabled={saving}
                      className="w-full bg-transparent text-text-main font-bold py-2.5 px-4 border border-border-subtle hover:border-text-main text-xs uppercase tracking-widest hover:bg-surface-dim active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer rounded"
                    >
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  )}

                  <AnimatePresence>
                    {saveStatus === 'success' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs italic text-center text-green-500">
                        ✅ Preferences saved!
                      </motion.div>
                    )}
                    {saveStatus === 'error' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-red-500 italic text-center">
                        ❌ Failed to save. Try again.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          ) : (
            <div className="text-sm text-text-muted">Please sign in to view your profile.</div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
