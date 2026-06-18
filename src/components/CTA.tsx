import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/firebase';
import { hashEmail } from '../lib/hash';

export function CTA() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
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
        { merge: true }
      );
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Error subscribing:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <section id="cta" className="px-6 md:px-16 py-24 mb-10 overflow-hidden text-text-main">
      <motion.div 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl mx-auto"
      >
        <div className="bg-surface-dim border border-border-subtle p-12 md:p-20 text-center rounded-tl-[60px] rounded-br-[60px]">
          <h2 className="font-heading text-5xl md:text-6xl mb-6">{t('cta_title_1')} <span className="italic">{t('cta_title_2')}</span></h2>
          <p className="text-[10px] uppercase tracking-widest opacity-80 mb-10 font-bold">
            {t('cta_desc')}
          </p>
          <div className="flex justify-center flex-wrap gap-4 relative z-10 mx-auto min-w-[280px] w-full max-w-sm">
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="w-full text-center py-2 text-sm italic border-b border-transparent text-primary font-bold"
                >
                  Successfully subscribed. Welcome.
                </motion.div>
              ) : (
                <motion.form 
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="w-full relative"
                >
                  <div className={`border-b pb-2 flex justify-between items-center w-full transition-colors ${status === 'error' ? 'border-red-500' : 'border-text-main'}`}>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@address.com"
                      disabled={status === 'loading'}
                      className="bg-transparent border-none outline-none w-full text-sm italic placeholder-text-muted disabled:opacity-50"
                    />
                    <button type="submit" disabled={status === 'loading'} className="cursor-pointer hover:opacity-50 active:scale-75 transition-all disabled:opacity-50 bg-transparent border-none p-0 outline-none">
                      {status === 'loading' ? (
                        <div className="w-4 h-4 rounded-full border-2 border-text-main border-t-transparent animate-spin" />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                      )}
                    </button>
                  </div>
                  {status === 'error' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -bottom-6 left-0 text-[10px] text-red-500 uppercase tracking-widest font-bold">
                      Please enter a valid email.
                    </motion.div>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
