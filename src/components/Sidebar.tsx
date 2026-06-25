import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, ChevronRight, Terminal, Cpu, Database, Brain, Globe, FileText, HelpCircle, Activity, Info, Sun, Moon, User as UserIcon, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SIDEBAR_LINKS = [
  { group: 'Core Navigation', links: [
    { type: 'scroll', target: 'root', label: 'Home', icon: Globe },
    { type: 'scroll', target: 'engine', label: 'Neural Engine', icon: Cpu },
    { type: 'scroll', target: 'how-it-works', label: 'How We Work', icon: FileText },
    { type: 'scroll', target: 'personalization', label: 'Build Your AI Briefing', icon: Terminal },
    { type: 'scroll', target: 'signal-dashboard', label: 'AI Signal Dashboard', icon: Activity },
    { type: 'scroll', target: 'preview', label: 'Curated Signals, Zero Noise', icon: Activity },
    { type: 'scroll', target: 'raw-news-feed', label: 'Explore Raw Developments', icon: Database },
    { type: 'scroll', target: 'pipeline-3d', label: 'End-to-End Execution Pipeline', icon: Terminal },
  ]},
  { group: 'Focus Domains', links: [
    { type: 'event', target: 'data-science', label: 'Data Science', icon: Database },
    { type: 'event', target: 'machine-learning', label: 'Machine Learning', icon: Brain },
    { type: 'event', target: 'ai-research', label: 'AI Research', icon: FileText },
    { type: 'event', target: 'agentic-frameworks', label: 'Agentic Frameworks', icon: Terminal },
    { type: 'event', target: 'mlops', label: 'MLOps & Infra', icon: Cpu },
    { type: 'event', target: 'model-releases', label: 'Model Releases', icon: Globe },
    { type: 'event', target: 'ai-industry', label: 'AI in Industry', icon: Activity },
    { type: 'event', target: 'tools-libraries', label: 'Tools & Libraries', icon: Terminal },
  ]},
  { group: 'Support', links: [
    { type: 'scroll', target: 'faq', label: 'FAQ', icon: HelpCircle },
    { type: 'scroll', target: 'cta', label: 'Subscribe', icon: Globe },
  ]}
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, signInWithGoogle, signOut } = useAuth();
  const { mode, setMode } = useTheme();

  const handleNav = (link: { type: string, target: string }) => {
    onClose();
    setTimeout(() => {
      if (link.type === 'scroll') {
        if (link.target === 'root') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const el = document.getElementById(link.target);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else if (link.type === 'event') {
        window.dispatchEvent(new CustomEvent('openBriefing', { detail: link.target }));
      }
    }, 300);
  };

  const openCommandPalette = () => {
    onClose();
    // Simulate Ctrl+K press
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      metaKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[150] bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 h-full w-full max-w-sm z-[200] bg-surface/95 backdrop-blur-2xl border-r border-border-subtle flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-border-subtle">
              <div className="font-heading text-xl italic tracking-tighter text-text-main">
                NeuralBrief
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-dim transition-colors text-text-muted hover:text-text-main cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-hide space-y-8">
              {SIDEBAR_LINKS.map((group, idx) => (
                <div key={idx} className="space-y-3">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-text-muted px-2">
                    {group.group}
                  </h3>
                  <div className="space-y-1">
                    {group.links.map((link, lIdx) => (
                      <button
                        key={lIdx}
                        onClick={() => handleNav(link)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded hover:bg-surface-dim transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <link.icon size={14} className="text-text-muted group-hover:text-primary transition-colors" />
                          <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">
                            {link.label}
                          </span>
                        </div>
                        <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer / Shortcuts */}
            <div className="border-t border-border-subtle p-4 bg-surface-dim/30 space-y-1.5 overflow-y-auto">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-text-muted">Global Commands</span>
                <div className="relative group/tooltip">
                  <div className="w-5 h-5 rounded-full border border-border-subtle flex items-center justify-center text-text-muted hover:text-primary hover:border-primary transition-colors cursor-help">
                    <Info size={10} />
                  </div>
                  <div className="absolute bottom-full right-0 mb-3 w-56 p-3 rounded bg-surface border border-border-subtle shadow-xl opacity-0 translate-y-2 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 transition-all duration-200 z-10">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">Keyboard Shortcuts</p>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Press these hotkeys from anywhere in the application to instantly trigger actions, open menus, or change system settings.
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={openCommandPalette}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-surface transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded border border-border-subtle bg-surface flex items-center justify-center text-text-muted shadow-sm group-hover:text-primary transition-colors">
                    <Search size={12} />
                  </div>
                  <div className="text-xs font-bold text-text-main group-hover:text-primary transition-colors">Search / Jump</div>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-sans font-bold text-text-muted">Ctrl</kbd>
                  <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-sans font-bold text-text-muted">K</kbd>
                </div>
              </button>

              <button 
                onClick={() => { setMode(mode === 'dark' ? 'light' : 'dark'); onClose(); }}
                className="w-full flex items-center justify-between p-2 rounded hover:bg-surface transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded border border-border-subtle bg-surface flex items-center justify-center text-text-muted shadow-sm group-hover:text-primary transition-colors">
                    {mode === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
                  </div>
                  <div className="text-xs font-bold text-text-main group-hover:text-primary transition-colors">Toggle Theme</div>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-sans font-bold text-text-muted">Ctrl</kbd>
                  <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-sans font-bold text-text-muted">Shift</kbd>
                  <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-sans font-bold text-text-muted">T</kbd>
                </div>
              </button>

              {user ? (
                <>
                  <button 
                    onClick={() => { window.dispatchEvent(new Event('openProfile')); onClose(); }}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-surface transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded border border-border-subtle bg-surface flex items-center justify-center text-text-muted shadow-sm group-hover:text-primary transition-colors">
                        <UserIcon size={12} />
                      </div>
                      <div className="text-xs font-bold text-text-main group-hover:text-primary transition-colors">Profile</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-sans font-bold text-text-muted">Ctrl</kbd>
                      <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-sans font-bold text-text-muted">Shift</kbd>
                      <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-sans font-bold text-text-muted">P</kbd>
                    </div>
                  </button>
                  <button 
                    onClick={() => { signOut(); onClose(); }}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-surface transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded border border-border-subtle bg-surface flex items-center justify-center text-text-muted shadow-sm group-hover:text-primary transition-colors">
                        <LogOut size={12} />
                      </div>
                      <div className="text-xs font-bold text-text-main group-hover:text-primary transition-colors">Log Out</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-sans font-bold text-text-muted">Ctrl</kbd>
                      <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-sans font-bold text-text-muted">Shift</kbd>
                      <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-sans font-bold text-text-muted">L</kbd>
                    </div>
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { signInWithGoogle(); onClose(); }}
                  className="w-full flex items-center justify-between p-2 rounded hover:bg-surface transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded border border-border-subtle bg-surface flex items-center justify-center text-text-muted shadow-sm group-hover:text-primary transition-colors">
                      <LogIn size={12} />
                    </div>
                    <div className="text-xs font-bold text-text-main group-hover:text-primary transition-colors">Log In</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-sans font-bold text-text-muted">Ctrl</kbd>
                    <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-sans font-bold text-text-muted">Shift</kbd>
                    <kbd className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface text-[9px] font-sans font-bold text-text-muted">L</kbd>
                  </div>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
