import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MagneticButton } from './MagneticButton';

const EASE_SMOOTH: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface HeroProps {
  briefingData: any;
  loadingBriefing: boolean;
}

export function Hero({ briefingData, loadingBriefing }: HeroProps): React.JSX.Element {
  const { t } = useLanguage();
  const trustMetricsRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [lineTop, setLineTop] = useState<number | null>(null);

  useEffect(() => {
    const calculate = () => {
      if (!trustMetricsRef.current || !sectionRef.current) return;
      const sectionTop = sectionRef.current.getBoundingClientRect().top + window.scrollY;
      const metricsBottom =
        trustMetricsRef.current.getBoundingClientRect().bottom + window.scrollY;
      setLineTop(metricsBottom - sectionTop);
    };

    calculate();

    const resizeObserver = new ResizeObserver(calculate);
    if (trustMetricsRef.current) resizeObserver.observe(trustMetricsRef.current);
    if (sectionRef.current) resizeObserver.observe(sectionRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const scrollToSection = (id: string) => (e?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e?.preventDefault();
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const headlineWords = t('hero.headline').split(' ');

  return (
    <section ref={sectionRef} className="relative pt-24 pb-24 px-6 md:px-16 max-w-4xl mx-auto text-center" id="hero">
      {/* Background Hero Glow */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 transition-colors duration-1000"
        style={{ background: 'var(--hero-glow)' }}
        aria-hidden="true"
      />

      {/* Vertical breathing line */}
      {lineTop !== null && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          whileInView={{ opacity: 1, height: 300 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
          className="hidden md:block absolute left-1/2 w-[1px] bg-border-subtle -translate-x-1/2 z-0"
          style={{ top: lineTop }}
        />
      )}

      {/* Status badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0, ease: 'linear' }}
        role="status"
        aria-label="System status: Monitoring AI Research, News and Model Releases"
        className="inline-flex items-center gap-3 bg-transparent py-2 px-4 border border-border-subtle
                   text-[10px] uppercase tracking-[0.3em] font-bold text-text-muted mb-8"
      >
        <span className="badge-status-dot" />
        {t('hero.badge') || 'Monitoring AI Research, News & Model Releases'}
      </motion.div>

      {/* Main headline */}
      <h1 className="font-heading text-5xl sm:text-7xl md:text-[6rem] leading-[0.9] mb-6 tracking-tight">
        {headlineWords.map((word, i) => (
          <React.Fragment key={`${word}-${i}`}>
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: EASE_SMOOTH }}
              className="inline-block"
            >
              {word}
            </motion.span>
            {i < headlineWords.length - 1 && ' '}
          </React.Fragment>
        ))}
      </h1>

      {/* Subheadline */}
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8, ease: EASE_SMOOTH }}
        className="text-2xl md:text-3xl font-heading italic text-text-main mb-6"
      >
        {t('hero.subheadline')}
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0, ease: EASE_SMOOTH }}
        className="text-sm md:text-base text-text-muted max-w-2xl mx-auto mb-12 leading-relaxed"
      >
        {t('hero.description')}
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2, ease: EASE_SMOOTH }}
        className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16 relative z-10"
      >
        <MagneticButton
          onClick={scrollToSection('preview')}
          className="group inline-flex items-center justify-center gap-3 px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_var(--color-theme-glow)] bg-[var(--color-accent)] text-[var(--curr-surface)] w-full sm:w-auto"
        >
          {t('hero.ctaPrimary') || "See Today's Briefing"}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </MagneticButton>
        <a
          href="#process"
          onClick={scrollToSection('process')}
          className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-border-subtle text-text-main
                     text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-bg-subtle hover:border-text-muted
                     active:scale-95 transition-all cursor-pointer w-full sm:w-auto"
        >
          {t('hero.ctaSecondary') || 'How It Works'}
        </a>
      </motion.div>

      {/* Trust Metrics & Source Strip */}
      <motion.div
        ref={trustMetricsRef}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 1.4, ease: EASE_SMOOTH }}
        className="flex flex-col gap-6 max-w-2xl mx-auto mt-12 p-8 border-t border-border-subtle"
      >
        <div className="text-[10px] uppercase tracking-widest text-text-muted font-bold">
          {t('hero.trustMetrics') || '5-Min Read • 500+ Sources • Personalized Topics'}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-text-muted opacity-70">
          {t('hero.trustSources') || 'Research Papers • Open-Source Projects • Model Releases • Industry News'}
        </div>
      </motion.div>

      {/* P10 — Mini Briefing Snippet */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.8 }}
        className="max-w-lg mx-auto mt-8 border border-border-subtle p-4"
      >
        {/* Header row */}
        <div className="flex justify-between items-center border-b border-border-subtle pb-2 mb-3">
          <span className="text-[9px] uppercase tracking-widest text-text-muted font-bold">NeuralBrief</span>
          <span className="text-[9px] uppercase tracking-widest text-text-muted font-bold">07:00 UTC Today</span>
        </div>

        {/* Briefing lines */}
        {loadingBriefing ? (
          <>
            <div className="h-3 bg-text-muted/15 rounded w-full animate-pulse py-1 mb-1" />
            <div className="h-3 bg-text-muted/10 rounded w-4/5 animate-pulse py-1" />
          </>
        ) : briefingData ? (
          <>
            <p className="text-[10px] text-text-muted leading-relaxed font-mono py-1">
              ● {briefingData.title}
            </p>
            <p className="text-[10px] text-text-muted leading-relaxed font-mono py-1">
              ● {briefingData.summary?.slice(0, 80)}...
            </p>
          </>
        ) : (
          <>
            <p className="text-[10px] text-text-muted leading-relaxed font-mono py-1">
              ● OpenAI releases o3-mini with 94.2% AIME benchmark score
            </p>
            <p className="text-[10px] text-text-muted leading-relaxed font-mono py-1">
              ● Anthropic Claude 3.5 context window expanded to 500k tokens
            </p>
          </>
        )}

        {/* Footer row */}
        <div className="text-[9px] text-text-muted uppercase tracking-widest border-t border-border-subtle mt-2 pt-2">
          {loadingBriefing
            ? 'Loading signals...'
            : briefingData
              ? 'Live signal • ~3 min read'
              : '2 signals • ~3 min read'
          }
        </div>
      </motion.div>
    </section>
  );
}

export default Hero;