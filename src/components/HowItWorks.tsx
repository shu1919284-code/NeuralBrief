import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

export function HowItWorks(): React.JSX.Element {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState(0);
  const isDesktop = useMediaQuery('(min-width: 1024px)'); // lg

  const steps = [
    {
      id: 0,
      title: t('how_step1_title'),
      desc: t('how_step1_desc')
    },
    {
      id: 1,
      title: t('how_step2_title'),
      desc: t('how_step2_desc')
    },
    {
      id: 2,
      title: t('how_step3_title'),
      desc: t('how_step3_desc')
    },
    {
      id: 3,
      title: t('how_step4_title'),
      desc: t('how_step4_desc')
    }
  ];

  return (
    <section className="py-32 px-6 md:px-16 max-w-7xl mx-auto relative" id="how-it-works">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-24"
      >
        <span className="text-[10px] uppercase tracking-widest text-text-muted mb-4 block font-bold">
          {t('how_overline')}
        </span>
        <h2 className="text-4xl md:text-5xl font-heading mb-6">
          {t('how_title_1')} <span className="italic">{t('how_title_2')}</span>
        </h2>
        <p className="text-sm md:text-base text-text-muted max-w-2xl mx-auto leading-relaxed">
          {t('how_desc')}
        </p>
      </motion.div>

      {/* Main Content Layout */}
      {isDesktop ? (
        <div className="grid grid-cols-12 gap-16 relative">
          
          {/* Left Column: Text Steps */}
          <div className="col-span-5 pb-32">
            {steps.map((step, index) => (
              <StepTracker
                key={step.id}
                step={step}
                index={index}
                isActive={activeStep === index}
                onActive={() => setActiveStep(index)}
              />
            ))}
          </div>

          {/* Right Column: Sticky Visual */}
          <div className="col-span-7 relative">
            <div className="sticky top-32 h-[500px] w-full">
              <div className="w-full h-full bg-surface-dim border border-border-subtle overflow-hidden relative flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <VisualState key={activeStep} stepId={activeStep} />
                </AnimatePresence>
                
                {/* Subtle corner framing */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-text-main/20" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-text-main/20" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-text-main/20" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-text-main/20" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Mobile: Stacked Cards */
        <div className="flex flex-col gap-12">
          {steps.map((step, index) => (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col"
            >
              <div className="h-[250px] w-full bg-surface-dim border border-border-subtle relative overflow-hidden flex items-center justify-center mb-6">
                 <VisualState stepId={index} />
              </div>
              <div className="border-l-2 border-text-main pl-6 py-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2 block">
                  0{index + 1} / {t('phase')}
                </span>
                <h3 className="text-2xl font-heading mb-4">{step.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Metrics Row beneath section */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.2 }}
        className="mt-32 pt-16 border-t border-border-subtle grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
      >
        <div>
          <div className="text-4xl font-heading text-text-main mb-2">{t('how_metrics_volume') || '2.4M+'}</div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-text-muted">{t('how_metrics_volume_label') || 'Documents Analyzed'}</div>
        </div>
        <div>
          <div className="text-4xl font-heading text-text-main mb-2">{t('how_metrics_noise') || '98%'}</div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-text-muted">{t('how_metrics_noise_label') || 'Noise Filtered'}</div>
        </div>
        <div>
          <div className="text-4xl font-heading text-text-main mb-2">{t('how_metrics_time') || '12hrs'}</div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-text-muted">{t('how_metrics_time_label') || 'Saved per User/Week'}</div>
        </div>
      </motion.div>

    </section>
  );
}

// Track when a step text block enters the center of the screen
function StepTracker({ step, index, isActive, onActive }: { key?: React.Key; step: any; index: number; isActive: boolean; onActive: () => void }) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"]
  });

  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      // If we are currently scrolling within this block's center bounds
      if (latest > 0 && latest < 1) {
        onActive();
      }
    });
  }, [scrollYProgress, onActive]);

  return (
    <div 
      ref={ref} 
      className="min-h-[400px] flex flex-col justify-center" // Tall height to ensure scroll space
    >
      <div 
        className={`transition-all duration-500 border-l-2 pl-8 py-4 ${
          isActive ? 'border-[var(--color-accent)] opacity-100' : 'border-border-subtle opacity-30'
        }`}
      >
        <span className="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-3 block">
          0{index + 1} / {t('phase')}
        </span>
        <h3 className={`text-3xl font-heading mb-6 transition-all duration-500 ${isActive ? 'translate-x-0' : '-translate-x-2'}`}>
          {step.title}
        </h3>
        <p className="text-sm text-text-muted leading-relaxed max-w-md">
          {step.desc}
        </p>
      </div>
    </div>
  );
}

