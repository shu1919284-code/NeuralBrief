import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import * as firestoreModule from 'firebase/firestore';

/**
 * We import AuthContext so we can control the user state returned by useAuth().
 * The mock below overrides the context so we don't need a real Firebase user.
 */
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const { useAuth } = await import('@/contexts/AuthContext');
const { BookmarkProvider, useBookmarks } = await import('@/contexts/BookmarkContext');

const mockedUseAuth = vi.mocked(useAuth);
const mockedGetDoc = vi.mocked(firestoreModule.getDoc);
const mockedSetDoc = vi.mocked(firestoreModule.setDoc);

/** Renders BookmarkProvider and captures its context via a child. */
function renderBookmarks(): { getCtx: () => ReturnType<typeof useBookmarks> } {
  let captured!: ReturnType<typeof useBookmarks>;

  function Capture(): null {
    captured = useBookmarks();
    return null;
  }

  render(
    <BookmarkProvider>
      <Capture />
    </BookmarkProvider>,
  );

  return { getCtx: () => captured };
}

describe('BookmarkContext', () => {
  beforeEach(() => {
    mockedGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => ({}),
    } as any);
    mockedSetDoc.mockResolvedValue(undefined);
  });

  it('throws Error("AUTH_REQUIRED") when user is not authenticated', async () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      popupBlocked: false,
      authError: null,
      clearAuthError: vi.fn(),
    } as any);

    const { getCtx } = renderBookmarks();

    await expect(getCtx().toggleBookmark('section-1')).rejects.toThrow('AUTH_REQUIRED');
  });

  it('updates local state immediately (optimistic) before Firestore write', async () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'uid-1', email: 'a@b.com' } as never,
      loading: false,
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      popupBlocked: false,
      authError: null,
      clearAuthError: vi.fn(),
    } as any);

    const { getCtx } = renderBookmarks();

    // Firestore write should NOT have been called yet
    expect(mockedSetDoc).not.toHaveBeenCalled();

    await act(async () => {
      await getCtx().toggleBookmark('section-1');
    });

    // State updated immediately
    expect(getCtx().isBookmarked('section-1')).toBe(true);
    // But Firestore write is still pending (debounce timer hasn't fired)
    expect(mockedSetDoc).not.toHaveBeenCalled();
  });

  it('calls Firestore setDoc after 500ms debounce window', async () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'uid-2', email: 'b@c.com' } as never,
      loading: false,
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      popupBlocked: false,
      authError: null,
      clearAuthError: vi.fn(),
    } as any);

    const { getCtx } = renderBookmarks();

    await act(async () => {
      await getCtx().toggleBookmark('section-2');
    });

    expect(mockedSetDoc).not.toHaveBeenCalled();

    // Wait past the 500ms debounce
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });

    await waitFor(() => {
      expect(mockedSetDoc).toHaveBeenCalledTimes(1);
    });
  });

  it('rolls back state when Firestore write rejects', async () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'uid-3', email: 'c@d.com' } as never,
      loading: false,
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      popupBlocked: false,
      authError: null,
      clearAuthError: vi.fn(),
    } as any);

    mockedSetDoc.mockRejectedValueOnce(new Error('Firestore unavailable'));

    const { getCtx } = renderBookmarks();

    await act(async () => {
      await getCtx().toggleBookmark('section-rollback');
    });

    // Optimistic state shows bookmarked
    expect(getCtx().isBookmarked('section-rollback')).toBe(true);

    // Fire the debounce which will reject
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });

    await waitFor(() => {
      // State should be rolled back — item no longer bookmarked
      expect(getCtx().isBookmarked('section-rollback')).toBe(false);
    });
  });

  it('isBookmarked returns true for bookmarked items and false for others', async () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'uid-4', email: 'd@e.com' } as never,
      loading: false,
      signIn: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      popupBlocked: false,
      authError: null,
      clearAuthError: vi.fn(),
    } as any);
    // Simulate existing bookmarks in Firestore
    mockedGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ bookmarks: ['faq', 'hero'] }),
    } as any);

    const { getCtx } = renderBookmarks();

    await waitFor(() => {
      // Context should have loaded the Firestore bookmarks
      expect(getCtx().loading).toBe(false);
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    await waitFor(() => {
      expect(getCtx().isBookmarked('faq')).toBe(true);
      expect(getCtx().isBookmarked('hero')).toBe(true);
      expect(getCtx().isBookmarked('engine')).toBe(false);
    });
  });
});
