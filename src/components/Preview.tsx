import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring, useMotionTemplate } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

// ─── constants ────────────────────────────────────────────────────────────────

const CARD_ENTRANCE_EASE = [0.16, 1, 0.3, 1] as const;
const CARD_ENTRANCE_DURATION = 0.45;   // 450ms
const CARD_STAGGER_MS = 0.12;          // 120ms between cards

// Tab underline slides in 250ms
const TAB_UNDERLINE_DURATION = '250ms';

// Exit: 150ms fade-out + slight slide up; enter starts immediately after.
const TAB_EXIT_DURATION = 150; // ms

// ─── types ────────────────────────────────────────────────────────────────────

type TabId = 'all' | 'research' | 'agentic';
type ContentPhase = 'idle' | 'exiting' | 'entering';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'all',      label: 'All Signals'   },
  { id: 'research', label: 'Research Core' },
  { id: 'agentic',  label: 'Agentic Ops'   },
];

// ─── CircularGauge ─────────────────────────────────────────────────────────────

const CircularGauge = ({ value }: { value: number }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(value, 0), 1) * 100;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-10 h-10">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="var(--color-border-subtle)"
          strokeWidth="3"
          fill="transparent"
        />
        <motion.circle
          cx="20"
          cy="20"
          r={radius}
          stroke="var(--color-accent)"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          strokeLinecap="round"
          style={{ filter: 'drop-shadow(0 0 4px var(--color-accent))' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-bold text-text-main shadow-lg">
        {percentage.toFixed(0)}%
      </div>
    </div>
  );
};

// ─── ArticleCard ─────────────────────────────────────────────────────────────

interface ArticleCardProps {
  key?: React.Key;
  /** 0-based stagger index for entrance animation */
  staggerIndex: number;
  /** Phase drives whether the card is animating in or out */
  phase: ContentPhase;
  onOpenBriefing: () => void;
  data: any;
}

