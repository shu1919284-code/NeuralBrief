import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, Globe, Search, X, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ProfileModal } from './ProfileModal';

// Sections tracked for active-link scroll-spy
const NAV_SECTIONS = [
  { id: 'topics',  href: '#topics'  },
  { id: 'process', href: '#process' },
  { id: 'preview', href: '#preview' },
];

export function Navbar() {
  const [isDark, setIsDark] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, signInWithGoogle, signOut, authError, clearAuthError } = useAuth();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Auth error auto-dismiss ───────────────────────────────────────────────
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => clearAuthError(), 6000);
      return () => clearTimeout(timer);
    }
  }, [authError]);

  // ── Focus search input when overlay opens ─────────────────────────────────
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // ── Profile modal event bridge ────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setShowProfile(true);
    window.addEventListener('openProfile', handler);
    return () => window.removeEventListener('openProfile', handler);
  }, []);

  // ── Theme init from localStorage ──────────────────────────────────────────
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // ── Active section scroll-spy (IntersectionObserver) ──────────────────────
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
    { code: 'fr', label: 'FR' },
    { code: 'hi', label: 'HI' },
    { code: 'zh', label: 'ZH' },
    { code: 'ko', label: 'KO' }
  ] as const;

  // ── Search: wire to section navigation + domain filtering ─────────────────
  const performSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return;

    // Section keyword map
    const sectionMap: Record<string, string> = {
      domains:   'topics',
      topics:    'topics',
      focus:     'topics',
      pipeline:  'process',
      engine:    'process',
      process:   'process',
      preview:   'preview',
      digest:    'preview',
      briefing:  'preview',
      faq:       'faq',
      subscribe: 'cta',
      cta:       'cta',
    };

    const matchedSectionKey = Object.keys(sectionMap).find(k => query.includes(k));
    if (matchedSectionKey) {
      const sectionId = sectionMap[matchedSectionKey];
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Pulse the section heading
        const heading = el.querySelector('h2');
        if (heading) {
          heading.classList.add('search-pulse');
          setTimeout(() => heading.classList.remove('search-pulse'), 900);
        }
      }
      setShowSearch(false);
      setSearchQuery('');
      return;
    }

    // Domain card filtering — highlight matching cards
    const domainKeywords: Record<string, string> = {
      'data science': 'data-science',
      'data':         'data-science',
      'machine learning': 'machine-learning',
      'ml':           'machine-learning',
      'ai research':  'ai-research',
      'research':     'ai-research',
      'agentic':      'agentic-frameworks',
      'agents':       'agentic-frameworks',
    };

    const matchedDomain = Object.keys(domainKeywords).find(k => query.includes(k));
    if (matchedDomain) {
      const topicsEl = document.getElementById('topics');
      if (topicsEl) {
        topicsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setShowSearch(false);
      setSearchQuery('');
      return;
    }

    // Fallback: text-content search across headings/paragraphs
    const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, p'));
    const match = elements.find(el => el.textContent?.toLowerCase().includes(query));
    if (match) {
      match.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setShowSearch(false);
    } else {
      // Shake the input to signal no match
      if (searchInputRef.current) {
        searchInputRef.current.animate([
          { transform: 'translateX(0)' },
          { transform: 'translateX(-6px)' },
          { transform: 'translateX(6px)' },
          { transform: 'translateX(-6px)' },
          { transform: 'translateX(0)' }
        ], { duration: 350 });
      }
    }
  }, [searchQuery]);

  return (
    <>
      {/* Auth error toast */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-surface border border-red-500/30 text-red-500 px-4 py-3 shadow-xl rounded flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold font-sans"
          >
            <span>{authError}</span>
            <button onClick={clearAuthError} className="hover:text-text-main cursor-pointer ml-2">
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.nav
        initial={{ y: '-100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="fixed w-full top-0 z-50 px-6 md:px-16 py-6 flex justify-between items-center bg-surface/80 backdrop-blur-xl border-b border-border-subtle"
      >
        {/* ── Logo — clicking refreshes the page ─────────────────────────── */}
        <a
          href="/"
          aria-label="NeuralBrief — Go to homepage"
          className="font-heading font-bold text-2xl italic tracking-tighter text-text-main hover:opacity-70 transition-opacity active:scale-95 inline-block"
        >
          NeuralBrief
        </a>

        {/* ── Desktop nav links ───────────────────────────────────────────── */}
        <ul className="hidden md:flex gap-8 lg:gap-10 items-center">
          {/* Section links with active underline */}
          {[
            { href: '#topics',  label: t('nav_domains') },
            { href: '#process', label: t('nav_engine') },
            { href: '#preview', label: t('nav_digest') },
          ].map(({ href, label }) => {
            const sectionId = href.replace('#', '');
            const isActive = activeSection === sectionId;
            return (
              <li key={href}>
                <a
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`relative text-[11px] uppercase tracking-widest font-bold transition-all inline-block pb-0.5
                    ${isActive ? 'text-text-main nav-link-active' : 'text-text-muted hover:text-text-main'}
                  `}
                >
                  {label}
                  {/* Active underline */}
                  <span
                    className="absolute bottom-0 left-0 h-[1.5px] bg-text-main transition-all duration-300 ease-out"
                    style={{ width: isActive ? '100%' : '0%' }}
                  />
                </a>
              </li>
            );
          })}

          {/* Language picker */}
          <li className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-text-muted hover:text-text-main active:scale-95 transition-all focus:outline-none cursor-pointer"
            >
              <Globe size={14} />
              <span className="uppercase">{language}</span>
            </button>

            {showLangMenu && (
              <div className="absolute top-full text-text-main right-0 mt-2 bg-surface border border-border-subtle rounded shadow-xl py-1 min-w-[80px]">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`block cursor-pointer w-full text-left px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-surface-dim active:bg-surface transition-colors ${language === lang.code ? 'text-primary' : 'text-text-main'}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </li>

          {/* Search */}
          <li>
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center justify-center w-8 h-8 text-text-muted hover:text-text-main active:scale-90 transition-all focus:outline-none cursor-pointer"
              aria-label="Search"
            >
              <Search size={16} />
            </button>
          </li>

          {/* User / Auth */}
          <li>
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowProfile(true)}
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-border-subtle overflow-hidden hover:opacity-80 active:scale-90 transition-all focus:outline-none cursor-pointer"
                  title="Profile"
                  aria-label="Profile"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon size={14} className="text-text-muted" />
                  )}
                </button>
                <button
                  onClick={signOut}
                  className="flex items-center justify-center w-8 h-8 text-text-muted hover:text-text-main active:scale-90 transition-all focus:outline-none cursor-pointer"
                  title="Log Out"
                  aria-label="Log Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center justify-center w-8 h-8 text-text-muted hover:text-text-main active:scale-90 transition-all focus:outline-none cursor-pointer"
                title="Log In"
                aria-label="Log In"
              >
                <LogIn size={16} />
              </button>
            )}
          </li>

          {/* Theme toggle */}
          <li>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-border-subtle text-text-main hover:bg-text-main hover:text-surface active:scale-90 transition-all focus:outline-none cursor-pointer"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </li>
        </ul>
      </motion.nav>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />

      {/* ── Search overlay ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-surface/95 backdrop-blur-lg flex items-center justify-center p-6"
          >
            <button
              onClick={() => setShowSearch(false)}
              className="absolute top-8 right-8 text-text-muted hover:text-text-main transition-colors cursor-pointer"
            >
              <X size={32} strokeWidth={1} />
            </button>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="w-full max-w-3xl"
            >
              <form onSubmit={performSearch} className="relative">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-text-muted w-8 h-8" strokeWidth={1.5} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="w-full bg-surface-dim border border-border-subtle rounded-full py-8 pl-24 pr-8 text-3xl font-heading italic focus:outline-none focus:border-text-main/30 text-text-main placeholder-text-muted/40 transition-colors"
                />
              </form>
              <div className="mt-8 text-center text-text-muted text-[10px] uppercase tracking-widest font-bold">
                Try: "domains", "pipeline", "preview", "faq", "data science", "agentic"
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