// The abstract visuals for each step
function VisualState({ stepId }: { key?: React.Key; stepId: number }) {
  // Shared animation variants for the container
  const variants = {
    initial: { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, scale: 1.05, filter: 'blur(10px)', transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div
      variants={variants as any}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute inset-0 flex items-center justify-center w-full h-full p-8"
    >
      {stepId === 0 && <VisualMonitor />}
      {stepId === 1 && <VisualFilter />}
      {stepId === 2 && <VisualSynthesize />}
      {stepId === 3 && <VisualDeliver />}
    </motion.div>
  );
}

function VisualMonitor() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Concentric expanding scanning rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 4, repeat: Infinity, delay: i * 1.3, ease: "linear" }}
          className="absolute w-32 h-32 rounded-full border border-[var(--color-accent)] opacity-30"
        />
      ))}
      <div className="absolute w-2 h-2 rounded-full shadow-[0_0_15px_var(--color-theme-glow)] bg-[var(--color-accent)]" />
      
      {/* Floating data nodes being scanned */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`node-${i}`}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
          className="absolute w-1 h-1 bg-[var(--color-accent)] opacity-50 rounded-full"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
        />
      ))}
    </div>
  );
}

function VisualFilter() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Central horizontal signal beam */}
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute w-full h-[1px] bg-[var(--color-accent)] shadow-[0_0_10px_var(--color-theme-glow)] z-10"
      />
      
      {/* Particles moving towards the center, some disappearing (noise), some aligning (signal) */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => {
          const isSignal = Math.random() > 0.6;
          const startY = Math.random() > 0.5 ? -20 : 120; // Start offscreen top or bottom
          
          return (
            <motion.div
              key={`particle-${i}`}
              initial={{ y: `${startY}%`, x: `${Math.random() * 100}%`, opacity: 0 }}
              animate={{ 
                y: isSignal ? '50%' : `${startY > 0 ? 30 : 70}%`, // Signal goes to center line, noise stops short
                opacity: isSignal ? [0, 1, 1] : [0, 0.5, 0], // Signal stays visible, noise fades out
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                repeat: Infinity, 
                delay: Math.random() * 3,
                ease: "easeOut"
              }}
              className={`absolute w-1 h-1 rounded-full ${isSignal ? 'bg-[var(--color-accent)]' : 'bg-text-muted'}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function VisualSynthesize() {
  const { t } = useLanguage();
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
      {/* Simulated document forming */}
      <div className="w-64 h-80 border border-border-subtle bg-surface/50 p-6 flex flex-col gap-4 relative overflow-hidden backdrop-blur-sm">
        
        {/* Title line */}
        <motion.div 
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-4 w-3/4 bg-text-main/80 rounded origin-left"
        />
        
        {/* Paragraph lines */}
        <div className="space-y-2 mt-4">
          {[1, 0.9, 0.95, 0.6].map((width, i) => (
            <motion.div 
              key={i}
              initial={{ scaleX: 0, opacity: 0 }} 
              animate={{ scaleX: 1, opacity: 1 }} 
              transition={{ duration: 0.6, delay: 0.4 + (i * 0.1), ease: "easeOut" }}
              className="h-2 bg-text-muted/40 rounded origin-left"
              style={{ width: `${width * 100}%` }}
            />
          ))}
        </div>

        {/* Highlight/Extraction box appearing */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.2 }}
          className="mt-auto border border-[var(--color-accent)] bg-[var(--color-accent)]/5 p-3"
        >
          <div className="text-[8px] uppercase tracking-widest text-[var(--color-accent)] mb-1 font-bold">{t('how_visual_insight')}</div>
          <div className="h-1 w-full bg-[var(--color-accent)] opacity-40 rounded" />
        </motion.div>

        {/* Sweep effect over the document */}
        <motion.div 
          initial={{ top: '-10%' }} animate={{ top: '110%' }} 
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "linear" }}
          className="absolute left-0 w-full h-8 bg-gradient-to-b from-transparent via-[var(--color-accent)] to-transparent opacity-10 blur-sm pointer-events-none"
        />
      </div>
    </div>
  );
}

function VisualDeliver() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="w-24 h-24 bg-[var(--color-accent)] rounded-2xl flex items-center justify-center shadow-[0_0_30px_var(--color-theme-glow)] relative"
      >
        {/* Simple crisp icon for delivery/email/intel */}
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--curr-surface)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>

        {/* Notification badge popping in */}
        <motion.div 
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring" }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full border-2 border-surface-dim"
        />
      </motion.div>

      {/* Outward ripples indicating dispatch */}
      {[1, 2].map((i) => (
        <motion.div
          key={`ripple-${i}`}
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
          className="absolute w-24 h-24 border-2 border-[var(--color-accent)] rounded-2xl pointer-events-none"
        />
      ))}
    </div>
  );
}
