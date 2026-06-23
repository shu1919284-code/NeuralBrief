import { useEffect, useRef, useState } from 'react';

/**
 * ScrollProgress
 *
 * A 1px-tall horizontal hairline fixed to the very top of the viewport.
 * Width fills from 0 → 100% as the user scrolls the full page height.
 *
 * Intentionally avoids motion/react spring physics — uses a raw rAF-throttled
 * scroll listener so the bar tracks scroll position exactly, with no lag or
 * overshoot. Color is white at 50% opacity: visible but unobtrusive.
 *
 * Usage: mount once in the root layout, above the nav in DOM order.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollable = docHeight - viewportHeight;

      if (scrollable <= 0) {
        setProgress(0);
        return;
      }

      setProgress(Math.min((scrollY / scrollable) * 100, 100));
      rafId.current = null;
    };

    const onScroll = () => {
      // Throttle to one rAF tick — ignore subsequent events until the frame fires
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Run once on mount so initial position is correct (e.g. after a page refresh mid-scroll)
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '1px',
        width: `${progress}%`,
        backgroundColor: 'var(--color-accent)',
        zIndex: 9999,           // above nav, modals, everything
        pointerEvents: 'none',  // never intercepts clicks
        willChange: 'width',
      }}
    />
  );
}

export default ScrollProgress;