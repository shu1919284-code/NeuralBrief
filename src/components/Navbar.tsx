import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, Globe, Search, X, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ProfileModal } from './ProfileModal';

// Sections tracked for active-link scroll-spy
const NAV_SECTIONS = [
  { id: 'topics', href: '#topics' },
  { id: 'process', href: '#process' },
  { id: 'preview', href: '#preview' },
];

export function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { user, signInWithGoogle, signOut, authError, clearAuthError } = useAuth();
  const { mode, setMode, theme, setTheme } = useTheme();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Refs for sliding underline ─────────────────────────────────────────────
  const linksGroupRef = useRef<HTMLLIElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [underline, setUnderline] = useState({ left: 0, width: 0, visible: false });

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

  // ── Theme initialization is handled by ThemeContext ──

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

  // ── Sliding underline: measure active link, update state ──────────────────
  const updateUnderline = useCallback(() => {
    const idx = NAV_SECTIONS.findIndex(s => s.id === activeSection);
    if (idx === -1 || !linksGroupRef.current) {
      setUnderline(prev => ({ ...prev, visible: false }));
      return;
    }
    const linkEl = linkRefs.current[idx];
    const groupEl = linksGroupRef.current;
    if (!linkEl || !groupEl) return;

    const linkRect = linkEl.getBoundingClientRect();
    const groupRect = groupEl.getBoundingClientRect();

    setUnderline({
      left: linkRect.left - groupRect.left,
      width: linkRect.width,
      visible: true,
    });
  }, [activeSection]);

  useEffect(() => { updateUnderline(); }, [updateUnderline]);

  useEffect(() => {
    window.addEventListener('resize', updateUnderline);
    return () => window.removeEventListener('resize', updateUnderline);
  }, [updateUnderline]);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'zh', label: '中文' },
    { code: 'ko', label: '한국어' },
    { code: 'hg', label: 'Hinglish' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ja', label: '日本語' },
    { code: 'it', label: 'Italiano' },
    { code: 'pt', label: 'Português' },
    { code: 'ru', label: 'Русский' },
    { code: 'ar', label: 'العربية' },
    { code: 'nl', label: 'Nederlands' },
  ] as const;

  // ── Search: wire to section navigation + domain filtering ─────────────────
  const performSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase().trim();
    if (!query) return;

    const sectionMap: Record<string, string> = {
      domains: 'topics',
      topics: 'topics',
      focus: 'topics',
      pipeline: 'process',
      engine: 'process',
      process: 'process',
      preview: 'preview',
      digest: 'preview',
      briefing: 'preview',
      faq: 'faq',
      subscribe: 'cta',
      cta: 'cta',
    };

    const matchedSectionKey = Object.keys(sectionMap).find(k => query.includes(k));
    if (matchedSectionKey) {
      const sectionId = sectionMap[matchedSectionKey];
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    const domainKeywords: Record<string, string> = {
      'data science': 'data-science',
      'data': 'data-science',
      'machine learning': 'machine-learning',
      'ml': 'machine-learning',
      'ai research': 'ai-research',
      'research': 'ai-research',
      'agentic': 'agentic-frameworks',
      'agents': 'agentic-frameworks',
    };

    const matchedDomain = Object.keys(domainKeywords).find(k => query.includes(k));
    if (matchedDomain) {
      const topicsEl = document.getElementById('topics');
      if (topicsEl) topicsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShowSearch(false);
      setSearchQuery('');
      return;
    }

    const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, p'));
    const match = elements.find(el => el.textContent?.toLowerCase().includes(query));
    if (match) {
      match.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setShowSearch(false);
    } else if (searchInputRef.current) {
      searchInputRef.current.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-6px)' },
          { transform: 'translateX(6px)' },
          { transform: 'translateX(-6px)' },
          { transform: 'translateX(0)' },
        ],
        { duration: 350 },
      );
    }
  }, [searchQuery]);

  const navLinkItems = [
    { href: '#topics', label: t('nav_domains'), id: 'topics' },
    { href: '#process', label: t('nav_engine'), id: 'process' },
    { href: '#preview', label: t('nav_digest'), id: 'preview' },
  ];

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
        {/* ── Logo & Theme Selector ─────────────────────────── */}
        <div className="flex flex-col items-start gap-1">
          <a
            href="/"
            aria-label="NeuralBrief — Go to homepage"
            className="font-heading text-2xl italic tracking-tighter text-text-main hover:opacity-70 transition-opacity active:scale-95 inline-block"
          >
            NeuralBrief
          </a>

          <div className="flex gap-1.5 items-center mt-0.5">
            {[
              { id: 'neural', color: mode === 'dark' ? '#f5f5f5' : '#1a1a1a' },
              { id: 'indigo-intelligence', color: mode === 'dark' ? '#818cf8' : '#4f46e5' },
              { id: 'emerald-analyst', color: mode === 'dark' ? '#34d399' : '#059669' },
              { id: 'crimson-real-time', color: mode === 'dark' ? '#f87171' : '#dc2626' },
              { id: 'amber-insight', color: mode === 'dark' ? '#fbbf24' : '#d97706' },
              { id: 'golden-executive', color: mode === 'dark' ? '#ffd700' : '#b89030' }
            ].map((th) => (
              <button
                key={th.id}
                onClick={() => setTheme(th.id as any)}
                aria-label={`Set theme to ${th.id}`}
                className="p-2 -m-2 cursor-pointer transition-all focus:outline-none"
              >
                <span
                  className={`block w-2.5 h-2.5 rounded-full transition-all ${theme === th.id ? 'scale-125 ring-1 ring-offset-1 ring-offset-surface ring-[var(--color-accent)] shadow-[0_0_8px_var(--color-theme-glow)]' : 'opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: th.color }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* ── Desktop nav ──────────────────────────────────────────────────── */}
        <ul className="hidden md:flex gap-8 lg:gap-10 items-center">

          <li ref={linksGroupRef} className="flex items-center gap-8 lg:gap-10 relative">
            {navLinkItems.map(({ href, id, label }, i) => {
              const isActive = activeSection === id;
              return (
                <a
                  key={href}
                  ref={el => { linkRefs.current[i] = el; }}
                  href={href}
                  onClick={e => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`text-[11px] uppercase tracking-widest font-bold inline-block pb-0.5 text-text-main transition-opacity duration-200${!isActive ? ' opacity-50 hover:opacity-80' : ''
                    }`}
                >
                  {label}
                </a>
              );
            })}

            <div
              aria-hidden="true"
              className="absolute pointer-events-none"
              style={{
                backgroundColor: 'var(--color-accent)',
                bottom: 0,
                left: `${underline.left}px`,
                width: `${underline.width}px`,
                height: '1.5px',
                opacity: underline.visible ? 1 : 0,
                transition: 'left 300ms ease, width 300ms ease, opacity 200ms ease',
              }}
            />
          </li>

          {/* ── Language picker ──────────────────────────────────────────── */}
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
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setShowLangMenu(false); }}
                    className={`block cursor-pointer w-full text-left px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-surface-dim active:bg-surface transition-colors ${language === lang.code ? 'text-primary' : 'text-text-main'
                      }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </li>

          {/* ── Search ───────────────────────────────────────────────────── */}
          <li>
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center justify-center w-8 h-8 text-text-muted hover:text-text-main active:scale-90 transition-all focus:outline-none cursor-pointer"
              aria-label="Search"
            >
              <Search size={16} />
            </button>
          </li>

          {/* ── User / Auth ───────────────────────────────────────────────── */}
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
                    <img
                      src={user.photoURL}
                      alt="User"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
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

          {/* ── Theme toggle ─────────────────────────────────────────────── */}
          <li>
            <button
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-border-subtle text-text-main hover:bg-text-main hover:text-surface active:scale-90 transition-all focus:outline-none cursor-pointer shadow-[0_0_10px_var(--color-theme-glow)]"
              aria-label="Toggle Theme"
            >
              {mode === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </li>
        </ul>
      </motion.nav>

      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />

      {/* ── Search overlay ───────────────────────────────────────────────── */}
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
                <Search
                  className="absolute left-8 top-1/2 -translate-y-1/2 text-text-muted w-8 h-8"
                  strokeWidth={1.5}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="w-full bg-surface-dim border border-border-subtle rounded-full py-8 pl-24 pr-8 text-3xl font-heading italic focus:outline-none focus:border-text-main/30 text-text-main placeholder-text-muted/40 transition-colors"
                />
              </form>
              <div className="mt-8 text-center text-text-muted text-[10px] uppercase tracking-widest font-bold">
                {t('nav_search_try')}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}