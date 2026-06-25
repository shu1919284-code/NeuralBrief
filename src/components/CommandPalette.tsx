import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight, Terminal, Cpu, Database, Brain, Globe, FileText, HelpCircle, Activity, Sun, Moon, User as UserIcon, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type CommandItem = {
  id: string;
  label: string;
  icon: any;
  keywords: string[];
  type: 'scroll' | 'event' | 'action';
  target?: string;
  action?: () => void;
};

const COMMANDS: CommandItem[] = [
  { id: 'engine', label: 'Neural Engine', icon: Cpu, keywords: ['engine', 'pipeline', 'process', 'architecture'], type: 'scroll', target: 'engine' },
  { id: 'how-it-works', label: 'How We Work', icon: FileText, keywords: ['how', 'work', 'method', 'scraper'], type: 'scroll', target: 'how-it-works' },
  { id: 'personalization', label: 'Build Your AI Briefing', icon: Terminal, keywords: ['build', 'personalize', 'custom'], type: 'scroll', target: 'personalization' },
  { id: 'signal-dashboard', label: 'AI Signal Dashboard', icon: Activity, keywords: ['dashboard', 'signal', 'stats', 'analytics'], type: 'scroll', target: 'signal-dashboard' },
  { id: 'preview', label: 'Curated Signals, Zero Noise', icon: Activity, keywords: ['live', 'signal', 'preview', 'digest', 'feed', 'curated'], type: 'scroll', target: 'preview' },
  { id: 'raw-news-feed', label: 'Explore Raw Developments', icon: Database, keywords: ['raw', 'news', 'feed', 'developments'], type: 'scroll', target: 'raw-news-feed' },
  { id: 'pipeline-3d', label: 'End-to-End Execution Pipeline', icon: Terminal, keywords: ['end', 'execution', 'pipeline', '3d'], type: 'scroll', target: 'pipeline-3d' },
  { id: 'data-science', label: 'Data Science', icon: Database, keywords: ['data', 'science', 'domain', 'topics'], type: 'event', target: 'data-science' },
  { id: 'machine-learning', label: 'Machine Learning', icon: Brain, keywords: ['ml', 'machine', 'learning', 'model', 'domain'], type: 'event', target: 'machine-learning' },
  { id: 'ai-research', label: 'AI Research', icon: FileText, keywords: ['ai', 'research', 'paper', 'domain'], type: 'event', target: 'ai-research' },
  { id: 'agentic-frameworks', label: 'Agentic Frameworks', icon: Terminal, keywords: ['agent', 'framework', 'scraping', 'domain'], type: 'event', target: 'agentic-frameworks' },
  { id: 'mlops', label: 'MLOps & Infra', icon: Cpu, keywords: ['mlops', 'infrastructure', 'devops', 'domain'], type: 'event', target: 'mlops' },
  { id: 'model-releases', label: 'Model Releases', icon: Globe, keywords: ['model', 'release', 'llm', 'domain'], type: 'event', target: 'model-releases' },
  { id: 'ai-industry', label: 'AI in Industry', icon: Activity, keywords: ['industry', 'business', 'domain'], type: 'event', target: 'ai-industry' },
  { id: 'tools-libraries', label: 'Tools & Libraries', icon: Terminal, keywords: ['tools', 'libraries', 'code', 'domain'], type: 'event', target: 'tools-libraries' },
  { id: 'faq', label: 'FAQ & Support', icon: HelpCircle, keywords: ['faq', 'help', 'support', 'question'], type: 'scroll', target: 'faq' },
  { id: 'cta', label: 'Subscribe', icon: Globe, keywords: ['subscribe', 'newsletter', 'join', 'cta'], type: 'scroll', target: 'cta' },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, signInWithGoogle, signOut } = useAuth();
  const { mode, setMode } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setMode(mode === 'dark' ? 'light' : 'dark');
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        if (user) signOut();
        else signInWithGoogle();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (user) window.dispatchEvent(new Event('openProfile'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = (cmd: CommandItem) => {
    setIsOpen(false);
    if (cmd.type === 'scroll' && cmd.target) {
      const el = document.getElementById(cmd.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const heading = el.querySelector('h2');
        if (heading) {
          heading.classList.add('search-pulse');
          setTimeout(() => heading.classList.remove('search-pulse'), 900);
        }
      }
    } else if (cmd.type === 'event' && cmd.target) {
      window.dispatchEvent(new CustomEvent('openBriefing', { detail: cmd.target }));
    } else if (cmd.type === 'action' && cmd.action) {
      cmd.action();
    }
  };

  // Dynamically generate action commands based on state
  const actionCommands: CommandItem[] = [
    {
      id: 'theme-toggle',
      label: `Switch to ${mode === 'dark' ? 'Light' : 'Dark'} Mode`,
      icon: mode === 'dark' ? Sun : Moon,
      keywords: ['theme', 'dark', 'light', 'mode', 'switch', 'color'],
      type: 'action',
      action: () => setMode(mode === 'dark' ? 'light' : 'dark')
    }
  ];

  if (user) {
    actionCommands.push({
      id: 'profile',
      label: 'Open Profile / Bookmarks',
      icon: UserIcon,
      keywords: ['profile', 'account', 'user', 'bookmarks', 'saved'],
      type: 'action',
      action: () => window.dispatchEvent(new Event('openProfile'))
    });
    actionCommands.push({
      id: 'logout',
      label: 'Log Out',
      icon: LogOut,
      keywords: ['log out', 'logout', 'sign out'],
      type: 'action',
      action: () => signOut()
    });
  } else {
    actionCommands.push({
      id: 'login',
      label: 'Log In / Sign Up',
      icon: LogIn,
      keywords: ['login', 'log in', 'sign up', 'register', 'auth'],
      type: 'action',
      action: () => signInWithGoogle()
    });
  }

  const allCommands = [...COMMANDS, ...actionCommands];

  const filteredSections = allCommands.filter(cmd => {
    const q = query.toLowerCase();
    return cmd.label.toLowerCase().includes(q) || cmd.keywords.some(k => k.includes(q));
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center px-4 border-b border-border-subtle">
              <Search size={20} className="text-text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="w-full bg-transparent border-none outline-none px-4 py-4 text-text-main placeholder-text-muted/50 font-sans"
              />
              <div className="text-[10px] text-text-muted border border-border-subtle px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">
                ESC
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
              {filteredSections.length === 0 ? (
                <div className="py-8 text-center text-text-muted text-sm italic">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredSections.map((section, idx) => (
                    <button
                      key={`${section.id}-${idx}`}
                      onClick={() => handleSelect(section)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-surface-dim active:scale-[0.98] transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface border border-border-subtle flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                          <section.icon size={14} />
                        </div>
                        <span className="text-sm font-bold tracking-wide text-text-main group-hover:text-primary transition-colors">
                          {section.label}
                        </span>
                      </div>
                      <ChevronRight size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-surface-dim border-t border-border-subtle px-4 py-3 flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-text-muted">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface font-sans">↑↓</kbd> to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface font-sans">↵</kbd> to select
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-primary/70">
                <Terminal size={12} />
                Neural Command
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
