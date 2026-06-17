import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { X } from 'lucide-react';
import { TiltCard } from './TiltCard';
import { useLanguage } from '../contexts/LanguageContext';

export function Preview() {
  const { t } = useLanguage();
  const [showDoc, setShowDoc] = useState(false);
  const ref = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [50, -50]);

  const handleOpenDoc = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDoc(true);
  };

  return (
    <section ref={ref} className="py-32 px-6 md:px-16 max-w-7xl mx-auto" id="preview">
      <motion.div 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-12"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] mb-4 block font-bold">{t('preview_overline')}</span>
        <h2 className="font-heading text-5xl mb-8">{t('preview_title_1')} <span className="italic">{t('preview_title_2')}</span></h2>
        <div className="flex justify-center gap-4 flex-wrap">
          <button className="text-[10px] uppercase tracking-widest border-b border-text-main px-2 py-1 bg-transparent font-bold cursor-pointer hover:opacity-50 active:scale-95 transition-all">All Signals</button>
          <button className="text-[10px] uppercase tracking-widest text-text-muted px-2 py-1 hover:text-text-main font-bold cursor-pointer active:scale-95 transition-all">Research Core</button>
          <button className="text-[10px] uppercase tracking-widest text-text-muted px-2 py-1 hover:text-text-main font-bold cursor-pointer active:scale-95 transition-all">Agentic Ops</button>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="max-w-4xl mx-auto relative"
      >
        <motion.div style={{ y: y1 }} className="absolute -left-12 -top-12 z-0 w-32 h-32 bg-border-subtle rounded-full mix-blend-multiply opacity-50 blur-3xl" />
        
        <TiltCard className="bg-surface border border-border-subtle overflow-hidden relative z-10 w-full">
          <div className="bg-surface-dim px-6 py-3 flex items-center justify-center border-b border-border-subtle relative">
            <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold opacity-60">
              Inbound Stream / NeuralBrief
            </span>
          </div>
          
          <div className="p-8 md:p-12">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10 pb-6 border-b border-border-subtle">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-border-subtle rounded-full flex items-center justify-center font-bold text-xs text-text-main font-heading">NB</div>
                <div>
                  <div className="text-sm font-bold font-heading">NeuralBrief Core Engine</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mt-1">intel@neuralbrief.app</div>
                </div>
              </div>
              <div className="sm:ml-auto text-[10px] text-text-muted uppercase tracking-widest">07:00 UTC</div>
            </div>
            
            <h3 className="font-heading text-3xl md:text-5xl mb-8 leading-tight">NeuralBrief — Multi-Agent <span className="italic">Native Support Drops</span></h3>
            
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-text-muted mb-12 border-b border-border-subtle pb-4">
              Personalized Stream / 3 Primary Signals / 3200 Tokens
            </p>
            
            <div className="relative pt-6">
              <span className="text-[10px] uppercase tracking-widest font-bold text-text-muted block mb-4">
                01 / Core Model Analytics
              </span>
              <div 
                onClick={handleOpenDoc}
                className="bg-surface-dim p-8 hover:bg-surface-dim/80 active:bg-surface-dim/50 active:scale-[0.99] transition-all cursor-pointer border border-transparent hover:border-border-subtle group"
              >
                <h5 className="font-heading text-2xl mb-4 group-hover:italic transition-all">Open-weights frontier framework performs 4x faster on local runtimes</h5>
                <p className="text-sm text-text-main/70 mb-8 leading-relaxed max-w-2xl">
                  Architectural breakdown demonstrates parallel orchestration improvements, minimizing token generation overhead for processing complex structural reasoning dependencies.
                </p>
                <div className="flex flex-wrap items-center justify-between text-[10px] uppercase tracking-widest gap-4 border-t border-border-subtle pt-4">
                  <div className="flex gap-6 flex-wrap font-bold">
                    <span className="text-text-main">Update</span>
                    <span className="text-text-muted">llama-3-fp8</span>
                    <span className="text-text-muted">Conf: 0.982</span>
                  </div>
                  <a 
                    href="#" 
                    onClick={handleOpenDoc}
                    className="font-heading italic hover:opacity-50 active:scale-95 transition-all text-xs"
                  >
                    Read Full Doc
                  </a>
                </div>
              </div>
            </div>
          </div>
        </TiltCard>

        <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], [-30, 30]) }} className="absolute -right-8 -bottom-8 z-0 w-40 h-40 bg-text-main rounded-full mix-blend-multiply opacity-[0.03] blur-2xl" />
      </motion.div>

      {/* ── Simulated Full Document Reader Modal ───────────────────────────── */}
      <AnimatePresence>
        {showDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-surface/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="bg-surface border border-border-subtle rounded-xl p-8 md:p-10 w-full max-w-3xl relative max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <button
                onClick={() => setShowDoc(false)}
                className="absolute top-6 right-6 text-text-muted hover:text-text-main transition-colors cursor-pointer"
                aria-label="Close document reader"
              >
                <X size={24} />
              </button>

              <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-text-muted font-bold block mb-4 border-b border-border-subtle pb-2">
                NeuralBrief Briefing Reader / Technical Report
              </span>

              <h2 className="font-heading text-3xl md:text-4xl mb-6 leading-tight">
                Open-weights frontier framework performs 4x faster on local runtimes
              </h2>

              <div className="flex flex-wrap items-center gap-6 text-[10px] uppercase tracking-widest font-bold text-text-muted mb-8 border-b border-border-subtle pb-4">
                <div>Source: <span className="text-text-main">arXiv cs.LG</span></div>
                <div>Reference: <span className="text-text-main">llama-3-fp8</span></div>
                <div>Confidence: <span className="text-text-main">0.982</span></div>
                <div>Sync: <span className="text-text-main">07:00 UTC</span></div>
              </div>

              <div className="space-y-6 text-sm text-text-main/80 leading-relaxed font-sans">
                <p>
                  Foundational model execution limits are shifting rapidly towards decentralized local setups. This report covers the structural optimizations implemented in the <strong>Llama-3-FP8</strong> local quantization framework, enabling a massive <strong>4x acceleration</strong> in local token generation speed.
                </p>

                <h3 className="font-heading text-2xl text-text-main italic pt-2">Key Optimizations</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="bg-surface-dim p-5 border border-border-subtle">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-text-main mb-2">1. Memory-Level Fusion</h4>
                    <p className="text-xs text-text-muted">
                      Kernel operations are fused directly into memory pools, preventing off-chip transit latency and reducing cache-miss overhead.
                    </p>
                  </div>
                  <div className="bg-surface-dim p-5 border border-border-subtle">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-text-main mb-2">2. Static Static-Scale Quantization</h4>
                    <p className="text-xs text-text-muted">
                      Uses 8-bit floating point scales pre-computed statically, preserving model accuracy while maintaining low latency profiles.
                    </p>
                  </div>
                </div>

                <h3 className="font-heading text-2xl text-text-main italic pt-4">Implementation Architecture</h3>
                <p>
                  By compiling custom FlashAttention kernels that interlock directly with the GPU's low-precision hardware acceleration pipelines, the model can generate high-token streams without memory starvation issues.
                </p>

                <div className="bg-surface-dim p-5 rounded-lg border border-border-subtle font-mono text-xs overflow-x-auto my-4 text-text-main">
                  <span className="text-text-muted text-[10px] block mb-2">// Sample quantization pipeline script</span>
                  <span className="text-emerald-700">import</span> torch<br />
                  <span className="text-emerald-700">from</span> neuralbrief.frontier <span className="text-emerald-700">import</span> load_optimized_engine<br />
                  <br />
                  <span className="text-text-muted"># Load quantized model weights</span><br />
                  engine = load_optimized_engine(<span className="text-rose-700">"llama-3-8b-fp8"</span>, device=<span className="text-rose-700">"cuda"</span>)<br />
                  <br />
                  <span className="text-text-muted"># Compile the logic execution graph</span><br />
                  compiled_pipeline = engine.compile(precision=<span className="text-rose-700">"fp8"</span>, mode=<span className="text-rose-700">"max-autotune"</span>)<br />
                  output = compiled_pipeline.generate(<span className="text-rose-700">"Synthesize research context..."</span>)
                </div>

                <h3 className="font-heading text-2xl text-text-main italic pt-4">Consensus Assessment</h3>
                <p>
                  The performance gains demonstrate that local, open-weights architecture has matured to a level where it can replace cloud-hosted models for specific vector evaluations, minimizing external hosting costs and removing data privacy leaks.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default Preview;
