import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';

export function TiltCard({ children, className }: { children: React.ReactNode, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [shineX, setShineX] = useState("50%");
  const [shineY, setShineY] = useState("50%");
  const [isHovered, setIsHovered] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setShineX(`${(x / rect.width) * 100}%`);
    setShineY(`${(y / rect.height) * 100}%`);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Smooth 3D tilt angles
    setRotateX((y - centerY) / 50); 
    setRotateY((centerX - x) / 50);
  };

  const handleMouseEnter = () => {
    setIsDark(document.documentElement.classList.contains('dark'));
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      className="w-full h-full flex flex-col"
    >
      <motion.div
        animate={{ rotateX, rotateY }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ 
          transformStyle: "preserve-3d",
          pointerEvents: 'none'
        }}
        className={`flex-1 ${className}`}
      >
        {/* Glare overlay (glow changes depending on theme) */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-20"
          style={{
            background: `radial-gradient(circle at ${shineX} ${shineY}, ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)'} 0%, transparent 60%)`,
            opacity: isHovered ? 1 : 0
          }}
        />
        {/* Inner 3D pop-out container */}
        <div 
          style={{ 
            transform: isHovered ? 'translateZ(25px)' : 'translateZ(0px)', 
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)', 
            transformStyle: 'preserve-3d',
            pointerEvents: 'auto'
          }}
          className="w-full h-full"
        >
          {/* SIRF EK wrapper — none wala extra div hatao */}
          <div className="pointer-events-auto w-full h-full">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

