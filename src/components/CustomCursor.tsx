import { useEffect, useRef } from 'react';
export function CustomCursor() {
  const pointerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let pointerX = 0, pointerY = 0;
    let targetX = 0, targetY = 0;
    let animationFrameId: number;
    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };
    const animatePointer = () => {
      pointerX += (targetX - pointerX) * 0.2;
      pointerY += (targetY - pointerY) * 0.2;
      if (pointerRef.current) {
        pointerRef.current.style.transform = `translate(${pointerX - 6}px, ${pointerY - 6}px)`;
      }
      animationFrameId = requestAnimationFrame(animatePointer);
    };
    window.addEventListener('mousemove', onMouseMove);
    animatePointer();
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  return (
    <div 
      ref={pointerRef} 
      className="fixed w-3 h-3 bg-[var(--color-accent)] rounded-full z-[9999] pointer-events-none mix-blend-multiply hidden md:block opacity-60" 
      style={{ top: 0, left: 0 }}
    />
  );
}