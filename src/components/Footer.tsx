import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Volume2, VolumeX } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAudio } from '@/contexts/AudioContext';
import { db } from '@/lib/firebase';
import { hashEmail } from '@/lib/hash';

type SubscribeStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Site-wide footer with email subscription form and audio toggle.
 * Subscription is de-duplicated via a SHA-256 hashed Firestore document ID so
 * the same email address can never create two records.
 */
export function Footer(): React.JSX.Element {
  const { t } = useLanguage();
  const { isAudioEnabled, toggleAudio, playHoverSound } = useAudio();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<SubscribeStatus>('idle');

  /**
   * Handles the email subscription form submission.
   * Validates the address, writes (or merges) a subscriber document keyed by
   * the SHA-256 hash of the lowercase-trimmed email, then shows inline feedback.
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('loading');
    try {
      const hashedId = await hashEmail(trimmed);
      await setDoc(
        doc(db, 'subscribers', hashedId),
        { email: trimmed, subscribedAt: serverTimestamp(), active: true },
        { merge: true },
      );
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 5000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <footer className="py-16 border-t border-border-subtle bg-surface px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mb-16">

          {/* Subscription form */}
          <div className="max-w-sm w-full">
            <h4 className="font-heading text-xl italic mb-4">{t('footer.tagline')}</h4>
            <div className="relative">
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full py-2 text-sm italic text-primary font-bold"
                  >
                    {t('footer.ctaButton')}
                  </motion.div>
                ) : status === 'error' ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full py-2 text-sm italic text-red-500 font-bold"
                  >
                    {t('hero.errorMessage')}
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full relative"
                  >
                    <div className="border-b border-text-main pb-2 flex justify-between items-center w-full">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('footer.emailPlaceholder')}
                        disabled={status === 'loading'}
                        className="bg-transparent border-none outline-none w-full text-sm italic
                                   placeholder-text-muted disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="cursor-pointer hover:opacity-50 active:scale-75 transition-all
                                   disabled:opacity-50 bg-transparent border-none p-0 outline-none"
                      >
                        {status === 'loading' ? (
                          <div className="w-4 h-4 rounded-full border-2 border-text-main border-t-transparent animate-spin" />
                        ) : (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex gap-6 text-[10px] uppercase tracking-[0.2em] font-bold">
            <span className="cursor-pointer hover:opacity-50 active:scale-95 transition-all">
              {t('nav.features')}
            </span>
            <span className="cursor-pointer hover:opacity-50 active:scale-95 transition-all">
              {t('nav.howItWorks')}
            </span>
            <span className="cursor-pointer hover:opacity-50 active:scale-95 transition-all">
              {t('nav.pricing')}
            </span>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row justify-between items-center text-[9px] uppercase
                     tracking-[0.4em] opacity-40 font-bold gap-6 border-t border-border-subtle pt-8"
        >
          <div>{t('footer.rights')}</div>
          <button
            onClick={toggleAudio}
            onMouseEnter={playHoverSound}
            className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer
                       focus:outline-none"
            aria-label="Toggle Audio"
          >
            {isAudioEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            <span>Sound {isAudioEnabled ? 'On' : 'Off'}</span>
          </button>
          <div>Berlin / 52.5200° N, 13.4050° E</div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;