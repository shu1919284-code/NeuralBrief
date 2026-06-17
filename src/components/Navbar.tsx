import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sun, Globe, Search, X, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ProfileModal } from './ProfileModal';

export function Navbar() {
  const [isDark, setIsDark] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, signInWithGoogle, signOut, authError, clearAuthError } = useAuth();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => {
        clearAuthError();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [authError]);



  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    const handler = () => setShowProfile(true);
    window.addEventListener('openProfile', handler);
    return () => window.removeEventListener('openProfile', handler);
  }, []);

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

  const performSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, p'));
    const match = elements.find(el => el.textContent?.toLowerCase().includes(searchQuery.toLowerCase()));
    if (match) {
      match.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setShowSearch(false);
    } else {
      if (searchInputRef.current) {
        searchInputRef.current.animate([
          { transform: 'translateX(0)' },
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(5px)' },
          { transform: 'translateX(0)' }
        ], { duration: 300 });
      }
    }
  };

  return (
    <>
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
        initial={{ y: "-100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed w-full top-0 z-50 px-6 md:px-16 py-6 flex justify-between items-center bg-surface/80 backdrop-blur-xl border-b border-border-subtle"
      >
        <div className="font-heading font-bold text-2xl italic tracking-tighter text-text-main">NeuralBrief</div>
        <ul className="hidden md:flex gap-8 lg:gap-10 items-center">
          <li><a href="#topics" className="text-[11px] uppercase tracking-widest font-bold text-text-muted hover:text-text-main active:scale-95 transition-all inline-block">{t('nav_domains')}</a></li>
          <li><a href="#process" className="text-[11px] uppercase tracking-widest font-bold text-text-muted hover:text-text-main active:scale-95 transition-all inline-block">{t('nav_engine')}</a></li>
          <li><a href="#preview" className="text-[11px] uppercase tracking-widest font-bold text-text-muted hover:text-text-main active:scale-95 transition-all inline-block">{t('nav_digest')}</a></li>
          
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

          <li>
            <button 
              onClick={() => setShowSearch(true)}
              className="flex items-center justify-center w-8 h-8 text-text-muted hover:text-text-main active:scale-90 transition-all focus:outline-none cursor-pointer"
              aria-label="Search"
            >
              <Search size={16} />
            </button>
          </li>

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
                Press Enter to navigate to first match
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
