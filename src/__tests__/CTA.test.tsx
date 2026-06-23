import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import * as firestoreModule from 'firebase/firestore';
import * as hashModule from '@/lib/hash';

vi.mock('@/lib/hash', () => ({
  hashEmail: vi.fn(),
  getEmailHash: vi.fn(),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const keys: Record<string, string> = {
        'cta_title_1': 'cta_title_1',
        'cta_title_2': 'cta_title_2',
        'cta_desc': 'cta_desc',
        'cta_success_heading': "You're in.",
        'cta_success_desc': 'First briefing arrives at 07:00 UTC.',
        'cta_error_invalid_email': 'Please enter a valid email.',
      };
      return keys[key] ?? key;
    },
  }),
}));

const { CTA } = await import('@/components/CTA');

const mockedSetDoc = vi.mocked(firestoreModule.setDoc);
const mockedDoc = vi.mocked(firestoreModule.doc);

describe('CTA', () => {
  beforeEach(() => {
    mockedSetDoc.mockResolvedValue(undefined);
    mockedDoc.mockReturnValue({ path: 'subscribers/hashed' } as ReturnType<typeof firestoreModule.doc>);
    vi.mocked(hashModule.hashEmail).mockResolvedValue('a'.repeat(64));
  });

  it('email input is empty on initial render', () => {
    render(<CTA />);
    const input = screen.getByPlaceholderText('email@address.com');
    expect(input).toHaveValue('');
  });

  it('shows success message after Firestore write resolves', async () => {
    mockedSetDoc.mockResolvedValue(undefined);

    render(<CTA />);
    const input = screen.getByPlaceholderText('email@address.com');
    fireEvent.change(input, { target: { value: 'user@example.com' } });
    await act(async () => {});

    await act(async () => {
      fireEvent.submit(screen.getByPlaceholderText('email@address.com').closest('form')!);
    });

    await waitFor(() => {
      expect(screen.getByText(/You're in./i)).toBeInTheDocument();
    });
  });

  it('returns to idle state when Firestore write rejects', async () => {
    mockedSetDoc.mockRejectedValueOnce(new Error('Firestore unavailable'));

    render(<CTA />);
    const input = screen.getByPlaceholderText('email@address.com');
    fireEvent.change(input, { target: { value: 'user@example.com' } });
    await act(async () => {});

    await act(async () => {
      fireEvent.submit(screen.getByPlaceholderText('email@address.com').closest('form')!);
    });

    // Wait for the error message timeout to reset to idle (3000ms)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 3100));
    });

    // Email input reappears when status resets to idle
    await waitFor(() => {
      expect(screen.getByPlaceholderText('email@address.com')).toBeInTheDocument();
    });
  }, 10000);

  it('calls hashEmail with the typed email value', async () => {
    const spy = vi.mocked(hashModule.hashEmail).mockResolvedValue('b'.repeat(64));
    mockedSetDoc.mockResolvedValue(undefined);

    render(<CTA />);
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
