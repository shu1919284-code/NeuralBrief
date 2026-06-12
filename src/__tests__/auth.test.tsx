import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import * as firebaseAuth from 'firebase/auth';
import * as firestoreModule from 'firebase/firestore';
import type { User } from 'firebase/auth';

const { AuthProvider, useAuth } = await import('@/contexts/AuthContext');

/** Captures context values via a child render. */
function ContextCapture({
  onCapture,
}: {
  onCapture: (ctx: ReturnType<typeof useAuth>) => void;
}): null {
  onCapture(useAuth());
  return null;
}

const mockedSignInWithPopup = vi.mocked(firebaseAuth.signInWithPopup);
const mockedFirebaseSignOut = vi.mocked(firebaseAuth.signOut);
const mockedOnAuthStateChanged = vi.mocked(firebaseAuth.onAuthStateChanged);
const mockedGetDoc = vi.mocked(firestoreModule.getDoc);
const mockedSetDoc = vi.mocked(firestoreModule.setDoc);

function makeUser(overrides: Partial<User> = {}): User {
  return { uid: 'uid-abc', email: 'user@example.com', displayName: 'Test User', photoURL: null, ...overrides } as User;
}

describe('AuthContext', () => {
  let capturedCtx!: ReturnType<typeof useAuth>;

  function renderAuth(): void {
    render(
      <AuthProvider>
        <ContextCapture onCapture={(ctx) => { capturedCtx = ctx; }} />
      </AuthProvider>,
    );
  }

  beforeEach(() => {
    mockedOnAuthStateChanged.mockImplementation((_auth, cb) => {
      (cb as (u: User | null) => void)(null);
      return vi.fn();
    });
    mockedGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) } as any);
    mockedSetDoc.mockResolvedValue(undefined);
    mockedSignInWithPopup.mockResolvedValue({
      user: makeUser(),
      providerId: 'google.com',
      operationType: 'signIn',
    } as Awaited<ReturnType<typeof firebaseAuth.signInWithPopup>>);
    mockedFirebaseSignOut.mockResolvedValue(undefined);
  });

  it('calls signInWithPopup on signInWithGoogle()', async () => {
    renderAuth();

    await act(async () => {
      await capturedCtx.signInWithGoogle();
    });

    expect(mockedSignInWithPopup).toHaveBeenCalledTimes(1);
  });

  it('sets authError when error code is auth/popup-blocked', async () => {
    const popupError = Object.assign(new Error('Popup blocked'), { code: 'auth/popup-blocked' });
    mockedSignInWithPopup.mockRejectedValueOnce(popupError);

    renderAuth();

    await act(async () => {
      await capturedCtx.signInWithGoogle();
    });

    await waitFor(() => {
      expect(capturedCtx.authError).toMatch(/popup/i);
    });
  });

  it('creates a Firestore user doc when user signs in for the first time', async () => {
    mockedOnAuthStateChanged.mockImplementation((_auth, cb) => {
      (cb as (u: User | null) => void)(makeUser());
      return vi.fn();
    });
    mockedGetDoc.mockResolvedValueOnce({ exists: () => false, data: () => ({}) } as any);

    renderAuth();

    await waitFor(() => {
      expect(mockedSetDoc).toHaveBeenCalled();
    });
  });

  it('does NOT overwrite the Firestore doc when the user already exists', async () => {
    mockedOnAuthStateChanged.mockImplementation((_auth, cb) => {
      (cb as (u: User | null) => void)(makeUser());
      return vi.fn();
    });
    mockedGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ uid: 'uid-abc', email: 'user@example.com' }),
    } as any);

    renderAuth();

    await waitFor(() => expect(mockedOnAuthStateChanged).toHaveBeenCalled());
    expect(mockedSetDoc).not.toHaveBeenCalled();
  });

  it('signOut clears the user state to null', async () => {
    let authCallback!: (u: User | null) => void;
    mockedOnAuthStateChanged.mockImplementation((_auth, cb) => {
      authCallback = cb as (u: User | null) => void;
      authCallback(makeUser());
      return vi.fn();
    });

    renderAuth();

    await waitFor(() => expect(capturedCtx.user).not.toBeNull());

    mockedFirebaseSignOut.mockImplementationOnce(async () => {
      authCallback(null);
    });

    await act(async () => {
      await capturedCtx.signOut();
    });

    await waitFor(() => expect(capturedCtx.user).toBeNull());
  });
});
