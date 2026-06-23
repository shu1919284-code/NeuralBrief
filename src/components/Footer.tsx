import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Volume2, VolumeX, X } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAudio } from '@/contexts/AudioContext';
import { db } from '@/lib/firebase';
import { hashEmail } from '@/lib/hash';

type SubscribeStatus = 'idle' | 'loading' | 'success' | 'error';

export function Footer(): React.JSX.Element {
  const { t } = useLanguage();
  const { isAudioEnabled, toggleAudio, playHoverSound } = useAudio();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<SubscribeStatus>('idle');
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const [audioToggleKey, setAudioToggleKey] = useState(0);

  const handleToggleAudio = () => {
    toggleAudio();
    setAudioToggleKey((k) => k + 1);
  };

  const scrollToSection = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>): void => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
    <footer className="pt-16 pb-28 md:pb-16 border-t border-border-subtle bg-surface px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 mb-16">

          {/* Subscription form */}
          <div className="max-w-sm w-full">
            <h4 className="font-heading text-xl italic mb-2">{t('footer_stay_ahead')}</h4>
            <p className="text-[9px] uppercase tracking-widest text-text-muted font-bold mb-6 opacity-60">
              {t('footer_no_noise')}
            </p>
            <div className="relative">
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full py-2"
                  >
                    <div className="flex items-center gap-2 py-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M 5 12 L 10 17 L 19 7" />
                      </svg>
                      <span className="text-sm italic text-text-main font-bold">{t('footer_see_tomorrow')}</span>
                    </div>
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
                    <div
                      className="pb-2 flex justify-between items-center w-full"
                      style={{
                        borderBottom: '1px solid',
                        borderColor: inputFocused
                          ? 'rgba(255, 255, 255, 0.85)'
                          : 'rgba(255, 255, 255, 0.25)',
                        transition: 'border-color 200ms ease',
                      }}
                    >
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
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
                        style={{
                          transform: inputFocused ? 'translateX(3px)' : 'translateX(0px)',
                          transition: 'transform 200ms ease',
                        }}
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
            <a href="#topics" onClick={scrollToSection('topics')} className="cursor-pointer hover:opacity-50 active:scale-95 transition-all">
              {t('nav.features')}
            </a>
            <a href="#how-it-works" onClick={scrollToSection('how-it-works')} className="cursor-pointer hover:opacity-50 active:scale-95 transition-all">
              {t('nav.howItWorks')}
            </a>
            <a href="#cta" onClick={scrollToSection('cta')} className="cursor-pointer hover:opacity-50 active:scale-95 transition-all">
              {t('nav.pricing')}
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row justify-between items-center text-[9px] uppercase
                     tracking-[0.4em] opacity-40 font-bold gap-6 border-t border-border-subtle pt-8"
        >
          <div>{t('footer.rights').replace(/\d{4}/, String(new Date().getFullYear()))}</div>
          <div className="flex gap-4">
            <button onClick={() => setShowTerms(true)} className="hover:opacity-100 transition-opacity cursor-pointer focus:outline-none">
              {t('footer.terms')}
            </button>
            <span>/</span>
            <button onClick={() => setShowPrivacy(true)} className="hover:opacity-100 transition-opacity cursor-pointer focus:outline-none">
              {t('footer.privacyPolicy')}
            </button>
          </div>

          <motion.button
            key={`audio-toggle-${audioToggleKey}`}
            onClick={handleToggleAudio}
            onMouseEnter={playHoverSound}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex items-center gap-2 hover:opacity-100 transition-opacity cursor-pointer
                       focus:outline-none"
            aria-label="Toggle Audio"
            aria-pressed={isAudioEnabled}
          >
            {isAudioEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            <span>{t('footer_sound')} {isAudioEnabled ? t('footer_sound_on') : t('footer_sound_off')}</span>
          </motion.button>

          <div>India / 28.6139° N, 77.2090° E</div>
        </div>
      </div>

      {/* ── Terms of Service Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showTerms && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-surface/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-surface border border-border-subtle rounded-xl p-6 w-full max-w-lg relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowTerms(false)}
                className="absolute top-5 right-5 text-text-muted hover:text-text-main transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
              <h3 className="font-heading text-2xl italic mb-6">{t('footer.terms')}</h3>
              <div className="space-y-4 text-xs text-text-muted leading-relaxed font-sans">
                <p>
                  Welcome to <strong>NeuralBrief</strong>. We believe in keeping legal agreements simple, transparent, and human-readable. Here are the core terms of our service:
                </p>
                <div>
                  <h4 className="font-bold text-text-main text-sm mb-1">1. The Service</h4>
                  <p>
                    NeuralBrief is an automated platform that aggregates technical news, filters it based on your topic preferences, generates brief summaries, and delivers them via email. The platform operates on automated schedulers and AI endpoints.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-text-main text-sm mb-1">2. Account Responsibility</h4>
                  <p>
                    You access the service via your Google account. You are responsible for maintaining the security of your account settings and preferences. We will only send digests to the email associated with your registered profile.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-text-main text-sm mb-1">3. Fair Use</h4>
                  <p>
                    You agree not to exploit, spam, overload, or abuse the platform's backend infrastructure or automated cron endpoints. The service is provided to individual readers for personal, non-commercial educational purposes.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-text-main text-sm mb-1">4. Service Availability</h4>
                  <p>
                    This service relies on API quotas (such as Gemini API free-tiers and Google Workspace limits). As such, we offer the service on an "as is" and "as available" basis without warranties of any kind regarding delivery speed, uptime, or correctness of AI-summarized briefs.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Privacy Policy Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showPrivacy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-surface/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-surface border border-border-subtle rounded-xl p-6 w-full max-w-lg relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowPrivacy(false)}
                className="absolute top-5 right-5 text-text-muted hover:text-text-main transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
              <h3 className="font-heading text-2xl italic mb-6">{t('footer.privacyPolicy')}</h3>
              <div className="space-y-4 text-xs text-text-muted leading-relaxed font-sans">
                <p>
                  At <strong>NeuralBrief</strong>, your privacy is our top priority. We do not engage in surveillance or data harvesting.
                </p>
                <div>
                  <h4 className="font-bold text-text-main text-sm mb-1">1. Zero Inbox Access</h4>
                  <p>
                    We never read, index, parse, or store the emails in your personal Google/Gmail inbox. The authorization tokens are used exclusively to deliver the generated briefings to you.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-text-main text-sm mb-1">2. Secure Hashing</h4>
                  <p>
                    When you subscribe, we encrypt your email identifier into a secure SHA-256 hash. This allows us to prevent duplicate sign-ups and manage database configurations securely without exposing your raw email address unnecessarily.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-text-main text-sm mb-1">3. Data Sharing</h4>
                  <p>
                    We do not sell, trade, or distribute your email address, selected topics, or subscription preferences to advertising agencies or any other third parties.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-text-main text-sm mb-1">4. Control & Deletion</h4>
                  <p>
                    You are in complete control of your data. You can update your topic selections, modify delivery frequency, disable digests, or request complete deletion of your account history directly from your profile settings at any time.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}

export default Footer;