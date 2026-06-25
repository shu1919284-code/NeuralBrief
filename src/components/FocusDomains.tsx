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
  isFront: boolean;
  onClick: () => void;
  animate: any;
  zIndex: number;
}

function SingleDomainCard({ card, index, onSelectDomain, isFront, onClick, animate, zIndex }: SingleDomainCardProps) {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);
  const [bookmarkPulsing, setBookmarkPulsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const bookmarkWrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

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
    e.stopPropagation();
    if (bookmarkWrapperRef.current) {
      bookmarkWrapperRef.current.classList.remove('nb-bookmark-pulse');
      void bookmarkWrapperRef.current.offsetWidth;
      bookmarkWrapperRef.current.classList.add('nb-bookmark-pulse');
    }
    setBookmarkPulsing(true);
    setTimeout(() => setBookmarkPulsing(false), 320);
  }, []);

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
      glare.style.background = `radial-gradient(circle at ${gx}% ${gy}%, color-mix(in srgb, var(--color-accent) 15%, transparent), transparent)`;
      glare.style.opacity = '1';
    }
  }, []);

  const sparklinePath = React.useMemo(() => {
    const points = [];
    const width = 200;
    const height = 40;
    const segments = 10;
    const random = (seed: number) => {
      const x = Math.sin(seed + 1) * 10000;
      return x - Math.floor(x);
    };
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const y = height - (random(index * 10 + i) * height * 0.8) - 5;
      points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    return points.join(' ');
  }, [index]);
  
  const signalsCount = React.useMemo(() => {
    return Math.floor(800 + Math.abs(Math.sin(index)) * 2500).toLocaleString();
  }, [index]);

  const handleCardMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (card) card.style.transform = '';
    const glare = glareRef.current;
    if (glare) glare.style.opacity = '0';
  }, []);

  return (
    <motion.div
      initial={false}
      animate={animate}
      style={{ zIndex }}
      transition={{ type: 'spring', damping: 25, stiffness: 120 }}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500
        ${isFront ? 'w-[320px] md:w-[400px] h-[400px] md:h-[480px]' : 'w-[200px] md:w-[260px] h-[260px] md:h-[320px]'}
      `}
      onClick={onClick}
      onHoverStart={() => isFront && setHovered(true)}
      onHoverEnd={() => isFront && setHovered(false)}
    >
      <div
        ref={cardRef}
        onMouseMove={isFront ? handleCardMouseMove : undefined}
        onMouseLeave={isFront ? handleCardMouseLeave : undefined}
        className={[
          'bg-[#0A0A0A]/60 backdrop-blur-xl border h-full transition-all duration-500 rounded-xl overflow-hidden relative group',
          isFront ? 'border-accent shadow-[0_0_40px_var(--color-theme-glow)]' : 'border-border-subtle shadow-none hover:border-text-muted hover:bg-surface-dim/80',
          loading && isFront ? 'opacity-70' : '',
        ].join(' ')}
      >
        {isFront && (
          <div
            ref={bookmarkWrapperRef}
            onClick={handleBookmarkClick}
            className='absolute top-4 right-4 z-20 rounded-full transition-colors'
            style={{
              backgroundColor: hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
              transition: `background-color ${HOVER_BORDER_DURATION} ease`,
              transformOrigin: 'center center',
            }}
          >
            <BookmarkButton sectionId={card.title} />
          </div>
        )}

        <div
          ref={glareRef}
          className='absolute inset-0 pointer-events-none opacity-0 mix-blend-screen z-20'
          style={{ transition: 'opacity 0.15s ease-out' }}
        />

        {/* Satellite View (Inactive) */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-opacity duration-500 ${isFront ? 'opacity-0 pointer-events-none' : 'opacity-50 group-hover:opacity-100'}`}>
          {getDomainIcon(card.id)}
          <h3 className="font-heading text-lg md:text-xl mt-2 text-text-muted">{title}</h3>
        </div>

        {/* Core View (Active) */}
        <div className={`absolute inset-0 flex flex-col p-6 md:p-8 transition-opacity duration-500 ${isFront ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none opacity-[0.04] group-hover:opacity-20 transition-opacity duration-500 z-0">
            <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="w-full h-full">
              <motion.path
                d={sparklinePath}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: isFront ? 1 : 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <path d={sparklinePath} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" className="opacity-30" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-transparent" />
          </div>

          <div className="relative z-10 flex-grow">
            <div className="flex justify-between items-start mb-6">
              {getDomainIcon(card.id)}
              <div className="text-[9px] font-mono tracking-widest uppercase px-2 py-1 bg-surface border border-border-subtle text-text-muted transition-colors group-hover:border-accent/30 group-hover:text-accent">
                [SIGNALS: {signalsCount}]
              </div>
            </div>
            <h3
              className='font-heading text-3xl md:text-4xl mb-4 transition-all group-hover:text-accent'
              style={{ fontStyle: hovered ? 'italic' : 'normal' }}
            >
              {title}
            </h3>
            <p className='text-text-muted text-sm md:text-base mb-8 leading-relaxed'>{summary}</p>
          </div>

          <div className="relative z-10 mt-auto">
            <div className='border-t border-border-subtle pt-6 text-[10px] space-y-3 text-text-muted uppercase tracking-widest flex flex-col font-mono'>
              <div className='flex justify-between items-center'>
                <span>{t('source')}</span>
                <span className='text-text-main flex items-center gap-2'>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_2s_infinite]"></span>
                  {card.source}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span>{t('focus_last_sync')}</span>
                <span className='text-text-main flex items-center pr-1'>
                  {card.time ? (card.time === 'Weekly Sync' ? t('focus_weekly_sync') : card.time) : t('profile.weekly')}
                </span>
              </div>
            </div>

            <div
              className='mt-6 pt-4 border-t border-border-subtle/30 text-xs uppercase font-bold tracking-widest text-center italic text-text-main flex items-center justify-center cursor-pointer hover:text-accent transition-colors'
              onClick={(e) => {
                e.stopPropagation();
                if (isFront) {
                  setLoading(true);
                  setTimeout(() => onSelectDomain(card.id), 400);
                }
              }}
            >
              {loading ? (
                <>
                  <span className='w-4 h-4 rounded-full border border-text-main border-t-transparent animate-spin inline-block mr-2' />
                  {t('profile.loading')}
                </>
              ) : (
                t('focus_read_report') + " →"
              )}
            </div>
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play interval
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cardsToRender.length);
    }, 6000); // Rotate every 6 seconds
    return () => clearInterval(interval);
  }, [isPaused]);

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
  const numCards = cardsToRender.length;

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
        <div className='relative h-[600px] w-full flex items-center justify-center'>
          <div className='w-[400px] h-[480px] bg-surface-dim/40 border border-border-subtle animate-pulse rounded-xl' />
        </div>
      </section>
    );
  }

  return (
    <section className='py-32 px-4 md:px-16 max-w-[1400px] mx-auto overflow-hidden relative' id='topics'>
      <style>{`
        .orbit-container {
          --orbit-rx: 1.0;
          --orbit-ry: 0.25;
        }
        @media (min-width: 768px) {
          .orbit-container {
            --orbit-rx: 3.5;
            --orbit-ry: 0.7;
          }
        }
        @media (min-width: 1200px) {
          .orbit-container {
            --orbit-rx: 4.8;
            --orbit-ry: 0.8;
          }
        }
        
        .orbit-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: calc(200px * var(--orbit-rx));
          height: calc(200px * var(--orbit-ry));
          border-radius: 50%;
          border: 1px dashed var(--color-accent);
          opacity: 0.15;
          pointer-events: none;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className='text-center mb-10 relative z-20'
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

      <div 
        className='relative h-[550px] md:h-[700px] w-full flex items-center justify-center orbit-container mt-10 md:mt-20 perspective-[1200px]'
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Physical Orbit Rings */}
        <div className="orbit-ring animate-[spin_120s_linear_infinite]" />
        <div className="orbit-ring scale-[0.8] opacity-10 animate-[spin_80s_linear_infinite_reverse]" />
        
        {/* Glowing Neural Core */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full bg-accent/20 blur-[120px] pointer-events-none opacity-40 mix-blend-screen" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 rounded-full border border-accent/30 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] pointer-events-none opacity-30" />
        
        {cardsToRender.map((card, i) => {
          // Angle offset so activeIndex is at front (rad = 0)
          const angleOffset = ((i - activeIndex + numCards) % numCards) * (360 / numCards);
          const rad = (angleOffset * Math.PI) / 180;
          
          const z = Math.cos(rad); // 1 is front, -1 is back
          const x = Math.sin(rad); 
          
          const scale = (z + 1) / 2; // 0 to 1
          const mappedScale = 0.55 + scale * 0.45; // 0.55 to 1.0
          const opacity = 0.15 + scale * 0.85; // 0.15 to 1.0
          const zIndex = Math.round(scale * 100);
          
          const isFront = i === activeIndex;

          return (
            <SingleDomainCard
              key={card.id || i}
              card={card}
              index={i}
              onSelectDomain={onSelectDomain}
              isFront={isFront}
              onClick={() => {
                if (!isFront) setActiveIndex(i);
              }}
              animate={{
                x: `calc(${x * 100}px * var(--orbit-rx))`,
                y: `calc(${z * -100}px * var(--orbit-ry))`,
                scale: mappedScale,
                opacity: opacity,
              }}
              zIndex={zIndex}
            />
          );
        })}
      </div>
    </section>
  );
}

export default FocusDomains;