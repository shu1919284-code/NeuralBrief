import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
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

// ─── light sweep keyframe (injected once) ────────────────────────────────────
//
// The sweep is a single linear gradient band that moves left→right.
// Max opacity on the gradient peak is 0.04 (4%) — essentially invisible
// at a glance but gives the card surface a sense of depth on hover.

const SWEEP_KEYFRAMES = `
@keyframes nb-article-sweep {
  from { transform: translateX(-110%); }
  to   { transform: translateX(110%);  }
}
`;

if (typeof document !== 'undefined') {
  const existing = document.getElementById('nb-article-sweep-style');
  if (!existing) {
    const el = document.createElement('style');
    el.id = 'nb-article-sweep-style';
    el.textContent = SWEEP_KEYFRAMES;
    document.head.appendChild(el);
  }
}

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

  // ── derive opacity/transform from phase ──────────────────────────────────
  //
  // exiting: opacity→0, translateY→-8px (old content slides up and fades)
  // entering: cards fade in with stagger (handled by motion.div below)
  // idle: fully visible

  const isExiting = phase === 'exiting';
  const isEntering = phase === 'entering';

  return (
    <motion.div
      // Entrance animation: each card starts below and fades in.
      // We reset the key when phase changes to 'entering' so the animation
      // re-triggers. The parent handles key-switching (see Preview).
      initial={isEntering ? { opacity: 0, y: 16 } : false}
      animate={
        isExiting
          ? { opacity: 0, y: -8 }
          : { opacity: 1, y: 0 }
      }
      transition={
        isExiting
          ? { duration: TAB_EXIT_DURATION / 1000, ease: 'easeIn' }
          : {
              duration: CARD_ENTRANCE_DURATION,
              ease: CARD_ENTRANCE_EASE,
              delay: staggerIndex * CARD_STAGGER_MS,
            }
      }
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      // Overflow hidden so the sweep pseudo-element doesn't leak
      className='relative overflow-hidden'
      style={{ willChange: 'transform, opacity' }}
    >
      {/*
       * Light sweep overlay.
       *
       * Positioned absolutely, full-height, narrow band.
       * On hover: plays the sweep animation once (500ms ease).
       * Gradient is white at 4% peak, transparent on both edges.
       * `pointer-events: none` so it never blocks clicks.
       */}
      <div
        aria-hidden='true'
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            // Width wider than 100% so the gradient fade-edges are visible
            width: '60%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.04) 60%, transparent 100%)',
            // Only animate when hovered; reset instantly when not
            animation: hovered
              ? 'nb-article-sweep 500ms ease forwards'
              : 'none',
            transform: 'translateX(-110%)',
          }}
        />
      </div>

      {/* Card content sits above the sweep overlay */}
      <div
        className='bg-surface-dim p-8 border'
        style={{
          position: 'relative',
          zIndex: 2,
          borderColor: hovered ? 'var(--color-accent, #e5e5e5)' : 'transparent',
          boxShadow: hovered ? 'inset 0 0 20px var(--color-theme-glow)' : 'none',
          transition: `border-color 250ms ease, background-color 200ms ease, box-shadow 250ms ease`,
        }}
      >
        {data ? (
          <>
            <h5 className='font-heading text-2xl mb-4 transition-all'>{data.title}</h5>
            <p className='text-sm text-text-main/70 mb-8 leading-relaxed max-w-2xl'>
              {data.summary}
            </p>
            <div className='flex flex-wrap items-center justify-between text-[10px] uppercase tracking-widest gap-4 border-t border-border-subtle pt-4'>
              <div className='flex gap-6 flex-wrap font-bold'>
                <span className='text-text-main'>{t('preview_update')}</span>
                <span className='text-text-muted'>{data.source}</span>
                <span className='text-text-muted' style={{ color: 'var(--color-accent)', textShadow: '0 0 8px var(--color-theme-glow)' }}>Conf: {data.confidence?.toFixed(3)}</span>
              </div>

              {/*
               * "Read Full Doc →"
               *
               * On hover:
               *   - letter-spacing increases to 0.03em (200ms ease)
               *   - text opacity drops to 0.7 (200ms ease)
               *   - the "→" shifts 3px right independently (200ms ease)
               */}
              <button
                onClick={onOpenBriefing}
                onMouseEnter={() => setLinkHovered(true)}
                onMouseLeave={() => setLinkHovered(false)}
                className='font-heading italic active:scale-95 transition-transform text-xs cursor-pointer'
                style={{
                  opacity: linkHovered ? 0.7 : 1,
                  letterSpacing: linkHovered ? '0.03em' : '0em',
                  transition: 'opacity 200ms ease, letter-spacing 200ms ease',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                }}
              >
                {/* Text portion */}
                <span>{t('preview_read_full_doc')} </span>
                {/* Arrow shifts independently */}
                <span
                  style={{
                    display: 'inline-block',
                    transform: linkHovered ? 'translateX(3px)' : 'translateX(0)',
                    transition: 'transform 200ms ease',
                  }}
                >
                  →
                </span>
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
      activeData = domainsData?.find(d => d.id === 'ai-research');
    } else if (displayedTab === 'agentic') {
      activeData = domainsData?.find(d => d.id === 'agentic-frameworks');
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