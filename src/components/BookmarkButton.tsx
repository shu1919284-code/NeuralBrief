import React from 'react';
import { Bookmark } from 'lucide-react';
import { useBookmarks } from '../contexts/BookmarkContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { useAudio } from '../contexts/AudioContext';

interface BookmarkButtonProps {
  sectionId: string;
}

export function BookmarkButton({ sectionId }: BookmarkButtonProps) {
  const { user } = useAuth();
  const { bookmarks, toggleBookmark, isBookmarked } = useBookmarks();
  const { playHoverSound, playSuccessSound } = useAudio();

  if (!user) return null;

  const active = isBookmarked(sectionId);

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={active ? "Remove bookmark" : "Bookmark this section"}
      onMouseEnter={playHoverSound}
      onClick={(e) => {
        e.stopPropagation();
        toggleBookmark(sectionId);
        if (!active) playSuccessSound();
      }}
      className={`absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center border border-border-subtle cursor-pointer transition-colors focus:outline-none ${
        active 
          ? 'bg-text-main text-surface border-text-main hover:opacity-90' 
          : 'bg-surface/50 backdrop-blur text-text-muted hover:text-text-main hover:border-text-main'
      }`}
    >
      <Bookmark size={14} fill={active ? 'currentColor' : 'none'} className="transition-all" />
    </motion.button>
  );
}
