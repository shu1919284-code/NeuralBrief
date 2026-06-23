import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

export function FAQ() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
    { question: t('faq.q5'), answer: t('faq.a5') },
    { question: t('faq.q6'), answer: t('faq.a6') },
    { question: t('faq.q7'), answer: t('faq.a7') },
  ];

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 px-6 md:px-16 max-w-4xl mx-auto" id="faq">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16"
      >
        <span className="text-[10px] uppercase tracking-widest text-text-muted mb-4 block font-bold">
          {t('faq_overline')}
        </span>
        <h2 className="text-4xl md:text-5xl font-heading mb-8">
          {t('faq_title_1')} <span className="italic">{t('faq_title_2')}</span>
        </h2>
      </motion.div>

      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="border-b border-border-subtle"
            >
              <button
                onClick={() => toggleOpen(index)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
                id={`faq-question-${index}`}
                className="w-full py-6 flex justify-between items-center text-left focus:outline-none cursor-pointer group"
              >
                <span
                  className={`font-heading text-xl md:text-2xl inline-block group-hover:italic transition-transform duration-200 ease-out${
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
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    className="pb-6 text-sm text-text-muted max-w-2xl leading-relaxed"
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
    </section>
  );
}