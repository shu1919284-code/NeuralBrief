import React, { createContext, useContext, useEffect, useState } from 'react';

export type Mode = 'light' | 'dark';
export type ThemePersonality = 
  | 'neural' 
  | 'indigo-intelligence' 
  | 'emerald-analyst' 
  | 'crimson-real-time' 
  | 'amber-insight' 
  | 'golden-executive';

interface ThemeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  theme: ThemePersonality;
  setTheme: (theme: ThemePersonality) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  setMode: () => {},
  theme: 'neural',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('dark');
  const [theme, setThemeState] = useState<ThemePersonality>('neural');

  useEffect(() => {
    // Restore on load
    const savedMode = localStorage.getItem('neuralbrief_mode') as Mode;
    const savedTheme = localStorage.getItem('neuralbrief_theme') as ThemePersonality;

    // Prefer system preference for mode if nothing is saved
    let initialMode: Mode = 'dark';
    if (savedMode) {
      initialMode = savedMode;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      initialMode = 'light';
    }

    const initialTheme: ThemePersonality = savedTheme || 'neural';

    setModeState(initialMode);
    setThemeState(initialTheme);

    // Apply to DOM
    if (initialMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem('neuralbrief_mode', newMode);
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setTheme = (newTheme: ThemePersonality) => {
    setThemeState(newTheme);
    localStorage.setItem('neuralbrief_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
