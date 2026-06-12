import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface AudioContextType {
  isAudioEnabled: boolean;
  toggleAudio: () => void;
  playHoverSound: () => void;
  playSuccessSound: () => void;
}

const AudioContext = createContext<AudioContextType>({
  isAudioEnabled: false,
  toggleAudio: () => {},
  playHoverSound: () => {},
  playSuccessSound: () => {},
});

export const useAudio = () => useContext(AudioContext);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  useEffect(() => {
    if (isAudioEnabled && !audioCtx) {
      setAudioCtx(new (window.AudioContext || (window as any).webkitAudioContext)());
    } else if (!isAudioEnabled && audioCtx) {
      audioCtx.close();
      setAudioCtx(null);
    }
  }, [isAudioEnabled, audioCtx]);

  const toggleAudio = useCallback(() => {
    setIsAudioEnabled((prev) => !prev);
  }, []);

  const playHoverSound = useCallback(() => {
    if (!isAudioEnabled || !audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // High pitch tick
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.05);
  }, [isAudioEnabled, audioCtx]);

  const playSuccessSound = useCallback(() => {
    if (!isAudioEnabled || !audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.2);
  }, [isAudioEnabled, audioCtx]);

  return (
    <AudioContext.Provider value={{ isAudioEnabled, toggleAudio, playHoverSound, playSuccessSound }}>
      {children}
    </AudioContext.Provider>
  );
}
