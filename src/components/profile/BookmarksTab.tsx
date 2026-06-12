import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useBookmarks } from '../../contexts/BookmarkContext';

export function BookmarksTab() {
  const { bookmarks, toggleBookmark } = useBookmarks();

  return (
    <div className="space-y-3">
      <h4 className="text-[10px] uppercase tracking-widest font-bold text-text-muted">Bookmarked Sections</h4>
      {bookmarks.length === 0 ? (
        <div className="text-xs text-text-muted italic">No bookmarks yet.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {bookmarks.map((b) => (
              <motion.div
                key={b}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.9 }}
                className="text-[10px] px-2 py-1 rounded-full border border-text-main flex items-center gap-2 group cursor-pointer hover:bg-text-main hover:text-surface transition-colors"
                onClick={() => toggleBookmark(b)}
                title="Click to remove"
              >
                {b}
                <X size={10} className="opacity-50 group-hover:opacity-100" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
