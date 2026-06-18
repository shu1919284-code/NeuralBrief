import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Landing page hero section.
 * Email subscription has been consolidated to the bottom CTA section.
 * The hero CTA button scrolls the user down to #cta where they can subscribe.
 */
export function Hero(): React.JSX.Element {
  const { t } = useLanguage();

  const scrollToCTA = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const ctaSection = document.getElementById('cta');
    if (ctaSection) {
      ctaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative pt-24 pb-24 px-6 md:px-16 max-w-6xl mx-auto text-center" id="hero">
      {/* Vertical breathing line */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        whileInView={{ opacity: 1, height: 300 }}
        viewport={{ once: true }}
        transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
        className="hidden md:block absolute left-1/2 top-[450px] w-[1px] bg-border-subtle -translate-x-1/2 z-0"
      />

      {/* Status badge */}
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

      {/* Main headline */}
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

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="text-sm md:text-base text-text-muted max-w-2xl mx-auto mb-12 leading-relaxed"
      >
        {t('hero.description')}
      </motion.p>

      {/* Single CTA — scrolls to #cta subscription form */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl mx-auto mb-16 relative z-10"
      >
        <a
          href="#cta"
          onClick={scrollToCTA}
          className="inline-flex items-center gap-3 text-[11px] uppercase tracking-widest font-bold
                     border-b border-text-main pb-2 text-text-main hover:opacity-50
                     active:scale-95 transition-all cursor-pointer"
        >
          Subscribe to Weekly Digest
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </a>
      </motion.div>

      {/* Stats row */}
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

      {/* Social proof strip */}
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