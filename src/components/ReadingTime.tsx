import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';

export function ReadingTime() {
  const [readingTime, setReadingTime] = useState(0);
  const { t } = useLanguage();
  
  useEffect(() => {
    // Estimate reading time based on word count of the main content
    const calculateReadingTime = () => {
      const text = document.body.innerText;
      const wpm = 225;
      const words = text.trim().split(/\s+/).length;
      const time = Math.ceil(words / wpm);
      setReadingTime(time);
    };

    calculateReadingTime();
    
    // Recalculate if language changes since text length changes
    const observer = new MutationObserver(calculateReadingTime);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    
    return () => observer.disconnect();
  }, []);

  if (readingTime === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      className="max-w-6xl mx-auto px-6 md:px-16 pt-32 w-full flex justify-end"
    >
      <div className="text-[10px] uppercase tracking-widest font-mono text-text-muted font-bold border-b border-border-subtle pb-1">
        ~{readingTime} {t('reading_time')}
      </div>
    </motion.div>
  );
}
