import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FAQPageProps {
  onBack: () => void;
}

export function FAQPage({ onBack }: FAQPageProps) {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Re-map the full list of 14 questions
  const faqs = Array.from({ length: 14 }).map((_, i) => ({
    question: t(`faq.q${i + 1}`),
    answer: t(`faq.a${i + 1}`),
  })).filter(faq => faq.question && faq.question !== `faq.q${faqs ? faqs.length + 1 : 0}`); // simple filter if key doesn't exist

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[100] bg-background overflow-y-auto"
    >
      <div className="min-h-screen py-24 px-6 md:px-16 max-w-4xl mx-auto relative">
        <button
          onClick={onBack}
          className="absolute top-8 left-6 md:left-16 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-accent transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          {t('faq_back_home') || 'Back to Dashboard'}
        </button>

        <div className="text-center mb-20 mt-16">
          <span className="text-[10px] uppercase tracking-widest text-text-muted mb-4 block font-bold">
            {t('faq_subpage_title') || 'Knowledge Base'}
          </span>
          <h1 className="text-4xl md:text-6xl font-heading mb-6">
            Frequently Asked <span className="italic">Questions</span>
          </h1>
          <p className="text-sm md:text-base text-text-muted max-w-2xl mx-auto leading-relaxed">
            {t('faq_subpage_desc') || 'Detailed technical answers on how our autonomous pipeline operates, data privacy, and customization.'}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            if (!faq.question || faq.question === `faq.q${index + 1}`) return null;
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="border-b border-border-subtle"
              >
                <button
                  onClick={() => toggleOpen(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-page-${index}`}
                  id={`faq-question-page-${index}`}
                  className="w-full py-6 flex justify-between items-center text-left focus:outline-none cursor-pointer group"
                >
                  <span
                    className={`font-heading text-lg md:text-2xl inline-block group-hover:italic transition-transform duration-200 ease-out${
                      !isOpen ? ' group-hover:translate-x-1' : ''
                    }`}
                  >
                    {faq.question}
                  </span>

                  <span
                    className="text-text-muted ml-4 inline-flex flex-shrink-0"
                    style={{
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                </button>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows 350ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <p
                      id={`faq-answer-page-${index}`}
                      role="region"
                      aria-labelledby={`faq-question-page-${index}`}
                      className="pb-6 text-sm text-text-muted max-w-3xl leading-relaxed"
                      style={{
                        opacity: isOpen ? 1 : 0,
                        transition: isOpen
                          ? 'opacity 200ms ease 100ms'
                          : 'opacity 100ms ease 0ms',
                      }}
                    >
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
