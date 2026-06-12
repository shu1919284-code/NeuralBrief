import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as firestoreModule from 'firebase/firestore';
import * as hashModule from '@/lib/hash';

vi.mock('@/lib/hash', () => ({
  hashEmail: vi.fn(),
  getEmailHash: vi.fn(),
}));

/**
 * Hero uses useLanguage() — mock it so tests don't need a real LanguageContext.
 */
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const keys: Record<string, string> = {
        'hero.emailPlaceholder': 'email@address.com',
        'hero.ctaButton': 'hero_subscribe',
        'hero.successMessage': 'successfully subscribed',
        'hero.errorMessage': 'error',
      };
      return keys[key] ?? key;
    },
  }),
}));

/**
 * MagneticButton is a wrapper — render it as a plain button in tests.
 */
vi.mock('@/components/MagneticButton', () => ({
  MagneticButton: ({ children, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) =>
    <button {...props}>{children}</button>,
}));

const { Hero } = await import('@/components/Hero');

const mockedSetDoc = vi.mocked(firestoreModule.setDoc);
const mockedDoc = vi.mocked(firestoreModule.doc);

describe('Hero', () => {
  beforeEach(() => {
    mockedSetDoc.mockResolvedValue(undefined);
    mockedDoc.mockReturnValue({ path: 'subscribers/hashed' } as ReturnType<typeof firestoreModule.doc>);
    vi.mocked(hashModule.hashEmail).mockResolvedValue('a'.repeat(64));
  });

  it('email input is empty on initial render', () => {
    render(<Hero />);
    const input = screen.getByPlaceholderText('email@address.com');
    expect(input).toHaveValue('');
  });

  it('submit button shows the subscribe translation key when idle', () => {
    render(<Hero />);
    // Button text comes from t('hero_subscribe') — our mock returns the key itself
    expect(screen.getByRole('button', { name: 'hero_subscribe' })).toBeInTheDocument();
  });

  it('submit button shows WAIT... during submission', async () => {
    let resolveWrite!: () => void;
    mockedSetDoc.mockReturnValue(
      new Promise<undefined>((r) => { resolveWrite = () => r(undefined); }),
    );

    render(<Hero />);
    const input = screen.getByPlaceholderText('email@address.com');
    fireEvent.change(input, { target: { value: 'user@example.com' } });
    await act(async () => {});

    fireEvent.submit(screen.getByRole('button', { name: 'hero_subscribe' }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('...');
    });

    resolveWrite();
  });

  it('shows success message after Firestore write resolves', async () => {
    mockedSetDoc.mockResolvedValue(undefined);

    render(<Hero />);
    const input = screen.getByPlaceholderText('email@address.com');
    fireEvent.change(input, { target: { value: 'user@example.com' } });
    await act(async () => {});

    await act(async () => {
      fireEvent.submit(screen.getByPlaceholderText('email@address.com').closest('form')!);
    });

    await waitFor(() => {
      expect(screen.getByText(/successfully subscribed/i)).toBeInTheDocument();
    });
  });

  it('returns to idle state when Firestore write rejects (no error UI in component)', async () => {
    mockedSetDoc.mockRejectedValueOnce(new Error('Firestore unavailable'));

    render(<Hero />);
    const input = screen.getByPlaceholderText('email@address.com');
    fireEvent.change(input, { target: { value: 'user@example.com' } });
    await act(async () => {});

    await act(async () => {
      fireEvent.submit(screen.getByPlaceholderText('email@address.com').closest('form')!);
    });

    // Wait for the 3000ms error message timeout to reset to idle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 3100));
    });

    // Hero has no error UI — it falls back to idle; subscribe button reappears
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'hero_subscribe' })).toBeInTheDocument();
    });
  }, 10000);

  it('calls getEmailHash with the typed email value', async () => {
    const spy = vi.mocked(hashModule.hashEmail).mockResolvedValue('b'.repeat(64));
    mockedSetDoc.mockResolvedValue(undefined);

    render(<Hero />);
    const input = screen.getByPlaceholderText('email@address.com');
    fireEvent.change(input, { target: { value: 'hello@test.com' } });
    await act(async () => {});

    await act(async () => {
      fireEvent.submit(screen.getByPlaceholderText('email@address.com').closest('form')!);
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('hello@test.com');
    });
  });
});
