import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Bot, BrainCircuit, Cpu, Settings, Zap, Briefcase, Code2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { BookmarkButton } from './BookmarkButton';
import { staticFallbacks } from '../lib/fallbacks';

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
  card: {
    id: string;
    title: string;
    summary: string;
    source: string;
    time?: string;
    tags?: string[];
  };
  index: number;
  onSelectDomain: (id: string) => void;
  isLarge: boolean;
}

function SingleDomainCard({ card, index, onSelectDomain, isLarge }: SingleDomainCardProps) {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const sparklinePath = React.useMemo(() => {
    if (!isLarge) return '';
    const points = [];
    const width = 400;
    const height = 80;
    const segments = 20;
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
  }, [index, isLarge]);

  const signalsCount = React.useMemo(() => {
    return Math.floor(800 + Math.abs(Math.sin(index)) * 2500).toLocaleString();
  }, [index]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        setLoading(true);
        setTimeout(() => onSelectDomain(card.id), 400);
      }}
      className={`h-full w-full relative group cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]`}
    >
      {/* Background Layer with Overflow Hidden */}
      <div className="absolute inset-0 bg-[#0A0A0A]/80 backdrop-blur-md border border-border-subtle rounded-2xl overflow-hidden transition-all duration-500 group-hover:border-accent z-0">
        <div 
          className="absolute inset-0 opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.08]" 
          style={{ backgroundColor: `var(--tint-${card.id})` }} 
        />

        {isLarge && (
          <div className="absolute bottom-0 left-0 w-full h-48 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity duration-500 z-0">
            <svg viewBox="0 0 400 80" preserveAspectRatio="none" className="w-full h-full">
              <motion.path
                d={sparklinePath}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
              <path d={sparklinePath} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" className="opacity-30" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className={`relative z-10 flex flex-col h-full ${isLarge ? 'p-8 md:p-10' : 'p-6'}`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="text-text-main group-hover:text-accent transition-colors duration-500">
            {getDomainIcon(card.id)}
          </div>
          {isLarge && (
            <div className="flex gap-3">
              <div className="text-[10px] font-mono tracking-widest uppercase px-2 py-1 bg-surface border border-border-subtle text-text-muted transition-colors group-hover:border-accent/30 group-hover:text-accent rounded-md">
                [SIGNALS: {signalsCount}]
              </div>
              <BookmarkButton sectionId={card.title} />
            </div>
          )}
        </div>

        {/* Title & Summary */}
        <div className="flex-grow relative group/summary">
          <h3
            className={`font-heading transition-all duration-300 group-hover:text-accent ${isLarge ? 'text-3xl md:text-5xl mb-4' : 'text-xl md:text-2xl mb-3'}`}
            style={{ fontStyle: hovered ? 'italic' : 'normal' }}
          >
            {title}
          </h3>
          <p className={`text-text-muted leading-relaxed ${isLarge ? 'text-base md:text-lg max-w-xl' : 'text-sm line-clamp-3 cursor-help'}`}>
            {summary}
          </p>

          {/* Hover Tooltip for full text on small cards */}
          {!isLarge && (
            <div className="absolute top-[80%] left-0 w-[calc(100%+2rem)] -ml-4 bg-[#151515]/95 backdrop-blur-2xl border border-border-subtle rounded-xl p-5 shadow-2xl opacity-0 invisible group-hover/summary:opacity-100 group-hover/summary:visible transition-all duration-300 z-[100] pointer-events-none">
              <p className="text-text-main text-sm leading-relaxed">
                {summary}
              </p>
            </div>
          )}
        </div>

        {/* Footer info - Unified for all cards */}
        <div className="mt-auto">
          <div className={`border-t border-border-subtle/50 ${isLarge ? 'pt-6 text-xs space-y-4' : 'pt-4 text-[10px] space-y-3'} text-text-muted uppercase tracking-widest flex flex-col font-mono`}>
            <div className='flex justify-between items-center'>
              <span>{t('source')}</span>
              <span className='text-text-main flex items-center gap-2'>
                <span className={`relative flex ${isLarge ? 'h-2.5 w-2.5' : 'h-2 w-2'}`}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className={`relative inline-flex rounded-full ${isLarge ? 'h-2.5 w-2.5' : 'h-2 w-2'} bg-emerald-500`}></span>
                </span>
                {card.source}
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span>{t('focus_last_sync')}</span>
              <span className='text-text-main'>
                {card.time || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            
            <div className="flex justify-between items-center mt-1">
              <div className="flex gap-2 opacity-60">
                {(card.tags || ['#AI', '#TECH']).map((tag: string, idx: number) => (
                  <span key={idx} className={`font-mono tracking-widest uppercase px-1.5 py-0.5 border border-border-subtle rounded-md bg-background/50 ${isLarge ? 'text-[10px]' : 'text-[8px]'}`}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className={`${isLarge ? 'text-xs' : 'text-[10px]'} uppercase font-bold tracking-widest italic text-accent flex items-center gap-2`}>
                {loading ? (
                  <span className='w-4 h-4 rounded-full border border-accent border-t-transparent animate-spin inline-block' />
                ) : (
                  isLarge ? (t('focus_read_report') + " →") : "Report →"
                )}
              </div>
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

  const cardsToRender = (domains && domains.length > 0 ? domains : staticFallbacks).map(d => {
    const fallback = staticFallbacks.find(f => f.id === d.id) || staticFallbacks[0];
    return {
      ...fallback,
      ...d,
      source: d.source && d.source !== 'UNAVAILABLE' ? d.source : fallback.source,
      time: d.time && d.time !== 'Weekly Sync' ? d.time : fallback.time,
      tags: d.tags && d.tags.length > 0 ? d.tags : fallback.tags,
    };
  });

  // Ensure AI Research and Model Releases are at the top to fit the large tiles
  const sortedCards = [...cardsToRender].sort((a, b) => {
    if (a.id === 'ai-research') return -1;
    if (b.id === 'ai-research') return 1;
    if (a.id === 'model-releases') return -1;
    if (b.id === 'model-releases') return 1;
    return 0;
  });

  return (
    <section className='py-32 px-4 md:px-16 max-w-[1400px] mx-auto relative' id='topics'>
      <style>{`
        :root {
          --tint-data-science: #3b82f6;
          --tint-machine-learning: #10b981;
          --tint-ai-research: #8b5cf6;
          --tint-agentic-frameworks: #f59e0b;
          --tint-mlops: #6366f1;
          --tint-model-releases: #ec4899;
          --tint-ai-industry: #14b8a6;
          --tint-tools-libraries: #ef4444;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className='text-center mb-16 relative z-20'
      >
        <span className='text-[10px] uppercase tracking-widest text-text-muted mb-4 block font-bold'>
          {t('focus_overline')}
        </span>
        <h2 className='text-4xl md:text-5xl lg:text-6xl font-heading mb-6'>
          {t('focus_title_1')} <span className='italic'>{t('focus_title_2')}</span>
        </h2>
        <p className='text-sm md:text-base text-text-muted max-w-xl mx-auto leading-relaxed'>
          {t('focus_desc')}
        </p>
        {loading && (
          <p className='text-accent text-xs mt-6 uppercase tracking-widest font-mono animate-pulse'>
            Syncing Live Feeds...
          </p>
        )}
        {error && (
          <p className='text-rose-500 text-xs mt-6 uppercase tracking-widest font-mono'>
            {t('focus_failed_live_feed') || 'Failed to fetch live feed. Showing static signals.'}
          </p>
        )}
      </motion.div>

      {/* Bento Box Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 auto-rows-[320px] gap-6 relative z-10">
        {/* Background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[600px] rounded-full bg-accent/5 blur-[150px] pointer-events-none mix-blend-screen" />

        {sortedCards.map((card, i) => {
          // Make AI Research and Model Releases the large "hero" blocks in the bento box
          const isLarge = card.id === 'ai-research' || card.id === 'model-releases';
          
          let gridClass = 'col-span-1 row-span-1';
          if (isLarge) {
            gridClass = 'md:col-span-2 xl:col-span-2 row-span-1 md:row-span-2';
          } else if (i === 6 || i === 7) {
            // The last two small cards span 2 columns to perfectly fill the 4-column bottom row
            gridClass = 'col-span-1 md:col-span-2 xl:col-span-2 row-span-1';
          }

          return (
            <div key={card.id || i} className={gridClass}>
              <SingleDomainCard
                card={card}
                index={i}
                onSelectDomain={onSelectDomain}
                isLarge={isLarge}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default FocusDomains;