function ArticleCard({ staggerIndex, phase, onOpenBriefing, data }: ArticleCardProps) {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);

  // ── mouse tracking for holographic glow ────────────────────────────────────
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const smoothX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const smoothY = useSpring(mouseY, { stiffness: 300, damping: 30 });
  const background = useMotionTemplate`radial-gradient(400px circle at ${smoothX}px ${smoothY}px, var(--color-accent) 0%, transparent 60%)`;

  const isExiting = phase === 'exiting';
  const isEntering = phase === 'entering';

  return (
    <motion.div
      initial={isEntering ? { opacity: 0, y: 16 } : false}
      animate={isExiting ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
      transition={
        isExiting
          ? { duration: TAB_EXIT_DURATION / 1000, ease: 'easeIn' }
          : { duration: CARD_ENTRANCE_DURATION, ease: CARD_ENTRANCE_EASE, delay: staggerIndex * CARD_STAGGER_MS }
      }
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={onOpenBriefing}
      className='relative overflow-hidden rounded-2xl group cursor-pointer'
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Dynamic Holographic Background */}
      <div className="absolute inset-0 bg-[#0A0A0A]/60 backdrop-blur-3xl z-0 transition-opacity duration-500" />
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 z-0 pointer-events-none mix-blend-screen"
        style={{ background }}
      />
      {/* Subtle Grid overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at center, var(--color-text-muted) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
      />

      {/* Card Border that glows on hover */}
      <div className="absolute inset-0 border border-border-subtle rounded-2xl group-hover:border-accent/40 transition-colors duration-500 z-10 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] group-hover:shadow-[inset_0_0_20px_var(--color-theme-glow)]" />

      {/* Card Content */}
      <div className='relative z-20 p-8 md:p-10 flex flex-col h-full'>
        {data ? (
          <>
            <h5 className='font-heading text-3xl md:text-4xl mb-6 text-text-main group-hover:text-accent transition-colors duration-300'>{data.title}</h5>
            <p className='text-sm md:text-base text-text-muted mb-10 leading-relaxed max-w-3xl flex-grow'>
              {data.summary}
            </p>
            
            {/* Footer with Cyber-Pulse Badges */}
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-t border-border-subtle/50 pt-6 mt-auto'>
              
              <div className='flex gap-4 flex-wrap items-center'>
                {/* Live Update Pulse Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-[10px] font-bold uppercase tracking-widest text-rose-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  {t('preview_update')}
                </div>

                {/* Source Pill */}
                <div className="px-3 py-1.5 rounded-full border border-border-subtle bg-surface-dim/80 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  {data.source}
                </div>

                {/* Confidence Gauge */}
                <div className="flex items-center gap-3 bg-[#050505]/50 border border-accent/20 rounded-full pr-4 pl-1 py-1">
                  <CircularGauge value={data.confidence || 0.9} />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-text-muted uppercase tracking-widest">Confidence</span>
                    <span className="text-xs text-accent font-bold font-mono">HIGH</span>
                  </div>
                </div>
              </div>

              {/* Enhanced CTA */}
              <button
                onMouseEnter={(e) => { e.stopPropagation(); setLinkHovered(true); }}
                onMouseLeave={(e) => { e.stopPropagation(); setLinkHovered(false); }}
                className='font-heading italic text-sm cursor-pointer group/btn flex items-center gap-2 text-text-main hover:text-accent transition-colors bg-transparent border-none p-0'
              >
                <span>{t('preview_read_full_doc')}</span>
                <span className="transform group-hover/btn:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </motion.div>
  );
}

// ─── ArticleCardSkeleton ──────────────────────────────────────────────────────

function ArticleCardSkeleton() {
  return (
    <div className='bg-surface-dim p-8 border border-transparent animate-pulse'>
      <div className='h-7 bg-text-muted/15 rounded w-3/4 mb-4' />
      <div className='space-y-2 mb-8'>
        <div className='h-4 bg-text-muted/10 rounded w-full' />
        <div className='h-4 bg-text-muted/10 rounded w-5/6' />
      </div>
      <div className='flex justify-between items-center border-t border-border-subtle pt-4'>
        <div className='h-4 bg-text-muted/10 rounded w-1/3' />
        <div className='h-4 bg-text-muted/10 rounded w-1/6' />
      </div>
    </div>
  );
}

// ─── StreamTabs ──────────────────────────────────────────────────────────────
//
// Renders the tab row with a single sliding underline element.
// The underline is positioned absolutely within a relative container.
// On tab change, we measure the new active tab's bounding box (relative
// to the container) and update `left` and `width` via CSS transition.

interface StreamTabsProps {
  activeTab: TabId;
  onChange: (id: TabId) => void;
}

function StreamTabs({ activeTab, onChange }: StreamTabsProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    all: null,
    research: null,
    agentic: null,
  });

  // Underline geometry state
  const [underline, setUnderline] = useState<{ left: number; width: number } | null>(null);

  // Measure and update underline whenever activeTab changes or on mount.
  const measureUnderline = useCallback(() => {
    const container = containerRef.current;
    const activeEl = tabRefs.current[activeTab];
    if (!container || !activeEl) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeEl.getBoundingClientRect();

    setUnderline({
      left:  tabRect.left  - containerRect.left,
      width: tabRect.width,
    });
  }, [activeTab]);

  // useLayoutEffect so the underline is positioned synchronously before paint
  // on first render, avoiding a flash at (0, 0).
  useLayoutEffect(() => {
    measureUnderline();
  }, [measureUnderline]);

  // Also remeasure on resize (tab widths may change with viewport).
  useEffect(() => {
    const ro = new ResizeObserver(measureUnderline);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measureUnderline]);

  return (
    <div
      ref={containerRef}
      className='flex justify-center gap-4 flex-wrap relative'
      // The underline is positioned relative to this container.
      style={{ position: 'relative' }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[tab.id] = el; }}
            onClick={() => onChange(tab.id)}
            className={[
              'text-[10px] uppercase tracking-widest px-2 py-1 font-bold cursor-pointer',
              'active:scale-95 transition-all',
              // No border-b here — the underline element handles that
              isActive ? 'text-[var(--color-accent)]' : 'text-text-muted hover:text-[var(--color-accent)]',
            ].join(' ')}
            style={{
              background: 'none',
              border: 'none',
            }}
          >
            {t('preview_tab_' + tab.id)}
          </button>
        );
      })}

      {/*
       * Single sliding underline element.
       * Positioned absolutely, bottom-aligned with the tab row.
       * `left` and `width` animate via CSS transition when activeTab changes.
       */}
      {underline && (
        <span
          aria-hidden='true'
          style={{
            position: 'absolute',
            bottom: 0,
            left: underline.left,
            width: underline.width,
            height: '1px',
            background: 'var(--color-accent)',
            boxShadow: '0 0 8px var(--color-theme-glow)',
            // Both left and width transition simultaneously
            transition: `left ${TAB_UNDERLINE_DURATION} ease, width ${TAB_UNDERLINE_DURATION} ease`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

// ─── Preview ─────────────────────────────────────────────────────────────────

export function Preview({
  onOpenBriefing,
  data,
  domainsData,
  loading,
  error,
}: {
  onOpenBriefing: (tabId: TabId) => void;
  data: any;
  domainsData: any[];
  loading: boolean;
  error: string | null;
}) {
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);

  // Parallax blobs — unchanged from original
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y1 = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  // ── Tab + content transition state ────────────────────────────────────────

  const [activeTab, setActiveTab] = useState<TabId>('all');
  // `displayedTab` is what's actually rendered in the card area.
  // It lags behind `activeTab` by the exit animation duration.
  const [displayedTab, setDisplayedTab] = useState<TabId>('all');
  const [phase, setPhase] = useState<ContentPhase>('idle');
  // `contentKey` is incremented when new content enters; this forces
  // React to remount the ArticleCard so its entrance animation retriggers.
  const [contentKey, setContentKey] = useState(0);

  const handleTabChange = useCallback((newTab: TabId) => {
    if (newTab === activeTab || phase !== 'idle') return;

    setActiveTab(newTab);
    setPhase('exiting');

    setTimeout(() => {
      // Old content has faded out — swap content and start enter phase
      setDisplayedTab(newTab);
      setPhase('entering');
      setContentKey((k) => k + 1);

      // After entering animation completes, return to idle
      // Longest stagger: 1 card * 120ms + 450ms duration = ~570ms
      setTimeout(() => {
        setPhase('idle');
      }, CARD_ENTRANCE_DURATION * 1000 + CARD_STAGGER_MS * 1000);
    }, TAB_EXIT_DURATION);
  }, [activeTab, phase]);

  // ── card content ──────────────────────────────────────────────────────────

  const renderContent = () => {
    if (loading) return <ArticleCardSkeleton />;

    if (error) {
      return (
        <div className='bg-surface-dim p-8 border border-rose-500/20 text-center text-rose-500'>
          <p className='text-sm font-bold font-heading mb-2'>{t('preview_failed')}</p>
          <p className='text-xs text-text-muted mb-4'>{error}</p>
        </div>
      );
    }

    // Resolve which data to display
    let activeData = null;
    if (displayedTab === 'all') {
      activeData = data;
    } else if (displayedTab === 'research') {
      const d = domainsData?.find(d => d.id === 'ai-research');
      activeData = {
        ...d,
        title: d?.title && d?.title !== 'UNAVAILABLE' ? d.title : 'AI Research',
        summary: d?.summary && !d?.summary.toLowerCase().includes('unavailable') ? d.summary : 'Daily ArXiv analysis, breakthroughs of foundational breakthroughs, and algorithmic updates.',
        source: d?.source && d?.source !== 'UNAVAILABLE' ? d.source : 'ArXiv CS.LG',
        confidence: d?.confidence || 0.95
      };
    } else if (displayedTab === 'agentic') {
      const d = domainsData?.find(d => d.id === 'agentic-frameworks');
      activeData = {
        ...d,
        title: d?.title && d?.title !== 'UNAVAILABLE' ? d.title : 'Agentic Frameworks',
        summary: d?.summary && !d?.summary.toLowerCase().includes('unavailable') ? d.summary : 'Multi-agent graphs, autonomous memory layers, and stateful routing architectures.',
        source: d?.source && d?.source !== 'UNAVAILABLE' ? d.source : 'LangChain / CrewAI',
        confidence: d?.confidence || 0.92
      };
    }

    if (!activeData) return <ArticleCardSkeleton />;

    return (
      <ArticleCard
        key={contentKey}
        staggerIndex={0}
        phase={phase}
        onOpenBriefing={() => onOpenBriefing(displayedTab)}
        data={activeData}
      />
    );
  };

  return (
    <section ref={ref} className='py-32 px-6 md:px-16 max-w-7xl mx-auto' id='preview'>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className='text-center mb-12'
      >
        <span className='text-[10px] uppercase tracking-[0.2em] mb-4 block font-bold'>
          {t('preview_overline')}
        </span>
        <h2 className='font-heading text-5xl mb-8'>
          {t('preview_title_1')} <span className='italic'>{t('preview_title_2')}</span>
        </h2>

        {/* ── Stream tabs with sliding underline ── */}
        <StreamTabs activeTab={activeTab} onChange={handleTabChange} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className='max-w-4xl mx-auto relative'
      >
        {/* Parallax blobs — unchanged */}
        <motion.div
          style={{ y: y1 }}
          className='absolute -left-12 -top-12 z-0 w-32 h-32 bg-border-subtle rounded-full mix-blend-multiply opacity-50 blur-3xl'
        />

        <div className='bg-surface border border-border-subtle overflow-hidden relative z-10 w-full'>
          {/* Inbound stream header — unchanged */}
          <div className='bg-surface-dim px-6 py-3 flex items-center justify-center border-b border-border-subtle relative'>
            <span className='text-[10px] uppercase tracking-widest text-text-muted font-bold opacity-60'>
              {t('preview_inbound_stream')}
            </span>
          </div>

          <div className='p-8 md:p-12'>
            {/* Sender row — unchanged */}
            <div className='flex flex-col sm:flex-row sm:items-center gap-4 mb-10 pb-6 border-b border-border-subtle'>
              <div className='flex items-center gap-4'>
                <div className='w-10 h-10 border border-border-subtle rounded-full flex items-center justify-center font-bold text-xs text-text-main font-heading'>
                  NB
                </div>
                <div>
                  <div className='text-sm font-bold font-heading'>{t('preview_core_engine')}</div>
                  <div className='text-[10px] text-text-muted uppercase tracking-widest mt-1'>
                    intel@neuralbrief.app
                  </div>
                </div>
              </div>
              <div className='sm:ml-auto text-[10px] text-text-muted uppercase tracking-widest'>
                07:00 UTC
              </div>
            </div>

            {/* Stream heading — unchanged */}
            <h3 className='font-heading text-3xl md:text-5xl mb-8 leading-tight'>
              {loading ? (
                <div className='h-10 bg-text-muted/10 rounded w-2/3 animate-pulse' />
              ) : error || !data ? (
                t('preview_latest_intel')
              ) : (
                <>{t('preview_latest_intel').split(' — ')[0]} — <span className='italic'>{t('preview_latest_feed')}</span></>
              )}
            </h3>

            <p className='text-[10px] uppercase tracking-[0.3em] font-bold text-text-muted mb-12 border-b border-border-subtle pb-4'>
              {t('preview_personalized_stream')}
            </p>

            {/* Article card — transitions on tab switch */}
            <div className='relative pt-6'>
              <span className='text-[10px] uppercase tracking-widest font-bold text-text-muted block mb-4'>
                {t('preview_core_model_analytics')}
              </span>
              {renderContent()}
            </div>
          </div>
        </div>

        <motion.div
          style={{ y: y2 }}
          className='absolute -right-8 -bottom-8 z-0 w-40 h-40 bg-text-main rounded-full mix-blend-multiply opacity-[0.03] blur-2xl'
        />
      </motion.div>
    </section>
  );
}

export default Preview;