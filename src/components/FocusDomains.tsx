import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, Bot, BrainCircuit, Cpu } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { BookmarkButton } from './BookmarkButton';

const getDomainIcon = (id: string) => {
  switch (id) {
    case 'data-science':
      return <BarChart3 className="w-6 h-6 text-text-main mb-6" strokeWidth={1} />;
    case 'machine-learning':
      return <Bot className="w-6 h-6 text-text-main mb-6" strokeWidth={1} />;
    case 'ai-research':
      return <BrainCircuit className="w-6 h-6 text-text-main mb-6" strokeWidth={1} />;
    case 'agentic-frameworks':
      return <Cpu className="w-6 h-6 text-text-main mb-6" strokeWidth={1} />;
    default:
      return <BrainCircuit className="w-6 h-6 text-text-main mb-6" strokeWidth={1} />;
  }
};

export function FocusDomains({
  domains,
  loading,
  error,
  onSelectDomain
}: {
  domains: any[];
  loading: boolean;
  error: string | null;
  onSelectDomain: (id: string) => void;
}) {
  const { t } = useLanguage();

  const staticFallbacks = [
    {
      id: "data-science",
      title: "Data Science",
      summary: "Statistical frameworks, optimization vectors, and clean visualization architecture.",
      source: "ArXiv STAT.AP",
      time: "Weekly Sync"
    },
    {
      id: "machine-learning",
      title: "Machine Learning",
      summary: "Weights, model training pipelines, MLOps orchestration, and edge deployment strategy.",
      source: "GH: Awesome-MLOps",
      time: "Weekly Sync"
    },
    {
      id: "ai-research",
      title: "AI Research",
      summary: "Daily ArXiv analysis, breakthroughs of foundational breakthroughs, and algorithmic updates.",
      source: "ArXiv CS.LG",
      time: "Weekly Sync"
    },
    {
      id: "agentic-frameworks",
      title: "Agentic Frameworks",
      summary: "Multi-agent graphs, autonomous memory layers, and stateful routing architectures.",
      source: "LangChain / CrewAI",
      time: "Weekly Sync"
    }
  ];

  const cardsToRender = domains && domains.length > 0 ? domains : staticFallbacks;

  if (loading) {
    return (
      <section className="py-32 px-6 md:px-16 max-w-7xl mx-auto" id="topics">
        <div className="text-center mb-20">
          <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-4 block font-bold">{t('focus_overline')}</span>
          <h2 className="font-heading text-5xl mb-6">{t('focus_title_1')} <span className="italic">{t('focus_title_2')}</span></h2>
          <p className="text-text-muted max-w-xl mx-auto text-sm leading-relaxed">{t('focus_desc')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-dim/40 border border-border-subtle p-10 h-[380px] animate-pulse flex flex-col justify-between">
              <div>
                <div className="w-6 h-6 bg-text-muted/15 rounded mb-6" />
                <div className="h-6 bg-text-muted/15 rounded w-2/3 mb-4" />
                <div className="space-y-2 mb-8">
                  <div className="h-3 bg-text-muted/10 rounded w-full" />
                  <div className="h-3 bg-text-muted/10 rounded w-5/6" />
                </div>
              </div>
              <div className="border-t border-border-subtle pt-6 space-y-2">
                <div className="flex justify-between">
                  <div className="h-2 bg-text-muted/10 rounded w-1/4" />
                  <div className="h-2 bg-text-muted/10 rounded w-1/3" />
                </div>
                <div className="flex justify-between">
                  <div className="h-2 bg-text-muted/10 rounded w-1/4" />
                  <div className="h-2 bg-text-muted/10 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-32 px-6 md:px-16 max-w-7xl mx-auto" id="topics">
      <motion.div 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-20"
      >
        <span className="text-[10px] text-text-muted uppercase tracking-[0.2em] mb-4 block font-bold">{t('focus_overline')}</span>
        <h2 className="font-heading text-5xl mb-6">{t('focus_title_1')} <span className="italic">{t('focus_title_2')}</span></h2>
        <p className="text-text-muted max-w-xl mx-auto text-sm leading-relaxed">{t('focus_desc')}</p>
        {error && (
          <p className="text-rose-500 text-xs mt-4 uppercase tracking-widest font-mono">Failed to fetch live feed. Showing static signals.</p>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardsToRender.map((card, i) => (
          <motion.div
            key={card.id || i}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
            whileTap={{ scale: 0.96 }}
            className="relative h-full flex"
            onClick={() => onSelectDomain(card.id)}
          >
            <BookmarkButton sectionId={card.title} />
            <div className="bg-transparent border border-border-subtle p-10 h-full hover:border-[#1A1A1A] active:bg-surface-dim transition-colors duration-300 group cursor-pointer flex flex-col justify-between w-full">
              <div>
                {getDomainIcon(card.id)}
                <h3 className="font-heading text-2xl mb-4 group-hover:italic transition-all">{card.title}</h3>
                <p className="text-text-muted text-sm mb-8">{card.summary}</p>
              </div>
              
              <div>
                <div className="border-t border-border-subtle pt-6 text-[10px] space-y-2 text-text-muted uppercase tracking-widest flex flex-col font-mono">
                  <div className="flex justify-between items-center">
                    <span>Source</span>
                    <span className="text-text-main">{card.source}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Last Sync</span>
                    <span className="text-text-main flex items-center pr-1">{card.time || 'Weekly'}</span>
                  </div>
                </div>
                <div className="mt-4 text-[10px] uppercase font-bold tracking-widest text-right italic opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 text-text-main">
                  Read Report →
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default FocusDomains;
