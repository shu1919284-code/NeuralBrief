import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

const DOMAINS = [
  { id: 'data-science', title: 'Data Science' },
  { id: 'machine-learning', title: 'Machine Learning' },
  { id: 'ai-research', title: 'AI Research' },
  { id: 'agentic-frameworks', title: 'Agentic Frameworks' },
  { id: 'mlops', title: 'MLOps' },
  { id: 'model-releases', title: 'Model Releases' },
  { id: 'ai-industry', title: 'AI Industry' },
  { id: 'tools-libraries', title: 'Tools & Libraries' },
];

const getApiUrl = (path: string) => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? `http://localhost:3001${path}` : `https://neuralbrief-production.up.railway.app${path}`;
};

function ScraperVisualizer() {
  const messages = [
    'Establishing secure connection...',
    'Locating target DOM nodes...',
    'Extracting raw signals...',
    'Parsing OpenGraph metadata...',
    'Bypassing basic rate limits...',
    'Aggregating final data...',
  ];
  
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='flex flex-col items-center justify-center h-64 border border-border-subtle p-8 bg-surface-dim/20 relative overflow-hidden'>
      {/* Scanning laser effect */}
      <motion.div 
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className='absolute left-0 right-0 h-1 bg-text-main/20 blur-[2px]'
      />
      
      {/* Central icon */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className='w-12 h-12 border border-text-main/40 rounded-full flex items-center justify-center mb-6'
      >
        <div className='w-2 h-2 bg-text-main rounded-full'></div>
      </motion.div>

      {/* Dynamic text */}
      <div className='h-6 overflow-hidden'>
        <AnimatePresence mode="wait">
          <motion.div
            key={msgIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className='font-mono text-xs uppercase tracking-[0.2em] text-text-main font-bold'
          >
            {messages[msgIndex]}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className='mt-4 flex gap-1'>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`dot-${i}`}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            className='w-1 h-1 bg-text-main rounded-full'
          />
        ))}
      </div>
    </div>
  );
}

export function RawNewsFeed() {
  const { t } = useLanguage();
  const [activeDomain, setActiveDomain] = useState(DOMAINS[0].id);
  const [activeTab, setActiveTab] = useState<'latest' | 'popular'>('latest');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(getApiUrl(`/api/briefing/raw-news?domainId=${activeDomain}`))
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch raw news feed');
        return res.json();
      })
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [activeDomain]);

  const displayedItems = items.filter(item => item.fetchType === activeTab);

  return (
    <section className='py-32 px-6 md:px-16 max-w-7xl mx-auto' id='raw-news-feed'>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className='text-center mb-16'
      >
        <span className='text-[10px] uppercase tracking-widest text-text-muted mb-4 block font-bold'>
          Live Internet Feed
        </span>
        <h2 className='text-4xl md:text-5xl font-heading mb-6'>
          Explore <span className='italic'>Raw Developments</span>
        </h2>
        <p className='text-sm md:text-base text-text-muted max-w-xl mx-auto leading-relaxed'>
          Dive directly into the raw, unfiltered news items fetched in real-time.
        </p>
      </motion.div>

      {/* Domain Selector */}
      <div className='flex flex-wrap justify-center gap-3 mb-10'>
        {DOMAINS.map((domain) => (
          <button
            key={domain.id}
            onClick={() => setActiveDomain(domain.id)}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-widest border transition-all ${
              activeDomain === domain.id
                ? 'border-text-main text-text-main bg-surface-dim'
                : 'border-border-subtle text-text-muted hover:border-text-main/50'
            }`}
          >
            {domain.title}
          </button>
        ))}
      </div>

      {/* Tab Selector */}
      <div className='flex justify-center mb-12'>
        <div className='inline-flex border border-border-subtle p-1'>
          <button
            onClick={() => setActiveTab('latest')}
            className={`px-6 py-2 text-xs uppercase tracking-widest font-bold transition-all ${
              activeTab === 'latest' ? 'bg-text-main text-bg-main' : 'text-text-muted hover:text-text-main'
            }`}
          >
            ⚡ Latest
          </button>
          <button
            onClick={() => setActiveTab('popular')}
            className={`px-6 py-2 text-xs uppercase tracking-widest font-bold transition-all ${
              activeTab === 'popular' ? 'bg-text-main text-bg-main' : 'text-text-muted hover:text-text-main'
            }`}
          >
            🔥 Popular
          </button>
        </div>
      </div>

      {/* Feed Content */}
      <div className='min-h-[400px]'>
        {loading ? (
          <ScraperVisualizer />
        ) : error ? (
          <div className='text-center text-rose-500 font-mono text-sm'>{error}</div>
        ) : displayedItems.length === 0 ? (
          <div className='text-center text-text-muted font-mono text-sm'>
            No {activeTab} articles found for this domain right now.
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <AnimatePresence mode="popLayout">
              {displayedItems.slice(0, 10).map((item, i) => (
                <motion.a
                  key={item.id}
                  href={item.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className='block border border-border-subtle p-6 hover:border-text-main hover:bg-surface-dim/40 transition-all group'
                >
                  <div className='flex justify-between items-start mb-4'>
                    <span className='text-[10px] uppercase tracking-widest text-text-muted font-mono bg-surface-dim px-2 py-1'>
                      {item.source}
                    </span>
                    <span className='text-[10px] text-text-muted font-mono'>
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className='text-lg font-bold mb-3 group-hover:italic transition-all line-clamp-2'>
                    {item.title}
                  </h3>
                  <p className='text-sm text-text-muted line-clamp-3 leading-relaxed'>
                    {item.snippet || 'Click to explore the full text and discussion on the source website.'}
                  </p>
                </motion.a>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
