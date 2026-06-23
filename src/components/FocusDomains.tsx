import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Bot, BrainCircuit, Cpu, Settings, Zap, Briefcase, Code2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { BookmarkButton } from './BookmarkButton';

// ─── constants ────────────────────────────────────────────────────────────────

const CARD_ENTRANCE_EASE = [0.16, 1, 0.3, 1] as const;
const CARD_ENTRANCE_DURATION = 0.45; // 450ms
const CARD_STAGGER_MS = 0.09;        // 90ms per card

const HOVER_LIFT_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const HOVER_LIFT_DURATION = '300ms';
const HOVER_BORDER_DURATION = '250ms';

// Bookmark pulse keyframes are injected once as a <style> tag.
// scale(1) -> scale(1.3) -> scale(1) with spring overshoot easing.
const BOOKMARK_PULSE_KEYFRAMES = `
@keyframes nb-bookmark-pulse {
  0%   { transform: scale(1); }
  45%  { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.nb-bookmark-pulse {
  animation: nb-bookmark-pulse 280ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
`;

// Inject once at module level (safe for SSR because it only runs in browser).
if (typeof document !== 'undefined') {
  const existing = document.getElementById('nb-bookmark-style');
  if (!existing) {
    const el = document.createElement('style');
    el.id = 'nb-bookmark-style';
    el.textContent = BOOKMARK_PULSE_KEYFRAMES;
    document.head.appendChild(el);
  }
}

// ─── icon map ────────────────────────────────────────────────────────────────

const getDomainIcon = (id: string) => {
  const cls = 'w-6 h-6 text-text-main mb-6';
  switch (id) {
    case 'data-science':        return <BarChart3    className={cls} strokeWidth={1} />;
    case 'machine-learning':    return <Bot          className={cls} strokeWidth={1} />;
    case 'ai-research':         return <BrainCircuit className={cls} strokeWidth={1} />;
    case 'agentic-frameworks':  return <Cpu          className={cls} strokeWidth={1} />;
    case 'mlops':               return <Settings     className={cls} strokeWidth={1} />;
    case 'model-releases':      return <Zap          className={cls} strokeWidth={1} />;
    case 'ai-industry':         return <Briefcase    className={cls} strokeWidth={1} />;
    case 'tools-libraries':     return <Code2        className={cls} strokeWidth={1} />;
    default:                    return <BrainCircuit className={cls} strokeWidth={1} />;
  }
};

// ─── SingleDomainCard ────────────────────────────────────────────────────────
// Extracted so we can manage per-card hover + bookmark state cleanly.

interface SingleDomainCardProps {
  key?: React.Key;
  card: {
    id: string;
    title: string;
    summary: string;
    source: string;
    time?: string;
  };
  index: number;
  onSelectDomain: (id: string) => void;
}

