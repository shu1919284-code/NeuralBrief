import React, { useCallback, useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getEngineConfig } from './engineConfigs';
import { BookmarkButton } from './BookmarkButton';

gsap.registerPlugin(ScrollTrigger);

const PATHS = {
  stage1: "path('M 150 200 L 350 200')",
  stage2_llama: "path('M 350 200 C 450 200, 450 100, 550 100')",
  stage2_mistral: "path('M 350 200 L 550 200')",
  stage2_groq: "path('M 350 200 C 450 200, 450 300, 550 300')",
  stage3_llama: "path('M 550 100 C 700 100, 700 200, 850 200')",
  stage3_mistral: "path('M 550 200 L 850 200')",
  stage3_groq: "path('M 550 300 C 700 300, 700 200, 850 200')",
  // Merged Ingestion -> LogicGate -> Processor in one continuous path,
  // so the packet never resets/teleports at the LogicGate junction.
  merged_llama: "path('M 150 200 L 350 200 C 450 200, 450 100, 550 100')",
  merged_mistral: "path('M 150 200 L 350 200 L 550 200')",
  merged_groq: "path('M 150 200 L 350 200 C 450 200, 450 300, 550 300')",
};

const T = {
  borderStart: 0,
  borderDuration: 400,
  ingestionPop: 400,
  connIngestionLogicStart: 400,
  logicGatePop: 680,
  connLogicOuterStart: 680,
  outerPop: 980,
  connLogicMistralStart: 980,
  mistralPop: 1180,
  connToDispatchStart: 1180,
  dispatchPop: 1500,
  nodeDuration: 280,
  connDuration: 210,
};

const POP_EASE = 'back.out(1.7)';
const TYPE_MS_PER_CHAR = 25;

