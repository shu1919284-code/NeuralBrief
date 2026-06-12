import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { MagneticButton } from '@/components/MagneticButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/lib/firebase';
import { hashEmail } from '@/lib/hash';

type SubscribeStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Landing page hero section.
 * Renders the headline, subheadline, email subscription form, stats row, and
 * social-proof brand strip. Subscription is de-duplicated via a SHA-256 hashed
 * document ID so the same email address can never create two Firestore records.
 */
export function Hero(): React.JSX.Element {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<SubscribeStatus>('idle');

  /**
   * Handles email subscription form submission.
   * Validates the address, writes (or merges) a subscriber document keyed by
   * the SHA-256 hash of the email, then shows inline success or error feedback.
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
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <section className="relative pt-24 pb-24 px-6 md:px-16 max-w-6xl mx-auto text-center" id="hero">
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        whileInView={{ opacity: 1, height: 300 }}
        viewport={{ once: true }}
        transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
        className="hidden md:block absolute left-1/2 top-[450px] w-[1px] bg-border-subtle -translate-x-1/2 z-0"
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex items-center gap-3 bg-transparent py-2 px-4 border border-border-subtle
                   text-[10px] uppercase tracking-[0.3em] font-bold text-text-muted mb-8"
      >
        <span className="badge-status-dot" />
        Multi-Agent Orchestration v4.2.0
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="font-heading text-5xl sm:text-7xl md:text-[7rem] leading-[0.9] mb-6 tracking-tight"
      >
        {t('hero.headline')}
        <br />
        <span className="italic">{t('hero.subheadline')}</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="text-sm md:text-base text-text-muted max-w-2xl mx-auto mb-12 leading-relaxed"
      >
        {t('hero.emailPlaceholder')}
      </motion.p>

      <motion.form
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl mx-auto mb-16 relative z-10"
        onSubmit={handleSubmit}
      >
        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full text-center py-2 text-sm italic border-b border-transparent
                         text-primary font-bold"
            >
              {t('hero.successMessage')}
            </motion.div>
          ) : status === 'error' ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full text-center py-2 text-sm italic border-b border-red-500
                         text-red-500 font-bold"
            >
              {t('hero.errorMessage')}
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col sm:flex-row gap-0 border-b border-text-main pb-2 w-full"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
                placeholder={t('hero.emailPlaceholder')}
                className="bg-transparent border-none flex-1 py-2 px-2 text-text-main
                           placeholder-text-muted/50 focus:outline-none focus:ring-0 w-full
                           font-sans italic text-sm disabled:opacity-50"
              />
              <MagneticButton
                className="text-text-main font-bold py-2 px-4 text-[10px] uppercase tracking-widest
                           hover:opacity-50 active:scale-95 transition-all cursor-pointer
                           bg-transparent border-none disabled:opacity-50"
              >
                {status === 'loading' ? '...' : t('hero.ctaButton')}
              </MagneticButton>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto mb-20 p-8
                   border-t border-border-subtle"
      >
        <div className="flex flex-col gap-1">
          <span className="font-heading text-3xl md:text-4xl text-text-main italic">15+</span>
          <span className="text-[10px] uppercase tracking-widest text-text-muted mt-2 font-bold">
            {t('hero.ctaButton')}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-heading text-3xl md:text-4xl text-text-main italic">05:00</span>
          <span className="text-[10px] uppercase tracking-widest text-text-muted mt-2 font-bold">
            {t('engine.step2')}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-heading text-3xl md:text-4xl text-text-main italic">0%</span>
          <span className="text-[10px] uppercase tracking-widest text-text-muted mt-2 font-bold">
            {t('features.badge3')}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-8 opacity-70"
      >
        <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold">
          {t('cta.subtitle')}
        </span>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 font-heading italic text-xl">
          <span>Google</span>
          <span>Meta</span>
          <span>Hugging Face</span>
          <span>Stripe</span>
        </div>
      </motion.div>
    </section>
  );
}

export default Hero;