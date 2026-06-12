import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { BookmarkButton } from './BookmarkButton';

export function Engine() {
  const { t } = useLanguage();

  const drawAnim = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1, 
      transition: { pathLength: { delay: 0.5, type: "spring", duration: 1.5, bounce: 0 }, opacity: { delay: 0.5, duration: 0.01 } } 
    }
  };

  const streamAnim = {
    animate: {
      strokeDashoffset: [100, -100],
      transition: { duration: 1.5, repeat: Infinity, ease: "linear" }
    }
  };

  return (
    <section className="py-32 px-6 md:px-16 max-w-7xl mx-auto" id="process">
      <motion.div 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16"
      >
        <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-4 block font-bold">{t('engine_overline')}</span>
        <h2 className="font-heading text-5xl mb-6">{t('engine_title_1')} <span className="italic">{t('engine_title_2')}</span></h2>
        <p className="text-text-muted max-w-2xl mx-auto text-sm leading-relaxed">
          {t('engine_desc')}
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="relative h-[600px] md:h-[450px] bg-surface-dim border border-border-subtle mt-12 overflow-hidden flex items-center justify-center p-8"
      >
        <div className="absolute top-5 right-5 bg-surface border border-border-subtle px-3 py-2 text-[9px] uppercase tracking-widest text-text-main z-10 overflow-hidden font-bold">
          Protocol Active : Consensus
          <motion.div 
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 w-full h-[1px] bg-text-main opacity-20"
          />
        </div>

        <svg className="hidden md:block w-full h-full absolute top-0 left-0" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet">
          <motion.path variants={drawAnim} initial="hidden" whileInView="visible" viewport={{ once: true }} className="stroke-border-subtle stroke-1 fill-none" d="M 150 200 L 350 200" />
          <motion.path variants={drawAnim} initial="hidden" whileInView="visible" viewport={{ once: true }} className="stroke-border-subtle stroke-1 fill-none" d="M 350 200 C 450 200, 450 100, 550 100" />
          <motion.path variants={drawAnim} initial="hidden" whileInView="visible" viewport={{ once: true }} className="stroke-border-subtle stroke-1 fill-none" d="M 350 200 L 550 200" />
          <motion.path variants={drawAnim} initial="hidden" whileInView="visible" viewport={{ once: true }} className="stroke-border-subtle stroke-1 fill-none" d="M 350 200 C 450 200, 450 300, 550 300" />
          <motion.path variants={drawAnim} initial="hidden" whileInView="visible" viewport={{ once: true }} className="stroke-border-subtle stroke-1 fill-none" d="M 550 100 C 700 100, 700 200, 850 200" />
          <motion.path variants={drawAnim} initial="hidden" whileInView="visible" viewport={{ once: true }} className="stroke-border-subtle stroke-1 fill-none" d="M 550 200 L 850 200" />
          <motion.path variants={drawAnim} initial="hidden" whileInView="visible" viewport={{ once: true }} className="stroke-border-subtle stroke-1 fill-none" d="M 550 300 C 700 300, 700 200, 850 200" />

          <motion.path variants={streamAnim} animate="animate" style={{ strokeDasharray: "8, 30" }} className="stroke-text-main stroke-1 fill-none opacity-40" d="M 150 200 L 350 200" />
          <motion.path variants={streamAnim} animate="animate" style={{ strokeDasharray: "8, 30" }} className="stroke-text-main stroke-1 fill-none opacity-40" d="M 350 200 C 450 200, 450 100, 550 100" />
          <motion.path variants={streamAnim} animate="animate" style={{ strokeDasharray: "8, 30" }} className="stroke-text-main stroke-1 fill-none opacity-40" d="M 350 200 L 550 200" />
          <motion.path variants={streamAnim} animate="animate" style={{ strokeDasharray: "8, 30" }} className="stroke-text-main stroke-1 fill-none opacity-40" d="M 350 200 C 450 200, 450 300, 550 300" />
          <motion.path variants={streamAnim} animate="animate" style={{ strokeDasharray: "8, 30" }} className="stroke-text-main stroke-1 fill-none opacity-40" d="M 550 100 C 700 100, 700 200, 850 200" />
          <motion.path variants={streamAnim} animate="animate" style={{ strokeDasharray: "8, 30" }} className="stroke-text-main stroke-1 fill-none opacity-40" d="M 550 200 L 850 200" />
          <motion.path variants={streamAnim} animate="animate" style={{ strokeDasharray: "8, 30" }} className="stroke-text-main stroke-1 fill-none opacity-40" d="M 550 300 C 700 300, 700 200, 850 200" />
        </svg>

        {/* Nodes for Desktop */}
        <div className="hidden md:block">
          <Node style={{ left: "15%", top: "50%" }}>Ingestion</Node>
          <Node style={{ left: "35%", top: "50%" }}>Logic Gate</Node>
          <Node style={{ left: "55%", top: "25%" }} pulsing>Llama 3</Node>
          <Node style={{ left: "55%", top: "50%" }} pulsing>Mistral</Node>
          <Node style={{ left: "55%", top: "75%" }} pulsing>Groq</Node>
          <Node style={{ left: "85%", top: "50%" }}>Dispatch</Node>
        </div>
        
        {/* Mobile View */}
        <div className="md:hidden flex flex-col items-center justify-center h-full gap-8 z-10 w-full">
           <Node>Ingestion</Node>
           <div className="h-4 border-l border-text-main/20"></div>
           <Node>Logic Gate</Node>
           <div className="h-4 border-l border-text-main/20"></div>
           <div className="flex gap-4">
             <Node pulsing>Llama</Node>
             <Node pulsing>Mistral</Node>
           </div>
           <div className="h-4 border-l border-text-main/20"></div>
           <Node>Dispatch</Node>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
        <PhaseCard phase="1" title="Ingestion" desc="Real-time monitoring of ArXiv, GitHub, and RSS." />
        <PhaseCard phase="2" title="Evaluation" desc="Deduplication and vector relevance scoring." delay={0.1} />
        <PhaseCard phase="3" title="Synthesis" desc="Consensus modeling for technical abstraction." delay={0.2} />
        <PhaseCard phase="4" title="Delivery" desc="Final dispatch via low-latency SMTP." delay={0.3} />
      </div>
    </section>
  );
}

function Node({ children, style, pulsing = false, className }: { children: React.ReactNode, style?: React.CSSProperties, pulsing?: boolean, className?: string }) {
  return (
    <motion.div 
      animate={pulsing ? { opacity: [0.8, 1, 0.8] } : undefined}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={`relative md:absolute bg-surface border border-border-subtle px-4 py-2 text-[10px] tracking-widest uppercase flex items-center gap-2 md:-translate-x-1/2 md:-translate-y-1/2 z-10 font-bold whitespace-nowrap shadow-sm text-text-main ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function PhaseCard({ phase, title, desc, delay = 0 }: { phase: string, title: string, desc: string, delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.5, delay }}
      className="group cursor-pointer relative bg-transparent hover:bg-surface-dim transition-colors rounded p-4 border border-transparent hover:border-border-subtle"
    >
      <BookmarkButton sectionId={`Phase: ${title}`} />
      <span className="text-[10px] uppercase tracking-widest opacity-50 block mb-1">0{phase} / Phase</span>
      <h4 className="text-lg font-heading leading-tight group-hover:italic transition-all mb-2 mt-4">{title}</h4>
      <p className="text-xs text-text-muted leading-relaxed font-sans">{desc}</p>
    </motion.div>
  );
}
