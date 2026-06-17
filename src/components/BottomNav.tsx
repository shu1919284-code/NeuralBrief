import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Mobile-only bottom navigation bar (hidden on `md` breakpoint and above).
 *
 * Tabs:
 *  Home     → smooth-scroll to #hero
 *  Digest   → smooth-scroll to #process
 *  Topics   → smooth-scroll to #focus  (FocusDomains section)
 *  Profile  → dispatches window event `openProfile` — listen in App.tsx:
 *
 *    useEffect(() => {
 *      const handler = () => setProfileOpen(true);
 *      window.addEventListener('openProfile', handler);
 *      return () => window.removeEventListener('openProfile', handler);
 *    }, []);
 *
 * Active tab updates automatically via IntersectionObserver as the user
 * scrolls through sections.
 *
 * Usage in App.tsx:
 *   import { BottomNav } from '@/components/BottomNav';
 *   // Inside JSX, after all sections:
 *   <BottomNav />
 */

type TabId = 'home' | 'digest' | 'topics' | 'profile';

interface TabDef {
  id: TabId;
  labelKey: string;
  sectionId: string | null; // null → dispatch event instead
  icon: React.JSX.Element;
}

// ── Minimal inline SVG icons (no extra dependency) ───────────────────────────

const HomeIcon = (): React.JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const DigestIcon = (): React.JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
  </svg>
);

const TopicsIcon = (): React.JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 6h16M4 12h10M4 18h6" />
  </svg>
);

const ProfileIcon = (): React.JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS: TabDef[] = [
  { id: 'home',    labelKey: 'nav.home',    sectionId: 'hero',    icon: <HomeIcon /> },
  { id: 'digest',  labelKey: 'nav.digest',  sectionId: 'process', icon: <DigestIcon /> },
  { id: 'topics',  labelKey: 'nav.topics',  sectionId: 'focus',   icon: <TopicsIcon /> },
  { id: 'profile', labelKey: 'nav.profile', sectionId: null,      icon: <ProfileIcon /> },
];

// Section IDs to watch (matches TABS above, minus profile which has no section)
const SECTION_IDS: Record<string, TabId> = {
  hero:    'home',
  process: 'digest',
  focus:   'topics',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function BottomNav(): React.JSX.Element {
  const { t } = useLanguage();
  const [active, setActive] = useState<TabId>('home');
  const [visible, setVisible] = useState(true);
  const lastScrollY = React.useRef(0);

  // ── Auto-hide on scroll down, show on scroll up ──────────────────────────
  useEffect((): (() => void) => {
    const onScroll = (): void => {
      const curr = window.scrollY;
      setVisible(curr < lastScrollY.current || curr < 60);
      lastScrollY.current = curr;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return (): void => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── IntersectionObserver: sync active tab with visible section ────────────
  useEffect((): (() => void) => {
    const observers: IntersectionObserver[] = [];

    Object.entries(SECTION_IDS).forEach(([id, tabId]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(tabId); },
        { threshold: 0.4 },
      );
      obs.observe(el);
      observers.push(obs);
    });

    return (): void => observers.forEach((o) => o.disconnect());
  }, []);

  // ── Tab press handler ────────────────────────────────────────────────────
  const handlePress = useCallback((tab: TabDef): void => {
    setActive(tab.id);

    if (tab.sectionId === null) {
      // Profile — delegate to App via custom event
      window.dispatchEvent(new CustomEvent('openProfile'));
      return;
    }

    const el = document.getElementById(tab.sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          key="bottom-nav"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border-subtle"
          // env() is a dynamic CSS value → inline style is the right tool
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="flex items-stretch justify-around">
            {TABS.map((tab) => {
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={(): void => handlePress(tab)}
                  className="relative flex flex-col items-center justify-center gap-1 flex-1 py-3 px-2 text-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-main"
                  aria-label={tab.labelKey}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Top-edge active indicator */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-text-main rounded-b"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <motion.span
                    animate={{
                      color: isActive ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                      scale: isActive ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center"
                  >
                    {tab.icon}
                  </motion.span>

                  {/* Label */}
                  <motion.span
                    animate={{
                      color: isActive ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                    }}
                    transition={{ duration: 0.2 }}
                    className="text-[9px] uppercase tracking-widest font-bold leading-none"
                  >
                    {/* Fallback to tab id if translation key not yet added */}
                    {t(tab.labelKey as Parameters<typeof t>[0]) || tab.id}
                  </motion.span>
                </button>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

export default BottomNav;