export function Engine(): React.JSX.Element {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const config = getEngineConfig(theme);

  const sectionRef = useRef<HTMLElement>(null);
  const diagramWrapRef = useRef<HTMLDivElement>(null);
  const diagramBoxRef = useRef<HTMLDivElement>(null);
  const borderOverlayRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<BackgroundHandle>(null);

  const ingestionRef = useRef<NodeHandle>(null);
  const logicGateRef = useRef<NodeHandle>(null);
  const llamaRef = useRef<NodeHandle>(null);
  const mistralRef = useRef<NodeHandle>(null);
  const groqRef = useRef<NodeHandle>(null);
  const dispatchRef = useRef<NodeHandle>(null);

  const connIngestionLogicRef = useRef<SVGPathElement>(null);
  const connLogicLlamaRef = useRef<SVGPathElement>(null);
  const connLogicMistralRef = useRef<SVGPathElement>(null);
  const connLogicGroqRef = useRef<SVGPathElement>(null);
  const connLlamaDispatchRef = useRef<SVGPathElement>(null);
  const connMistralDispatchRef = useRef<SVGPathElement>(null);
  const connGroqDispatchRef = useRef<SVGPathElement>(null);

  const tagTextRef = useRef<HTMLSpanElement>(null);
  const tagCursorRef = useRef<HTMLSpanElement>(null);
  const tagStatusDotRef = useRef<HTMLSpanElement>(null);

  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);

  const [engineActive, setEngineActive] = useState(false);
  const [engineMode, setEngineMode] = useState<'MONITORING' | 'ANALYZING' | 'CONSENSUS' | 'DISPATCHING'>('MONITORING');
  const [consensusStatus, setConsensusStatus] = useState<'building' | 'reached' | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  useEffect(() => {
    if (!engineActive) return;
    const modes: typeof engineMode[] = ['MONITORING', 'ANALYZING', 'CONSENSUS', 'DISPATCHING'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % modes.length;
      setEngineMode(modes[idx]);
    }, 4000);
    return () => clearInterval(interval);
  }, [engineActive]);

  const modeText = t(`engine_mode_${engineMode.toLowerCase()}`);

  useEffect(() => {
    if (engineActive && tagTextRef.current) {
      tagTextRef.current.textContent = modeText;
    }
  }, [engineActive, modeText]);

  const nodesRefs = React.useMemo(() => ({
    ingestion: ingestionRef,
    logicGate: logicGateRef,
    llama: llamaRef,
    mistral: mistralRef,
    groq: groqRef,
    dispatch: dispatchRef,
  }), []);

  const pathsRefs = React.useMemo(() => ({
    ingestionToLogic: connIngestionLogicRef,
    logicToLlama: connLogicLlamaRef,
    logicToMistral: connLogicMistralRef,
    logicToGroq: connLogicGroqRef,
    llamaToDispatch: connLlamaDispatchRef,
    mistralToDispatch: connMistralDispatchRef,
    groqToDispatch: connGroqDispatchRef,
  }), []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!diagramBoxRef.current) return;
    const { left, top, width, height } = diagramBoxRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    mouseX.set(x * 100);
    mouseY.set(y * 100);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const l1x = useTransform(springX, v => v * -0.2);
  const l1y = useTransform(springY, v => v * -0.2);

  const l2x = useTransform(springX, v => v * 0.4);
  const l2y = useTransform(springY, v => v * 0.4);

  const l3x = useTransform(springX, v => v * 0.8);
  const l3y = useTransform(springY, v => v * 0.8);

  useGSAP((): void => {
    if (!diagramWrapRef.current || !sectionRef.current) return;
    gsap.to(diagramWrapRef.current, {
      y: -28, ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top bottom', end: 'bottom top', scrub: 1.5,
      },
    });
  }, { scope: sectionRef, dependencies: [] });

  useGSAP((): void => {
    const connectors = [
      connIngestionLogicRef.current, connLogicLlamaRef.current,
      connLogicMistralRef.current, connLogicGroqRef.current,
      connLlamaDispatchRef.current, connMistralDispatchRef.current,
      connGroqDispatchRef.current,
    ].filter(Boolean) as SVGPathElement[];

    connectors.forEach(path => {
      try {
        const length = path.getTotalLength();
        if (length > 0) {
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        }
      } catch (e) {
        // Ignore errors if SVG is not rendered yet
      }
    });

    const nodes = [
      ingestionRef.current?.el, logicGateRef.current?.el,
      llamaRef.current?.el, mistralRef.current?.el, groqRef.current?.el,
    ].filter(Boolean) as HTMLDivElement[];
    gsap.set(nodes, { opacity: 0, scale: 0.7 });
    if (dispatchRef.current?.el) gsap.set(dispatchRef.current.el, { opacity: 0, scale: 0.6 });
    if (borderOverlayRef.current) gsap.set(borderOverlayRef.current, { clipPath: 'inset(0% 100% 0% 0%)' });
    if (tagCursorRef.current) gsap.set(tagCursorRef.current, { opacity: 0 });
    if (tagStatusDotRef.current) gsap.set(tagStatusDotRef.current, { opacity: 0 });
    if (ring1Ref.current) gsap.set(ring1Ref.current, { opacity: 0, scale: 1 });
    if (ring2Ref.current) gsap.set(ring2Ref.current, { opacity: 0, scale: 1 });
  }, { scope: sectionRef, dependencies: [] });

  const typeTag = useCallback((onDone: () => void): void => {
    if (!tagTextRef.current || !tagCursorRef.current) { onDone(); return; }
    tagTextRef.current.textContent = '';
    gsap.set(tagCursorRef.current, { opacity: 1 });
    let i = 0;
    const interval = window.setInterval(() => {
      i++;
      if (tagTextRef.current) tagTextRef.current.textContent = config.tagText.slice(0, i);
      if (i >= config.tagText.length) {
        window.clearInterval(interval);
        window.setTimeout(() => {
          if (tagCursorRef.current) gsap.to(tagCursorRef.current, { opacity: 0, duration: 0.15 });
          onDone();
        }, 200);
      }
    }, TYPE_MS_PER_CHAR);
  }, [config.tagText]);

  const startIdleLoop = useCallback((): void => {
    if (tagStatusDotRef.current) {
      gsap.to(tagStatusDotRef.current, {
        opacity: 0.3, duration: 1.2, ease: 'sine.inOut', repeat: -1, yoyo: true,
      });
    }
    if (ring1Ref.current) {
      gsap.to(ring1Ref.current, {
        scale: 2.2, opacity: 0, duration: 1.6,
        ease: 'power1.out', repeat: -1, repeatDelay: 0.4,
      });
    }
    if (ring2Ref.current) {
      gsap.to(ring2Ref.current, {
        scale: 2.8, opacity: 0, duration: 2,
        ease: 'power1.out', repeat: -1, repeatDelay: 0.4, delay: 0.5,
      });
    }
    if (diagramBoxRef.current) diagramBoxRef.current.classList.add('diagram-idle-active');

    // ── System A: Ambient Layer ────────────────────────────────────────────

    // Priority 2 — Path Breathing: staggered, organic, never synchronised
    const connPaths = [
      connIngestionLogicRef.current,
      connLogicLlamaRef.current,
      connLogicMistralRef.current,
      connLogicGroqRef.current,
      connLlamaDispatchRef.current,
      connMistralDispatchRef.current,
      connGroqDispatchRef.current,
    ];
    connPaths.forEach((path, i) => {
      if (!path) return;
      gsap.to(path, {
        attr: { 'stroke-opacity': 0.45 },
        strokeWidth: 1.5,
        duration: 1.8 + i * 0.35,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: i * 0.65,
      });
    });

    // Priority 3 — Node Heartbeat: subtle brightness only, never touch scale
    // (scale is managed by CSS transform on the node element)
    const processorNodeEls = [
      logicGateRef.current?.el,
      llamaRef.current?.el,
      mistralRef.current?.el,
      groqRef.current?.el,
    ].filter(Boolean) as HTMLDivElement[];

    processorNodeEls.forEach((el, i) => {
      const beat = () => {
        gsap.to(el, {
          filter: 'brightness(1.35)',
          duration: 0.5,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
          onComplete: () => setTimeout(beat, 3500 + Math.random() * 4000),
        });
      };
      setTimeout(beat, 1200 + i * 900 + Math.random() * 1200);
    });

    // Priority 4 — Dispatch Heartbeat: brightness + glow pulse only
    // Dispatch CSS has scale(1.4) — we never animate scale here
    const dispatchEl = dispatchRef.current?.el;
    if (dispatchEl) {
      const dispatchBeat = () => {
        gsap.to(dispatchEl, {
          filter: 'brightness(1.4)',
          boxShadow: '0 0 48px var(--color-accent)',
          duration: 0.7,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
          onComplete: () => setTimeout(dispatchBeat, 4000 + Math.random() * 1500),
        });
      };
      setTimeout(dispatchBeat, 1800);
    }
  }, []);


  const runEntrance = useCallback((): void => {
    const tl = gsap.timeline();
    const s = (ms: number): number => ms / 1000;

    const animatePath = (path: SVGPathElement | null | undefined, startTime: number) => {
      if (!path) return;
      try {
        const l = path.getTotalLength() || 1000;
        tl.fromTo(path, { strokeDasharray: l, strokeDashoffset: l }, { strokeDashoffset: 0, duration: s(T.connDuration), ease: 'power2.out' }, startTime);
      } catch (e) {
        tl.to(path, { strokeDashoffset: 0, duration: s(T.connDuration), ease: 'power2.out' }, startTime);
      }
    };

    if (borderOverlayRef.current) {
      tl.to(borderOverlayRef.current, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: s(T.borderDuration), ease: 'power1.inOut',
      }, s(T.borderStart));
    }
    if (ingestionRef.current?.el) {
      tl.to(ingestionRef.current.el, { opacity: 1, scale: 1, duration: s(T.nodeDuration), ease: POP_EASE }, s(T.ingestionPop));
    }
    animatePath(connIngestionLogicRef.current, s(T.connIngestionLogicStart));
    
    if (logicGateRef.current?.el) {
      tl.to(logicGateRef.current.el, { opacity: 1, scale: 1.15, duration: s(T.nodeDuration), ease: POP_EASE }, s(T.logicGatePop));
    }
    animatePath(connLogicLlamaRef.current, s(T.connLogicOuterStart));
    animatePath(connLogicGroqRef.current, s(T.connLogicOuterStart));
    
    [llamaRef.current?.el, groqRef.current?.el].forEach(node => {
      if (!node) return;
      tl.to(node, { opacity: 1, scale: 1, duration: s(T.nodeDuration), ease: POP_EASE }, s(T.outerPop));
    });
    animatePath(connLogicMistralRef.current, s(T.connLogicMistralStart));
    
    if (mistralRef.current?.el) {
      tl.to(mistralRef.current.el, { opacity: 1, scale: 1, duration: s(T.nodeDuration), ease: POP_EASE }, s(T.mistralPop));
    }
    animatePath(connLlamaDispatchRef.current, s(T.connToDispatchStart));
    animatePath(connMistralDispatchRef.current, s(T.connToDispatchStart));
    animatePath(connGroqDispatchRef.current, s(T.connToDispatchStart));
    
    if (dispatchRef.current?.el) {
      tl.to(dispatchRef.current.el, { opacity: 1, scale: 1.4, duration: s(T.nodeDuration), ease: POP_EASE }, s(T.dispatchPop));
    }
    tl.call(() => {
      typeTag(() => startIdleLoop());
      setEngineActive(true);
    }, [], s(T.dispatchPop + T.nodeDuration));
  }, [typeTag, startIdleLoop]);

  useEffect(() => {
    let hasFired = false;
    const el = diagramBoxRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasFired) {
            hasFired = true;
            runEntrance();
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [runEntrance]);

  return (
    <>
      <PhaseDetailModal selectedPhase={selectedPhase} onClose={() => setSelectedPhase(null)} />
      <section ref={sectionRef} className="py-32 px-6 md:px-16 max-w-7xl mx-auto" id="engine">

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16"
      >
        <span className="text-[10px] uppercase tracking-widest text-text-muted mb-4 block font-bold">
          {t('engine_overline')}
        </span>
        <h2 className="text-4xl md:text-5xl font-heading mb-6">
          {t('engine_title_1')} <span className="italic">{t('engine_title_2')}</span>
        </h2>
        <p className="text-sm md:text-base text-text-muted max-w-2xl mx-auto leading-relaxed">
          {t('engine_desc')}
        </p>
      </motion.div>

      <div ref={diagramWrapRef} className="mt-12">
        <div
          ref={diagramBoxRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative h-[600px] md:h-[450px] bg-surface-dim overflow-hidden flex items-center justify-center border border-border-subtle group/diagram perspective-[1000px]"
        >
          {/* Depth Layer 1: Neural Network Background */}
          <motion.div style={{ x: l1x, y: l1y }} className="absolute inset-0 z-0">
            <NeuralBackground ref={bgRef} type={config.backgroundType} />
          </motion.div>

          {/* Border overlay */}
          <div
            ref={borderOverlayRef}
            className="absolute inset-0 pointer-events-none border border-[var(--color-accent)] opacity-20 transition-colors duration-1000 shadow-[inset_0_0_50px_var(--color-theme-glow)]"
            aria-hidden="true"
          />

          <div className="absolute top-5 right-5 bg-surface border border-border-subtle px-3 py-2 text-[9px] tracking-[0.15em] text-text-main z-20 flex items-center gap-2 font-bold transition-colors duration-500 shadow-sm uppercase">
            <span
              ref={tagStatusDotRef}
              className="inline-block w-[6px] h-[6px] rounded-full bg-[var(--color-accent)] transition-colors duration-500 shadow-[0_0_8px_var(--color-theme-glow)]"
              style={{ opacity: 0 }}
              aria-hidden="true"
            />
            <span>
              <span ref={tagTextRef}></span>
              <span
                ref={tagCursorRef}
                className="inline-block w-[1px] h-[10px] bg-text-main ml-[2px] align-middle"
                style={{ opacity: 0, display: engineActive ? 'none' : 'inline-block' }}
                aria-hidden="true"
              />
            </span>
          </div>

          {/* Pipeline Paths + Data Packets — single static SVG, no parallax so offsetPath coords stay fixed */}
          <svg
            className="hidden md:block w-full h-full absolute top-0 left-0 z-10 pointer-events-none"
            viewBox="0 0 1000 400"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="trail-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Connector paths */}
            <path ref={connIngestionLogicRef}  className="stroke-1 fill-none stroke-[var(--packet-color)] opacity-30 transition-colors duration-1000" d="M 150 200 L 350 200" />
            <path ref={connLogicLlamaRef}      className="stroke-1 fill-none stroke-[var(--packet-color)] opacity-30 transition-colors duration-1000" d="M 350 200 C 450 200, 450 100, 550 100" />
            <path ref={connLogicMistralRef}    className="stroke-1 fill-none stroke-[var(--packet-color)] opacity-30 transition-colors duration-1000" d="M 350 200 L 550 200" />
            <path ref={connLogicGroqRef}       className="stroke-1 fill-none stroke-[var(--packet-color)] opacity-30 transition-colors duration-1000" d="M 350 200 C 450 200, 450 300, 550 300" />
            <path ref={connLlamaDispatchRef}   className="stroke-1 fill-none stroke-[var(--packet-color)] opacity-30 transition-colors duration-1000" d="M 550 100 C 700 100, 700 200, 850 200" />
            <path ref={connMistralDispatchRef} className="stroke-1 fill-none stroke-[var(--packet-color)] opacity-30 transition-colors duration-1000" d="M 550 200 L 850 200" />
            <path ref={connGroqDispatchRef}    className="stroke-1 fill-none stroke-[var(--packet-color)] opacity-30 transition-colors duration-1000" d="M 550 300 C 700 300, 700 200, 850 200" />

            {/* Main flow: continuous, never-stopping start-to-end cycle */}
            {engineActive && (
              <MainFlowLoop
                packetsConfig={config.packets}
                nodesRefs={nodesRefs}
                pathsRefs={pathsRefs}
                bgRef={bgRef}
                onConsensusStatus={setConsensusStatus}
              />
            )}
          </svg>


          {/* Consensus Inline Layer */}
          <AnimatePresence>
            {consensusStatus && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: '-50%', x: '-50%' }}
                animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
                exit={{ opacity: 0, scale: 1.05, y: '-50%', x: '-50%' }}
                transition={{ duration: 0.3 }}
                className="absolute left-[70%] top-1/2 z-[60] flex flex-col items-center justify-center pointer-events-none"
              >
                <div className="bg-surface-dim border border-[var(--color-accent)] px-4 py-2 shadow-[0_0_30px_var(--engine-node-glow)]">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--color-accent)] whitespace-nowrap">
                    {consensusStatus === 'building' ? t('engine_consensus_building') : t('engine_consensus_reached')}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Depth Layer 3: Processing Nodes */}
          <motion.div style={{ x: l3x, y: l3y }} className="hidden md:block absolute inset-0 z-20 pointer-events-none">
            <Node
              ref={ingestionRef}
              style={{ left: '15%', top: '50%' }}
              role={config.nodes.ingestion.role}
              title={config.nodes.ingestion.title}
              desc={config.nodes.ingestion.desc}
              theme={theme}
            >
              {t('engine_node_ingestion_title')}
            </Node>
            <Node
              ref={logicGateRef}
              style={{ left: '35%', top: '50%', transform: 'translate(-50%, -50%) scale(1.15)' }}
              role={config.nodes.logicGate.role}
              title={config.nodes.logicGate.title}
              desc={config.nodes.logicGate.desc}
              theme={theme}
            >
              {t('engine_node_logicGate_title')}
            </Node>
            <Node
              ref={mistralRef}
              className="diagram-node--accent"
              style={{ left: '55%', top: '50%' }}
              role={config.nodes.mistral.role}
              title={config.nodes.mistral.title}
              desc={config.nodes.mistral.desc}
              theme={theme}
            >
              {t('engine_node_mistral_title')}
            </Node>
            <Node
              ref={llamaRef}
              style={{ left: '55%', top: '25%' }}
              role={config.nodes.llama.role}
              title={config.nodes.llama.title}
              desc={config.nodes.llama.desc}
              theme={theme}
            >
              {t('engine_node_llama_title')}
            </Node>
            <Node
              ref={groqRef}
              style={{ left: '55%', top: '75%' }}
              role={config.nodes.groq.role}
              title={config.nodes.groq.title}
              desc={config.nodes.groq.desc}
              theme={theme}
            >
              {t('engine_node_groq_title')}
            </Node>
            <Node
              ref={dispatchRef}
              className="diagram-node--accent"
              style={{ left: '85%', top: '50%', transform: 'translate(-50%, -50%) scale(1.4)' }}
              role={config.nodes.dispatch.role}
              title={config.nodes.dispatch.title}
              desc={config.nodes.dispatch.desc}
              theme={theme}
            >
              {t('engine_node_dispatch_title')}
            </Node>
          </motion.div>

          <div className="md:hidden flex flex-col items-center justify-center h-full gap-8 z-20 w-full relative">
            <MobileNode>{t('engine_node_ingestion_title')}</MobileNode>
            <div className="h-4 border-l border-[var(--color-accent)] opacity-30" />
            <MobileNode>{t('engine_node_logicGate_title')}</MobileNode>
            <div className="h-4 border-l border-[var(--color-accent)] opacity-30" />
            <div className="flex gap-4">
              <MobileNode pulsing>{t('engine_node_llama_title')}</MobileNode>
              <MobileNode pulsing>{t('engine_node_mistral_title')}</MobileNode>
            </div>
            <div className="h-4 border-l border-[var(--color-accent)] opacity-30" />
            <MobileNode>{t('engine_node_dispatch_title')}</MobileNode>
          </div>
        </div>

        {/* Intelligence Metrics Strip */}
        <div className="border border-t-0 border-border-subtle bg-surface px-6 py-2 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[9px] uppercase tracking-widest font-bold text-text-muted">
          <MetricsTicker label={t('engine_sources')} value={52143} prefix="" suffix="" />
          <span className="text-border-subtle hidden md:inline">•</span>
          <MetricsTicker label={t('engine_signals')} value={2.4} prefix="" suffix="M" isFloat />
          <span className="text-border-subtle hidden md:inline">•</span>
          <MetricsTicker label={t('engine_confidence')} value={98.4} prefix="" suffix="%" isFloat />
          <span className="text-border-subtle hidden md:inline">•</span>
          <MetricsTicker label={t('engine_latency')} value={1.2} prefix="" suffix="s" isFloat />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
        <PhaseCard phase="1" title={t('engine_card1_title')} desc={t('engine_card1_desc')} onClick={() => setSelectedPhase("1")} />
        <PhaseCard phase="2" title={t('engine_card2_title')} desc={t('engine_card2_desc')} delay={0.1} onClick={() => setSelectedPhase("2")} />
        <PhaseCard phase="3" title={t('engine_card3_title')} desc={t('engine_card3_desc')} delay={0.2} onClick={() => setSelectedPhase("3")} />
        <PhaseCard phase="4" title={t('engine_card4_title')} desc={t('engine_card4_desc')} delay={0.3} onClick={() => setSelectedPhase("4")} />
      </div>

      <style>{`
        .diagram-node {
          position: absolute;
          background: var(--curr-surface);
          border: 1px solid var(--curr-border-subtle);
          padding: 0.5rem 1rem;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 700;
          white-space: nowrap;
          transform: translate(-50%, -50%);
          z-index: 20;
        }

        .diagram-node--accent {
          border-color: var(--color-accent) !important;
          box-shadow: var(--engine-node-glow) !important;
        }

        .diagram-node:hover {
          border-color: color-mix(in srgb, var(--color-accent) 80%, transparent) !important;
          box-shadow: var(--engine-node-glow) !important;
          z-index: 50;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .diagram-pulse-ring {
          position: absolute;
          inset: -8px;
          pointer-events: none;
          opacity: 0;
          transform-origin: center center;
          border: 1px solid var(--color-theme-glow);
          border-radius: 2px;
        }

        .phase-card .phase-accent-bar {
          background: var(--color-accent);
        }

        .packet {
          offset-rotate: auto;
        }
      `}</style>
    </section>
    </>
  );
}

