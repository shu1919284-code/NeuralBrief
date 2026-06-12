import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/** Public API exposed by BookmarkContext. */
interface BookmarkContextType {
  bookmarks: string[];
  toggleBookmark: (itemId: string) => Promise<void>;
  isBookmarked: (itemId: string) => boolean;
  loading: boolean;
}

const BookmarkContext = createContext<BookmarkContextType>({
  bookmarks: [],
  toggleBookmark: async () => {},
  isBookmarked: () => false,
  loading: false,
});

/** Returns the bookmark context value. Must be used inside <BookmarkProvider>. */
export const useBookmarks = (): BookmarkContextType => useContext(BookmarkContext);

/**
 * BookmarkProvider
 *
 * Manages bookmark state with:
 * - Optimistic UI updates on toggle
 * - 500 ms debounce before writing to Firestore
 * - Rollback to previous state on Firestore write failure
 * - Typed AUTH_REQUIRED error thrown when unauthenticated user toggles
 * - Pending-write queue via useRef to prevent stale-closure race conditions
 */
export function BookmarkProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Ref always holds the latest committed bookmark list.
   * The debounce callback reads from here to avoid stale closures.
   */
  const committedRef = useRef<string[]>([]);

  /** Timer handle for the 500 ms debounce window. */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Tracks whether a Firestore write is currently in-flight. */
  const writePendingRef = useRef(false);

  // Keep committedRef in sync with bookmarks state
  useEffect(() => {
    committedRef.current = bookmarks;
  }, [bookmarks]);

  // Load bookmarks from Firestore on sign-in, clear on sign-out
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!user) {
      setBookmarks([]);
      committedRef.current = [];
      return;
    }

    const loadBookmarks = async (): Promise<void> => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const raw = snap.data();
          const stored = Array.isArray(raw['bookmarks']) ? (raw['bookmarks'] as string[]) : [];
          setBookmarks(stored);
          committedRef.current = stored;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console
        console.error('[BookmarkContext] Failed to load bookmarks:', message);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [user]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /**
   * Persists the current committedRef value to Firestore.
   * On failure, restores the provided previousState to the local bookmarks.
   */
  const persistToFirestore = useCallback(
    async (uid: string, previousState: string[]): Promise<void> => {
      writePendingRef.current = true;
      try {
        await setDoc(
          doc(db, 'users', uid),
          { bookmarks: committedRef.current, updatedAt: serverTimestamp() },
          { merge: true },
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console
        console.error('[BookmarkContext] Firestore write failed, rolling back:', message);
        // Rollback optimistic update
        setBookmarks(previousState);
        committedRef.current = previousState;
      } finally {
        writePendingRef.current = false;
        timerRef.current = null;
      }
    },
    [],
  );

  /**
   * Toggles a bookmark on or off.
   *
   * @throws {Error} with message 'AUTH_REQUIRED' when no user is signed in.
   *
   * Behaviour:
   * 1. Throws AUTH_REQUIRED if unauthenticated.
   * 2. Applies an optimistic state update immediately.
   * 3. Debounces the Firestore write by 500 ms — rapid toggles collapse into one write.
   * 4. On write failure, rolls back to the pre-toggle state.
   */
  const toggleBookmark = useCallback(
    async (itemId: string): Promise<void> => {
      if (!user) {
        throw new Error('AUTH_REQUIRED');
      }

      const previousState = committedRef.current.slice();
      const isCurrentlyBookmarked = committedRef.current.includes(itemId);

      const nextBookmarks = isCurrentlyBookmarked
        ? committedRef.current.filter((id) => id !== itemId)
        : [...committedRef.current, itemId];

      // Optimistic update — immediate
      setBookmarks(nextBookmarks);
      committedRef.current = nextBookmarks;

      // Cancel any pending debounce window and start a fresh one
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        persistToFirestore(user.uid, previousState);
      }, 500);
    },
    [user, persistToFirestore],
  );

  const isBookmarked = useCallback(
    (itemId: string): boolean => bookmarks.includes(itemId),
    [bookmarks],
  );

  return (
    <BookmarkContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked, loading }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export default BookmarkProvider;
