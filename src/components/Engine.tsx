import React, { useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useLanguage } from '../contexts/LanguageContext';
import { BookmarkButton } from './BookmarkButton';

gsap.registerPlugin(ScrollTrigger);

/**
 * Pipeline visualisation section — the "How it works" block.
 *
 * Changes from original:
 *  1. GSAP ScrollTrigger: diagram box drifts up ~28 px as the section
 *     scrolls past, giving it a subtle parallax depth.
 *     → GSAP owns `y` on the *wrapper* div; Framer Motion owns `opacity`
 *       + entrance `y` on the *inner* motion.div — no conflicts.
 *  2. PhaseCard: 3-D perspective tilt on mouse-move + radial glare overlay.
 *     All transforms are applied via direct DOM ref writes (zero re-renders).
 */
export function Engine(): React.JSX.Element {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const diagramWrapRef = useRef<HTMLDivElement>(null);

  // ── Framer Motion animation variants (unchanged) ─────────────────────────
  const drawAnim = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: 0.5, type: 'spring', duration: 1.5, bounce: 0 },
        opacity: { delay: 0.5, duration: 0.01 },
      },
    },
  };

  const streamAnim = {
    animate: {
      strokeDashoffset: [100, -100],
      transition: { duration: 1.5, repeat: Infinity, ease: 'linear' },
    },
  };

  // ── GSAP ScrollTrigger: parallax on diagram wrapper ─────────────────────
  useGSAP((): void => {
    if (!diagramWrapRef.current || !sectionRef.current) return;
    gsap.to(diagramWrapRef.current, {
      y: -28,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      },
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="py-32 px-6 md:px-16 max-w-7xl mx-auto" id="process">
      {/* ── Section header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16"
      >
        <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-4 block font-bold">
          {t('engine_overline')}
        </span>
        <h2 className="font-heading text-5xl mb-6">
          {t('engine_title_1')} <span className="italic">{t('engine_title_2')}</span>
        </h2>
        <p className="text-text-muted max-w-2xl mx-auto text-sm leading-relaxed">
          {t('engine_desc')}
        </p>
      </motion.div>

      {/* ── Diagram: outer div owned by GSAP (parallax), inner by Framer ──── */}
      <div ref={diagramWrapRef} className="mt-12">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="relative h-[600px] md:h-[450px] bg-surface-dim border border-border-subtle overflow-hidden flex items-center justify-center p-8"
        >
          {/* Status badge */}
          <div className="absolute top-5 right-5 bg-surface border border-border-subtle px-3 py-2 text-[9px] uppercase tracking-widest text-text-main z-10 overflow-hidden font-bold">
            Protocol Active : Consensus
            <motion.div
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 w-full h-[1px] bg-text-main opacity-20"
            />
          </div>

          {/* SVG wiring — desktop */}
          <svg
            className="hidden md:block w-full h-full absolute top-0 left-0"
            viewBox="0 0 1000 400"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Static paths */}
            <motion.path variants={drawAnim} initial="hidden" whileInView="visible" viewport={{ once: true }} className="stroke-border-subtle stroke-1 fill-none" d="M 150 200 L 350 200" />
            <motion.path variants={drawAnim} initial="hidden" whileInView="visible" viewport={{ once: true }} className="stroke-border-subtle stroke-1 fill-none" d="M 350 200 C 450 200, 450 100, 550 100" />
            <motion.path variants={drawAnim} initial="hidden" whileInView="visible" viewport={{ once: true }} className="stroke-border-subtle stroke-1 fill-none" d="M 350 200 L 550 200" />
            <motion.path variants={drawAnim} initial="hidden" whileInView="visible" viewport={{ once: true }} className="stroke-border-subtle stroke-1 fill-none" d="M 350 200 C 450 200, 450 300, 550 300" />
            <motion.path variants={drawAnim} initial="hidden" whileInView="visible" viewport={{ once: true }} className="stroke-border-subtle stroke-1 fill-none" d="M 550 100 C 700 100, 700 200, 850 200" />
            <motion.path variants={drawAnim} initial="hidden" whileInView="visible" viewport={{ once: true }} className="stroke-border-subtle stroke-1 fill-none" d="M 550 200 L 850 200" />
            <motion.path variants={drawAnim} initial="hidden" whileInView="visible" viewport={{ once: true }} className="stroke-border-subtle stroke-1 fill-none" d="M 550 300 C 700 300, 700 200, 850 200" />

            {/* Animated data streams */}
            <motion.path variants={streamAnim} animate="animate" style={{ strokeDasharray: '8, 30' }} className="stroke-text-main stroke-1 fill-none opacity-40" d="M 150 200 L 350 200" />
            <motion.path variants={streamAnim} animate="animate" style={{ strokeDasharray: '8, 30' }} className="stroke-text-main stroke-1 fill-none opacity-40" d="M 350 200 C 450 200, 450 100, 550 100" />
            <motion.path variants={streamAnim} animate="animate" style={{ strokeDasharray: '8, 30' }} className="stroke-text-main stroke-1 fill-none opacity-40" d="M 350 200 L 550 200" />
            <motion.path variants={streamAnim} animate="animate" style={{ strokeDasharray: '8, 30' }} className="stroke-text-main stroke-1 fill-none opacity-40" d="M 350 200 C 450 200, 450 300, 550 300" />
            <motion.path variants={streamAnim} animate="animate" style={{ strokeDasharray: '8, 30' }} className="stroke-text-main stroke-1 fill-none opacity-40" d="M 550 100 C 700 100, 700 200, 850 200" />
            <motion.path variants={streamAnim} animate="animate" style={{ strokeDasharray: '8, 30' }} className="stroke-text-main stroke-1 fill-none opacity-40" d="M 550 200 L 850 200" />
            <motion.path variants={streamAnim} animate="animate" style={{ strokeDasharray: '8, 30' }} className="stroke-text-main stroke-1 fill-none opacity-40" d="M 550 300 C 700 300, 700 200, 850 200" />
          </svg>

          {/* Nodes — desktop */}
          <div className="hidden md:block">
            <Node style={{ left: '15%', top: '50%' }}>Ingestion</Node>
            <Node style={{ left: '35%', top: '50%' }}>Logic Gate</Node>
            <Node style={{ left: '55%', top: '25%' }} pulsing>Llama 3</Node>
            <Node style={{ left: '55%', top: '50%' }} pulsing>Mistral</Node>
            <Node style={{ left: '55%', top: '75%' }} pulsing>Groq</Node>
            <Node style={{ left: '85%', top: '50%' }}>Dispatch</Node>
          </div>

          {/* Nodes — mobile */}
          <div className="md:hidden flex flex-col items-center justify-center h-full gap-8 z-10 w-full">
            <Node>Ingestion</Node>
            <div className="h-4 border-l border-text-main/20" />
            <Node>Logic Gate</Node>
            <div className="h-4 border-l border-text-main/20" />
            <div className="flex gap-4">
              <Node pulsing>Llama</Node>
              <Node pulsing>Mistral</Node>
            </div>
            <div className="h-4 border-l border-text-main/20" />
            <Node>Dispatch</Node>
          </div>
        </motion.div>
      </div>

      {/* ── Phase cards (3-D tilt) ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
        <PhaseCard phase="1" title="Ingestion" desc="Real-time monitoring of ArXiv, GitHub, and RSS." />
        <PhaseCard phase="2" title="Evaluation" desc="Deduplication and vector relevance scoring." delay={0.1} />
        <PhaseCard phase="3" title="Synthesis" desc="Consensus modeling for technical abstraction." delay={0.2} />
        <PhaseCard phase="4" title="Delivery" desc="Final dispatch via low-latency SMTP." delay={0.3} />
      </div>
    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * Diagram node badge (unchanged from original).
 */
function Node({
  children,
  style,
  pulsing = false,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  pulsing?: boolean;
  className?: string;
}): React.JSX.Element {
  return (
    <motion.div
      animate={pulsing ? { opacity: [0.8, 1, 0.8] } : undefined}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative md:absolute bg-surface border border-border-subtle px-4 py-2 text-[10px] tracking-widest uppercase flex items-center gap-2 md:-translate-x-1/2 md:-translate-y-1/2 z-10 font-bold whitespace-nowrap shadow-sm text-text-main ${className ?? ''}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/**
 * Phase card with 3-D perspective tilt + radial glare.
 *
 * Architecture:
 *  - Outer `motion.div` — Framer Motion handles entrance (opacity + y).
 *  - Inner `div` (ref=cardRef) — direct DOM writes handle the tilt transform.
 *    This avoids React re-renders on every mouse-move event.
 *  - Glare `div` (ref=glareRef) — radial gradient shifts with cursor position.
 */
function PhaseCard({
  phase,
  title,
  desc,
  delay = 0,
}: {
  phase: string;
  title: string;
  desc: string;
  delay?: number;
}): React.JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
    const card = cardRef.current;
    if (!card) return;

    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;  // -0.5 → 0.5
    const y = (e.clientY - top) / height - 0.5;

    // 3-D tilt — direct DOM write, no React state
    card.style.transform =
      `perspective(600px) rotateX(${(-y * 12).toFixed(2)}deg) rotateY(${(x * 12).toFixed(2)}deg) scale3d(1.02,1.02,1.02)`;

    // Glare follows cursor
    if (glareRef.current) {
      const gx = Math.round((x + 0.5) * 100);
      const gy = Math.round((y + 0.5) * 100);
      glareRef.current.style.background =
        `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.09) 0%, transparent 65%)`;
      glareRef.current.style.opacity = '1';
    }
  }, []);

  const handleMouseLeave = useCallback((): void => {
    if (cardRef.current) cardRef.current.style.transform = '';
    if (glareRef.current) glareRef.current.style.opacity = '0';
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group cursor-pointer relative bg-transparent hover:bg-surface-dim p-4 border border-transparent hover:border-border-subtle overflow-hidden [transform-style:preserve-3d] h-full"
        // dynamic values → inline style is explicitly allowed by conventions
        style={{ transition: 'transform 0.15s ease-out, background-color 0.2s ease, border-color 0.2s ease' }}
      >
        {/* Glare overlay — opacity toggled via DOM ref, not state */}
        <div
          ref={glareRef}
          className="absolute inset-0 pointer-events-none opacity-0"
          aria-hidden="true"
          style={{ transition: 'opacity 0.2s ease' }}
        />

        <BookmarkButton sectionId={`Phase: ${title}`} />
        <span className="text-[10px] uppercase tracking-widest opacity-50 block mb-1">
          0{phase} / Phase
        </span>
        <h4 className="text-lg font-heading leading-tight group-hover:italic transition-all mb-2 mt-4">
          {title}
        </h4>
        <p className="text-xs text-text-muted leading-relaxed font-sans">{desc}</p>
      </div>
    </motion.div>
  );
}

export default Engine;