function PhaseDetailModal({ selectedPhase, onClose }: { selectedPhase: string | null, onClose: () => void }) {
  if (!selectedPhase) return null;

  let title = '';
  let imgPath = '';
  let deepDive = '';
  let techStack = '';

  if (selectedPhase === '1') {
    title = 'Phase 01: Ingestion Pipeline';
    imgPath = '/images/engine_phase_1_ingestion_1782329229325.png';
    deepDive = 'The Ingestion Pipeline operates a distributed network of highly optimized scrapers and API listeners. It continuously monitors target domains such as ArXiv, GitHub repositories, HackerNews, and top-tier AI engineering blogs. By running parallel asynchronous tasks, it extracts raw text and normalizes chaotic data formats into a unified JSON structure, ready for the neural network.';
    techStack = 'Node.js, Cheerio, RSS, WebSockets';
  } else if (selectedPhase === '2') {
    title = 'Phase 02: Evaluation & Vectorization';
    imgPath = '/images/engine_phase_2_evaluation_1782329240719.png';
    deepDive = 'In the Evaluation phase, raw signals are converted into high-dimensional embeddings using a lightweight embedding model. These vectors are mapped into a 3D coordinate space and compared using Cosine Similarity. This allows NeuralBrief to instantly cluster duplicate stories, eliminate noisy outliers, and score the relevance of the news against your personal technical profile.';
    techStack = 'Pinecone, ChromaDB, Cosine Similarity';
  } else if (selectedPhase === '3') {
    title = 'Phase 03: Multi-Agent Synthesis';
    imgPath = '/images/engine_phase_3_synthesis_1782329250128.png';
    deepDive = 'Synthesis is the core of the engine. Here, we deploy a multi-agent consensus model. Llama 3 handles logical summarization, Mistral verifies technical accuracy, and Groq ensures hyper-fast inference. The agents debate the raw data and reach a consensus, ensuring the final output is factually sound, deeply technical, and free of AI hallucinations.';
    techStack = 'Llama 3, Mistral, Groq LPU, LangChain';
  } else if (selectedPhase === '4') {
    title = 'Phase 04: Delivery & Dispatch';
    imgPath = '/images/engine_phase_4_delivery_1782329262802.png';
    deepDive = 'The final Delivery phase compiles the synthesized intelligence into a sleek, readable executive briefing. The payload is packaged, compressed, and fired via a low-latency SMTP relay directly to the user\'s inbox at the exact scheduled time. This ensures you receive the latest, deduplicated intelligence without ever opening a dashboard.';
    techStack = 'SendGrid, SMTP Relay, React Email';
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-8"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface border border-border-subtle shadow-2xl max-w-4xl w-full rounded-sm overflow-hidden flex flex-col md:flex-row relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-accent hover:text-black transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          <div className="md:w-1/2 h-64 md:h-auto relative bg-surface-dim">
            <img src={imgPath} alt={title} className="w-full h-full object-cover opacity-80 mix-blend-screen" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent md:bg-gradient-to-r md:from-transparent md:to-surface" />
          </div>

          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <span className="text-[10px] text-accent font-bold uppercase tracking-widest mb-4">Neural Architecture</span>
            <h3 className="text-3xl font-heading mb-6">{title}</h3>
            <p className="text-text-muted text-sm leading-relaxed mb-8">{deepDive}</p>
            
            <div className="mt-auto">
              <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold block mb-3">Core Stack</span>
              <div className="flex flex-wrap gap-2">
                {techStack.split(', ').map(tech => (
                  <span key={tech} className="text-[10px] uppercase tracking-widest border border-accent/30 text-accent bg-accent/5 px-3 py-1 rounded-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function MetricsTicker({ label, value, prefix, suffix, isFloat }: { label: string, value: number, prefix: string, suffix: string, isFloat?: boolean }) {
  const [displayValue, setDisplayValue] = useState(value * 0.95);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue(prev => {
        const target = value + (Math.random() * 0.1 * value) - (0.05 * value);
        return prev + (target - prev) * 0.1;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [value]);

  const formatted = isFloat ? displayValue.toFixed(1) : Math.round(displayValue).toLocaleString();

  return (
    <span className="flex items-center gap-2">
      <span className="text-text-main transition-colors duration-500">{prefix}{formatted}{suffix}</span>
      <span className="text-[var(--color-accent)] transition-colors duration-500 opacity-80">{label}</span>
    </span>
  );
}

export interface NodeHandle {
  pulse: (packetName: string, isMajor?: boolean) => void;
  get el(): HTMLDivElement | null;
}

const Node = forwardRef<NodeHandle, {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  role: string;
  title: string;
  desc: string;
  rings?: React.RefObject<HTMLDivElement>[];
  theme?: string;
}>(function Node({ children, style, className, role, title, desc, rings, theme }, ref) {
  const { t } = useLanguage();
  const nodeRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [activePacket, setActivePacket] = useState<string | null>(null);
  const [queueSize, setQueueSize] = useState(() => Math.floor(Math.random() * 5));
  const [tooltipFlipped, setTooltipFlipped] = useState(false);

  useEffect(() => {
    if (!tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    setTooltipFlipped(rect.right > window.innerWidth - 16);
  }, [activePacket]);

  useImperativeHandle(ref, () => ({
    get el() { return nodeRef.current; },
    pulse: (packetName: string, isMajor = false) => {
      setActivePacket(packetName);
      setQueueSize(q => q + 1);

      if (nodeRef.current) {
        gsap.fromTo(nodeRef.current,
          { scale: isMajor ? 1.5 : 1.25, filter: isMajor ? 'brightness(2.5)' : 'brightness(1.8)', boxShadow: isMajor ? '0 0 100px var(--color-accent)' : '0 0 50px var(--color-accent)', borderColor: 'var(--color-accent)' },
          { scale: 1, filter: 'brightness(1)', boxShadow: '0 0 0px transparent', borderColor: 'transparent', duration: isMajor ? 1.0 : 0.6, ease: 'power2.out' }
        );
      }

      if (rippleRef.current) {
        gsap.fromTo(rippleRef.current,
          { opacity: isMajor ? 1 : 0.8, scale: 1, borderWidth: isMajor ? '4px' : '2px' },
          { opacity: 0, scale: isMajor ? 6 : 3.5, duration: isMajor ? 1.0 : 0.6, ease: 'power2.out' }
        );
      }

      setTimeout(() => {
        setActivePacket(null);
        setQueueSize(q => Math.max(0, q - 1));
      }, 2000);
    }
  }));

  return (
    <div
      ref={nodeRef}
      className={`diagram-node group cursor-default ${className ?? ''}`}
      style={style}
    >
      <div ref={rippleRef} className="absolute inset-0 rounded-full border-2 border-[var(--color-accent)] pointer-events-none opacity-0" />
      {children}
      {rings?.map((ring, i) => (
        <div key={i} ref={ring} className="diagram-pulse-ring" aria-hidden="true" />
      ))}

      {/* Rich Intelligence Panel */}
      <div
        ref={tooltipRef}
        className={
          tooltipFlipped
            ? "absolute right-0 top-full mt-4 w-64 bg-surface border border-border-subtle p-5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 z-50 shadow-xl text-left scale-95 group-hover:scale-100 origin-top"
            : "absolute left-1/2 top-full mt-4 -translate-x-1/2 w-64 bg-surface border border-border-subtle p-5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 z-50 shadow-xl text-left scale-95 group-hover:scale-100 origin-top"
        }
      >
        <div className="text-[9px] text-[var(--color-accent)] mb-3 uppercase tracking-widest transition-colors duration-500 font-bold">{role}</div>
        <div className="text-sm font-heading capitalize mb-2 text-text-main tracking-wide">{title}</div>

        {/* Information Dense Labels for specific themes */}
        {(theme === 'golden-executive' || theme === 'emerald-analyst') && (
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border-subtle">
            <span className="text-[8px] uppercase tracking-widest text-text-main font-bold">Latency: &lt;12ms</span>
            <span className="text-[8px] uppercase tracking-widest text-[var(--color-accent)] font-bold">Conf: 99.9%</span>
          </div>
        )}

        <div className="text-[11px] font-sans text-text-muted normal-case tracking-normal whitespace-normal leading-relaxed mb-3 pb-3 border-b border-border-subtle">{desc}</div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-bold">
            <span className="text-text-muted">{t('engine_status')}</span>
            <span className={activePacket ? "text-[var(--color-accent)]" : "text-text-main"}>
              {activePacket ? t('engine_active') : t('engine_standby')}
            </span>
          </div>
          <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-bold">
            <span className="text-text-muted">{t('engine_task')}</span>
            <span className="text-text-main truncate max-w-[120px] text-right" title={activePacket || t('engine_idle')}>
              {activePacket || t('engine_idle')}
            </span>
          </div>
          <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-bold">
            <span className="text-text-muted">{t('engine_queue')}</span>
            <span className="text-text-main">{queueSize} {t('engine_signals')}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

function MobileNode({
  children, style, pulsing = false, className,
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
      className={`relative bg-surface border border-[var(--color-accent)] px-4 py-2 text-[10px] tracking-widest uppercase flex items-center gap-2 z-20 font-bold whitespace-nowrap shadow-sm text-text-main transition-colors duration-500 ${className ?? ''}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export interface BackgroundHandle {
  pulseLocal: () => void;
  pulseGlobal: () => void;
}

// Depth Layer 1: Neural Network Background
const NeuralBackground = forwardRef<BackgroundHandle, { type: 'neural' | 'blueprint' | 'halos' | 'grid' }>(({ type }, ref) => {
  const bgRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    pulseLocal: () => {
      if (bgRef.current) {
        gsap.fromTo(bgRef.current,
          { filter: 'brightness(1.5) drop-shadow(0 0 20px var(--color-accent))' },
          { filter: 'brightness(1) drop-shadow(0 0 0px transparent)', duration: 0.8, ease: 'power2.out' }
        );
      }
    },
    pulseGlobal: () => {
      if (bgRef.current) {
        gsap.fromTo(bgRef.current,
          { opacity: 0.8, scale: 1.02, filter: 'brightness(2)' },
          { opacity: 0.2, scale: 1, filter: 'brightness(1)', duration: 1.2, ease: 'power2.out' }
        );
      }
    }
  }));

  const dots = React.useMemo(() => Array.from({ length: 100 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
  })), []);

  const lines = React.useMemo(() => Array.from({ length: 150 }).map((_, i) => {
    const d1 = dots[Math.floor(Math.random() * dots.length)];
    const d2 = dots[Math.floor(Math.random() * dots.length)];
    return { id: i, x1: d1.x, y1: d1.y, x2: d2.x, y2: d2.y };
  }), [dots]);

  if (type === 'blueprint' || type === 'grid') {
    return (
      <div ref={bgRef} className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
        <svg width="100%" height="100%" className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-accent)" strokeWidth="0.5" className="transition-colors duration-500" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    );
  }

  if (type === 'halos') {
    return (
      <div ref={bgRef} className="absolute inset-0 overflow-hidden pointer-events-none z-0 mix-blend-screen opacity-20">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[100px] transition-colors duration-1000"
          style={{ background: 'var(--color-theme-glow)' }}
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] rounded-full blur-[120px] transition-colors duration-1000"
          style={{ background: 'var(--color-theme-glow)' }}
        />
      </div>
    );
  }

  return (
    <div ref={bgRef} className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-20 mix-blend-screen">
      <svg width="100%" height="100%" className="w-full h-full">
        {lines.map((line) => (
          <motion.line
            key={line.id}
            x1={`${line.x1}%`} y1={`${line.y1}%`}
            x2={`${line.x2}%`} y2={`${line.y2}%`}
            className="stroke-[var(--color-accent)] transition-colors duration-500"
            strokeWidth="0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 3 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 5 }}
          />
        ))}
        {dots.map((dot) => (
          <motion.circle
            key={dot.id}
            cx={`${dot.x}%`} cy={`${dot.y}%`} r={dot.size}
            className="fill-[var(--color-accent)] transition-colors duration-500"
            initial={{ opacity: 0.1 }}
            animate={{ opacity: [0.1, 0.6, 0.1], scale: [1, 1.2, 1] }}
            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
          />
        ))}
      </svg>
    </div>
  );
});

function PhaseCard({
  phase, title, desc, delay = 0, onClick
}: {
  phase: string; title: string; desc: string; delay?: number; onClick?: () => void;
}): React.JSX.Element {
  const { t } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    card.style.transform =
      `perspective(600px) rotateX(${(-y * 12).toFixed(2)}deg) rotateY(${(x * 12).toFixed(2)}deg) scale3d(1.02,1.02,1.02)`;
    if (glareRef.current) {
      const gx = Math.round((x + 0.5) * 100);
      const gy = Math.round((y + 0.5) * 100);
      glareRef.current.style.background =
        `radial-gradient(circle at ${gx}% ${gy}%, color-mix(in srgb, var(--color-accent) 15%, transparent) 0%, transparent 65%)`;
      glareRef.current.style.opacity = '1';
    }
    if (barRef.current) barRef.current.style.opacity = '1';
  }, []);

  const handleMouseLeave = useCallback((): void => {
    if (cardRef.current) cardRef.current.style.transform = '';
    if (glareRef.current) glareRef.current.style.opacity = '0';
    if (barRef.current) barRef.current.style.opacity = '0';
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
        onClick={onClick}
        className="phase-card group cursor-pointer relative bg-transparent hover:bg-surface-dim p-4 border border-transparent hover:border-border-subtle overflow-hidden [transform-style:preserve-3d] h-full"
        style={{ transition: 'transform 0.15s ease-out, background-color 0.2s ease, border-color 0.2s ease' }}
      >
        <div ref={barRef} className="phase-accent-bar absolute left-0 top-0 bottom-0 w-[2px] opacity-0"
          style={{ transition: 'opacity 0.2s ease' }} aria-hidden="true" />
        <div ref={glareRef} className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-500"
          aria-hidden="true" />
        <BookmarkButton sectionId={`Phase: ${title}`} />
        <span className="text-[10px] uppercase tracking-widest opacity-50 block mb-1">0{phase} / {t('phase')}</span>
        <h4 className="text-lg font-heading leading-tight group-hover:italic transition-all mb-2 mt-4">{title}</h4>
        <p className="text-xs text-text-muted leading-relaxed font-sans">{desc}</p>
      </div>
    </motion.div>
  );
}

// ── Main Flow Loop ─────────────────────────────────────────────────────────
// A single packet continuously cycles the entire pipeline start-to-end:
// Ingestion -> LogicGate -> (Llama + Mistral + Groq, all three together) ->
// Dispatch -> consensus reached -> brief pause -> repeat forever.
// This replaced the old random-spawn / multi-packet system: that system could
// go long stretches without ever rolling a three-way "multiple" packet, which
// looked like the split animation "only ran once." A single dedicated loop
// guarantees the full circuit is always visible and never stops.
function MainFlowLoop({
  packetsConfig,
  nodesRefs,
  pathsRefs,
  bgRef,
  onConsensusStatus,
}: {
  packetsConfig: string[];
  nodesRefs: Record<string, React.RefObject<NodeHandle>>;
  pathsRefs: Record<string, React.RefObject<SVGPathElement>>;
  bgRef: React.RefObject<BackgroundHandle>;
  onConsensusStatus: (status: 'building' | 'reached' | null) => void;
}) {
  // 'leg1' = Ingestion -> LogicGate -> Processors (merged path)
  // 'leg2' = Processors -> Dispatch
  const [leg, setLeg] = useState<'leg1' | 'leg2'>('leg1');
  const [cycleId, setCycleId] = useState(0);
  const [name, setName] = useState(() => packetsConfig[Math.floor(Math.random() * packetsConfig.length)]);

  // Stable per-cycle motion config — recomputed only on mount, never on
  // unrelated re-renders, so Framer Motion never sees a "changed" transition
  // mid-flight.
  const [speed] = useState(() => {
    const root = document.documentElement;
    const mult = parseFloat(getComputedStyle(root).getPropertyValue('--motion-speed-multiplier').trim()) || 1;
    return 1.6 / mult;
  });
  const [transition] = useState(() => ({ duration: speed, ease: 'linear' as const }));
  const [animate] = useState(() => ({
    offsetDistance: ['0%', '0%', '100%', '100%'] as string[],
    opacity: [0, 1, 1, 0] as number[],
  }));
  const [times] = useState(() => [0, 0.05, 0.92, 1]);

  const pulsePath = useCallback((ref?: React.RefObject<SVGPathElement>) => {
    if (ref?.current) {
      gsap.fromTo(ref.current,
        { strokeOpacity: 1, strokeWidth: 3, filter: 'drop-shadow(0 0 10px var(--color-accent))' },
        { strokeOpacity: 0.3, strokeWidth: 1, filter: 'none', duration: 1.5, ease: 'power2.out' }
      );
    }
  }, []);

  // Fires once per leg per cycle: node pulses + the LogicGate mid-flight pulse.
  useEffect(() => {
    if (leg === 'leg1') {
      nodesRefs.ingestion.current?.pulse(name);
      pulsePath(pathsRefs.ingestionToLogic);

      const logicGateDelay = speed * 0.4 * 1000;
      const logicGateTimer = setTimeout(() => {
        nodesRefs.logicGate.current?.pulse(name);
        bgRef.current?.pulseLocal();
        pulsePath(pathsRefs.logicToLlama);
        pulsePath(pathsRefs.logicToMistral);
        pulsePath(pathsRefs.logicToGroq);
      }, logicGateDelay);

      return () => clearTimeout(logicGateTimer);
    } else {
      nodesRefs.llama.current?.pulse(name);
      nodesRefs.mistral.current?.pulse(name);
      nodesRefs.groq.current?.pulse(name);
      onConsensusStatus('building');
      pulsePath(pathsRefs.llamaToDispatch);
      pulsePath(pathsRefs.mistralToDispatch);
      pulsePath(pathsRefs.groqToDispatch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leg, cycleId]);

  const handleLeg1End = useCallback(() => {
    setLeg('leg2');
  }, []);

  const handleLeg2End = useCallback(() => {
    nodesRefs.dispatch.current?.pulse(name, true);
    bgRef.current?.pulseGlobal();
    onConsensusStatus('reached');
    setTimeout(() => {
      onConsensusStatus(null);
      // Start the next full circuit: new packet name, back to leg1.
      setName(packetsConfig[Math.floor(Math.random() * packetsConfig.length)]);
      setLeg('leg1');
      setCycleId(c => c + 1);
    }, 600);
  }, [name, packetsConfig, nodesRefs, bgRef, onConsensusStatus]);

  if (leg === 'leg1') {
    return (
      <>
        <PacketGraphic key={`l1-llama-${cycleId}`}   path={PATHS.merged_llama}   onEnd={handleLeg1End} transition={transition} animate={animate} times={times} />
        <PacketGraphic key={`l1-mistral-${cycleId}`} path={PATHS.merged_mistral}                       transition={transition} animate={animate} times={times} />
        <PacketGraphic key={`l1-groq-${cycleId}`}    path={PATHS.merged_groq}                          transition={transition} animate={animate} times={times} />
      </>
    );
  }

  return (
    <>
      <PacketGraphic key={`l2-llama-${cycleId}`}   path={PATHS.stage3_llama}   onEnd={handleLeg2End} transition={transition} animate={animate} times={times} />
      <PacketGraphic key={`l2-mistral-${cycleId}`} path={PATHS.stage3_mistral}                       transition={transition} animate={animate} times={times} />
      <PacketGraphic key={`l2-groq-${cycleId}`}    path={PATHS.stage3_groq}                          transition={transition} animate={animate} times={times} />
    </>
  );
}

function PacketGraphic({
  path, onEnd, transition, animate: animateProps, times,
}: {
  path: string;
  onEnd?: () => void;
  transition: any;
  animate: { offsetDistance: string[]; opacity: number[] };
  times: number[];
}) {
  const gRef = useRef<SVGGElement>(null);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    if (!gRef.current) return;
    const dur = transition.duration;
    const tl = gsap.timeline({ onComplete: () => onEndRef.current?.() });
    
    gsap.set(gRef.current, { offsetDistance: "0%", opacity: 0 });
    
    tl.to(gRef.current, {
      offsetDistance: "100%",
      duration: dur,
      ease: "linear"
    }, 0);
    
    tl.to(gRef.current, {
      opacity: 1,
      duration: dur * 0.05,
      ease: "power1.inOut"
    }, 0);
    
    tl.to(gRef.current, {
      opacity: 0,
      duration: dur * 0.08,
      ease: "power1.inOut"
    }, dur * 0.92);

    return () => { tl.kill(); };
  }, [path, transition.duration]);

  return (
    <g
      ref={gRef}
      style={{ offsetPath: path, transformBox: 'view-box', offsetRotate: 'auto' } as React.CSSProperties}
    >
      <ellipse cx="-18" cy="0" rx="18" ry="2" fill="url(#trail-gradient)" />
      <circle cx="0" cy="0" r="14" fill="var(--color-theme-glow)" opacity="0.7" filter="url(#dot-glow)" />
      <circle cx="0" cy="0" r="4" fill="var(--color-accent)" />
    </g>
  );
}

export default Engine;