function SingleDomainCard({ card, index, onSelectDomain }: SingleDomainCardProps) {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);
  const [bookmarkPulsing, setBookmarkPulsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const bookmarkWrapperRef = useRef<HTMLDivElement>(null);

  // Refs for the CSS 3D tilt-on-mousemove effect (same pattern as PhaseCard in Engine.tsx).
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  // Reset loading on unmount so stale state never leaks into a remounted card.
  useEffect(() => {
    return () => setLoading(false);
  }, []);

  const getLocalizedTitle = (id: string, defaultTitle: string) => {
    const normId = id.replace('-', '_');
    const key = id === 'agentic-frameworks' ? 'topic_agentic_ai_label' : `topic_${normId}_label`;
    const translated = t(key);
    return translated !== key ? translated : defaultTitle;
  };

  const getLocalizedSummary = (id: string, defaultSummary: string) => {
    const normId = id.replace('-', '_');
    const key = id === 'agentic-frameworks' ? 'topic_agentic_ai_desc' : `topic_${normId}_desc`;
    const translated = t(key);
    return translated !== key ? translated : defaultSummary;
  };

  const title = getLocalizedTitle(card.id, card.title);
  const summary = getLocalizedSummary(card.id, card.summary);

  const handleBookmarkClick = useCallback((e: React.MouseEvent) => {
    // Don't propagate to card click
    e.stopPropagation();

    // Remove then re-add the class so re-clicking retrigggers the animation
    if (bookmarkWrapperRef.current) {
      bookmarkWrapperRef.current.classList.remove('nb-bookmark-pulse');
      // Force reflow so the class removal takes effect before we add it back
      void bookmarkWrapperRef.current.offsetWidth;
      bookmarkWrapperRef.current.classList.add('nb-bookmark-pulse');
    }

    setBookmarkPulsing(true);
    setTimeout(() => setBookmarkPulsing(false), 320);
  }, []);

  // 3D tilt: track pointer position over the card face and apply a perspective
  // rotation plus a radial glare that follows the cursor.
  const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;

    card.style.transform = `perspective(600px) rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) scale3d(1.01,1.01,1.01)`;

    const glare = glareRef.current;
    if (glare) {
      const gx = (x + 0.5) * 100;
      const gy = (y + 0.5) * 100;
      glare.style.background = `radial-gradient(circle at ${gx}% ${gy}%, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent)`;
      glare.style.opacity = '1';
    }
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (card) {
      card.style.transform = '';
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  }, []);

  return (
    <motion.div
      // ── Scroll entrance (fires once per spec) ──
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: CARD_ENTRANCE_DURATION,
        ease: CARD_ENTRANCE_EASE,
        delay: index * CARD_STAGGER_MS,
      }}
      // ── Hover lift (translateY only — no rotation) ──
      animate={{ y: hovered ? -3 : 0 }}
      // Separate animate from whileInView by using a key-based approach:
      // motionValue for the lift is separate from the entrance.
      // We achieve this by NOT using whileHover (which conflicts with animate)
      // and instead tracking hover state manually and driving `y` via animate.
      //
      // NOTE: We can't combine whileHover y with initial/whileInView y on the same
      // motion.div cleanly, so we split: entrance runs via whileInView (sets y to 0),
      // then we manage hover y via the `animate` prop with a fast spring.
      //
      // The entrance transition takes precedence while mounting; after it completes
      // the animate={{ y: hovered ? -3 : 0 }} drives the hover lift.
      style={{ willChange: 'transform, opacity' }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onTap={() => {
        setLoading(true);
        setTimeout(() => onSelectDomain(card.id), 400);
      }}
      whileTap={{ scale: 0.96 }}
      className='relative h-full flex'
    >
      {/*
       * Bookmark wrapper — sits absolute top-right.
       * The wrapper itself is what we pulse (scale animation lives here).
       * On card hover, we also brighten the wrapper's background via inline style
       * so the circle behind BookmarkButton feels connected to the card state.
       */}
      <div
        ref={bookmarkWrapperRef}
        onClick={handleBookmarkClick}
        className='absolute top-4 right-4 z-10 rounded-full transition-colors'
        style={{
          // Slightly brightened circle on card hover — BookmarkButton renders
          // its own button inside, so this adds a visible brightening ring.
          backgroundColor: hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
          transition: `background-color ${HOVER_BORDER_DURATION} ease`,
          // Ensure the pulse animation scale originates from the circle center
          transformOrigin: 'center center',
        }}
      >
        <BookmarkButton sectionId={card.title} />
      </div>

      {/*
       * Main card face.
       * Border transition handled here via Tailwind + inline transition-duration override.
       * We DON'T add translateY here — it's on the motion.div parent above.
       * CSS 3D tilt-on-mousemove (rotateX/rotateY + glare) is applied directly via
       * cardRef/glareRef, matching the PhaseCard pattern in Engine.tsx.
       */}
      <div
        ref={cardRef}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        className={[
          'bg-transparent border p-10 h-full',
          'group cursor-pointer flex flex-col justify-between w-full',
          'active:bg-surface-dim',
          '[transform-style:preserve-3d]',
          hovered ? 'border-text-main' : 'border-border-subtle',
          loading ? 'opacity-70' : '',
        ].join(' ')}
        style={{
          // Explicit transition only on border-color and background so we don't
          // accidentally transition transforms here (those live on motion.div).
          transition: `border-color ${HOVER_BORDER_DURATION} ease, background-color 200ms ease, transform 0.15s ease-out, opacity 200ms ease`,
        }}
      >
        {/* Glare overlay — radial gradient follows the cursor, faded in/out via opacity */}
        <div
          ref={glareRef}
          className='absolute inset-0 pointer-events-none opacity-0'
          style={{ transition: 'opacity 0.15s ease-out' }}
        />

        <div>
          {getDomainIcon(card.id)}
          <h3
            className='font-heading text-2xl mb-4 transition-all'
            style={{ fontStyle: hovered ? 'italic' : 'normal' }}
          >
            {title}
          </h3>
          <p className='text-text-muted text-sm mb-8'>{summary}</p>
        </div>

        <div>
          <div className='border-t border-border-subtle pt-6 text-[10px] space-y-2 text-text-muted uppercase tracking-widest flex flex-col font-mono'>
            <div className='flex justify-between items-center'>
              <span>{t('source')}</span>
              <span className='text-text-main'>{card.source}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span>{t('focus_last_sync')}</span>
              <span className='text-text-main flex items-center pr-1'>
                {card.time ? (card.time === 'Weekly Sync' ? t('focus_weekly_sync') : card.time) : t('profile.weekly')}
              </span>
            </div>
          </div>

          {/* "Read Report →" — appears on hover; shows loading state when card is tapped */}
          <div
            className='mt-4 text-[10px] uppercase font-bold tracking-widest text-right italic text-text-main flex items-center justify-end'
            style={{
              opacity: loading || hovered ? 1 : 0,
              transform: loading || hovered ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 300ms ease, transform 300ms ease',
            }}
          >
            {loading ? (
              <>
                <span className='w-3 h-3 rounded-full border border-text-main border-t-transparent animate-spin inline-block mr-2' />
                {t('profile.loading')}
              </>
            ) : (
              t('focus_read_report')
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── FocusDomains ─────────────────────────────────────────────────────────────

export function FocusDomains({
  domains,
  loading,
  error,
  onSelectDomain,
}: {
  domains: any[];
  loading: boolean;
  error: string | null;
  onSelectDomain: (id: string) => void;
}) {
  const { t } = useLanguage();

  const staticFallbacks = [
    {
      id: 'data-science',
      title: 'Data Science',
      summary: 'Statistical frameworks, optimization vectors, and clean visualization architecture.',
      source: 'ArXiv STAT.AP',
      time: 'Weekly Sync',
    },
    {
      id: 'machine-learning',
      title: 'Machine Learning',
      summary: 'Weights, model training pipelines, MLOps orchestration, and edge deployment strategy.',
      source: 'GH: Awesome-MLOps',
      time: 'Weekly Sync',
    },
    {
      id: 'ai-research',
      title: 'AI Research',
      summary: 'Daily ArXiv analysis, breakthroughs of foundational breakthroughs, and algorithmic updates.',
      source: 'ArXiv CS.LG',
      time: 'Weekly Sync',
    },
    {
      id: 'agentic-frameworks',
      title: 'Agentic Frameworks',
      summary: 'Multi-agent graphs, autonomous memory layers, and stateful routing architectures.',
      source: 'LangChain / CrewAI',
      time: 'Weekly Sync',
    },
    {
      id: 'mlops',
      title: 'MLOps',
      summary: 'Model deployment, registries, feature stores, CI/CD, and pipeline scalability.',
      source: 'GitHub / MLOps',
      time: 'Weekly Sync',
    },
    {
      id: 'model-releases',
      title: 'Model Releases',
      summary: 'Weight releases, open-weights models, benchmarks, and specialized vision/audio fine-tunes.',
      source: 'Hugging Face',
      time: 'Weekly Sync',
    },
    {
      id: 'ai-industry',
      title: 'AI Industry',
      summary: 'Tech news, funding rounds, chip updates, corporate partnerships, and legal landscapes.',
      source: 'Industry News',
      time: 'Weekly Sync',
    },
    {
      id: 'tools-libraries',
      title: 'Tools & Libraries',
      summary: 'Developer packages, PyTorch/JS updates, compilers, and local optimization frameworks.',
      source: 'Python / NPM',
      time: 'Weekly Sync',
    },
  ];

  const cardsToRender = domains && domains.length > 0 ? domains : staticFallbacks;

  if (loading) {
    return (
      <section className='py-32 px-6 md:px-16 max-w-7xl mx-auto' id='topics'>
        <div className='text-center mb-20'>
          <span className='text-[10px] uppercase tracking-widest text-text-muted mb-4 block font-bold'>
            {t('focus_overline')}
          </span>
          <h2 className='text-4xl md:text-5xl font-heading mb-6'>
            {t('focus_title_1')} <span className='italic'>{t('focus_title_2')}</span>
          </h2>
          <p className='text-sm md:text-base text-text-muted max-w-xl mx-auto leading-relaxed'>
            {t('focus_desc')}
          </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className='bg-surface-dim/40 border border-border-subtle p-10 h-[380px] animate-pulse flex flex-col justify-between'
            >
              <div>
                <div className='w-6 h-6 bg-text-muted/15 rounded mb-6' />
                <div className='h-6 bg-text-muted/15 rounded w-2/3 mb-4' />
                <div className='space-y-2 mb-8'>
                  <div className='h-3 bg-text-muted/10 rounded w-full' />
                  <div className='h-3 bg-text-muted/10 rounded w-5/6' />
                </div>
              </div>
              <div className='border-t border-border-subtle pt-6 space-y-2'>
                <div className='flex justify-between'>
                  <div className='h-2 bg-text-muted/10 rounded w-1/4' />
                  <div className='h-2 bg-text-muted/10 rounded w-1/3' />
                </div>
                <div className='flex justify-between'>
                  <div className='h-2 bg-text-muted/10 rounded w-1/4' />
                  <div className='h-2 bg-text-muted/10 rounded w-1/4' />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className='py-32 px-6 md:px-16 max-w-7xl mx-auto' id='topics'>
      {/* Section header — unchanged from original */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className='text-center mb-20'
      >
        <span className='text-[10px] uppercase tracking-widest text-text-muted mb-4 block font-bold'>
          {t('focus_overline')}
        </span>
        <h2 className='text-4xl md:text-5xl font-heading mb-6'>
          {t('focus_title_1')} <span className='italic'>{t('focus_title_2')}</span>
        </h2>
        <p className='text-sm md:text-base text-text-muted max-w-xl mx-auto leading-relaxed'>
          {t('focus_desc')}
        </p>
        {error && (
          <p className='text-rose-500 text-xs mt-4 uppercase tracking-widest font-mono'>
            {t('focus_failed_live_feed') || 'Failed to fetch live feed. Showing static signals.'}
          </p>
        )}
      </motion.div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {cardsToRender.map((card, i) => (
          <SingleDomainCard
            key={card.id || i}
            card={card}
            index={i}
            onSelectDomain={onSelectDomain}
          />
        ))}
      </div>
    </section>
  );
}

export default FocusDomains;