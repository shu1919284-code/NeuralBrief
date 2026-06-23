import '@testing-library/jest-dom';
import React from 'react';
import { vi, afterEach } from 'vitest';

// Mock ResizeObserver for jsdom environment
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

/**
 * Mock Firebase — all access goes through @/lib/firebase per conventions.
 * Components must never import Firebase directly; this mock mirrors the
 * shape that firebase.ts exports.
 */
vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  },
  serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
}));

/**
 * Mock firebase/firestore so individual tests can control Firestore behaviour
 * without hitting a real database. Functions are vi.fn() stubs by default.
 */
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
  getDoc: vi.fn(async () => ({ exists: () => false, data: () => ({}) })),
  setDoc: vi.fn(async () => undefined),
  getDocs: vi.fn(async () => ({ docs: [] })),
  collection: vi.fn((_db: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
  serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
  onSnapshot: vi.fn(() => vi.fn()),
}));

/**
 * Mock firebase/auth so signInWithPopup and signOut can be tested without
 * a real Firebase project.
 */
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn().mockImplementation(function (this: any) { return {}; }),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(() => vi.fn()),
  getAuth: vi.fn(() => ({})),
}));

/**
 * Mock Framer Motion — passthrough components so we can assert on rendered
 * output without running real animation logic in jsdom.
 */
vi.mock('motion/react', async () => {
  const React = await import('react');

  type PassthroughProps = Record<string, unknown> & { children?: React.ReactNode };

  const passthrough =
    (tag: string) =>
    ({ children, ...rest }: PassthroughProps) => {
      // Strip Framer-specific props that would cause React warnings on DOM nodes
      const {
        initial: _i,
        animate: _a,
        exit: _e,
        transition: _t,
        whileHover: _wh,
        whileTap: _wt,
        variants: _v,
        ...domProps
      } = rest;
      return React.createElement(tag, domProps, children);
    };

  return {
    motion: new Proxy(
      {},
      {
        get: (_target, prop: string) => passthrough(prop),
      },
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
    useInView: () => false,
    useMotionValue: (v: unknown) => ({ get: () => v, set: vi.fn() }),
    useTransform: () => ({ get: vi.fn() }),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});
