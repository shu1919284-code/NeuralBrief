import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, Bot, BrainCircuit, Cpu } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { BookmarkButton } from './BookmarkButton';

export function FocusDomains() {
  const { t } = useLanguage();

  const cards = [
    {
      icon: <BarChart3 className="w-6 h-6 text-text-main mb-6" strokeWidth={1} />,
      title: "Data Science",
      desc: "Statistical frameworks, optimization vectors, and clean visualization architecture.",
      source: "ArXiv STAT.AP",
      time: "2h ago"
    },
    {
      icon: <Bot className="w-6 h-6 text-text-main mb-6" strokeWidth={1} />,
      title: "Machine Learning",
      desc: "Weights, model training pipelines, MLOps orchestration, and edge deployment strategy.",
      source: "GH: Awesome-MLOps",
      time: "45m ago"
    },
    {
      icon: <BrainCircuit className="w-6 h-6 text-text-main mb-6" strokeWidth={1} />,
      title: "AI Research",
      desc: "Daily ArXiv analysis, breakdowns of foundational breakthroughs, and algorithmic updates.",
      source: "ArXiv CS.LG",
      time: "12m ago"
    },
    {
      icon: <Cpu className="w-6 h-6 text-text-main mb-6" strokeWidth={1} />,
      title: "Agentic Frameworks",
      desc: "Multi-agent graphs, autonomous memory layers, and stateful routing architectures.",
      source: "LangChain / CrewAI",
      time: "1h ago"
    }
  ];

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
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
            whileTap={{ scale: 0.96 }}
            className="relative"
          >
            <BookmarkButton sectionId={card.title} />
            <div className="bg-transparent border border-border-subtle p-10 h-full hover:border-[#1A1A1A] active:bg-surface-dim transition-colors duration-300 group cursor-pointer">
              {card.icon}
              <h3 className="font-heading text-2xl mb-4 group-hover:italic transition-all">{card.title}</h3>
              <p className="text-text-muted text-sm mb-8">{card.desc}</p>
              
              <div className="border-t border-border-subtle pt-6 text-[10px] space-y-2 text-text-muted uppercase tracking-widest flex flex-col font-mono">
                <div className="flex justify-between items-center">
                  <span>Source</span>
                  <span className="text-text-main">{card.source}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Last Sync</span>
                  <span className="text-text-main flex items-center pr-1">{card.time}</span>
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
