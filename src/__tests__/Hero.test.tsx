import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const keys: Record<string, string> = {
        'hero.headline': 'hero.headline',
        'hero.subheadline': 'hero.subheadline',
        'hero.description': 'hero.description',
        'hero.ctaButton': 'hero_subscribe',
        'engine.step2': 'engine.step2',
        'features.badge3': 'features.badge3',
        'cta.subtitle': 'cta.subtitle',
      };
      return keys[key] ?? key;
    },
  }),
}));

const { Hero } = await import('@/components/Hero');

describe('Hero', () => {
  it('renders headlines, description, and stats correctly', () => {
    render(<Hero />);

    // Headlines
    expect(screen.getByText(/hero.headline/i)).toBeInTheDocument();
    expect(screen.getByText(/hero.subheadline/i)).toBeInTheDocument();

    // Description
    expect(screen.getByText(/hero.description/i)).toBeInTheDocument();

    // Scroll to CTA link
    const ctaLink = screen.getByRole('link', { name: /Subscribe to Weekly Digest/i });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute('href', '#cta');

    // Stats
    expect(screen.getByText(/15\+/i)).toBeInTheDocument();
    expect(screen.getByText(/05:00/i)).toBeInTheDocument();
    expect(screen.getByText(/0%/i)).toBeInTheDocument();
  });

  it('scrolls to CTA section when link is clicked', () => {
    // Mock getElementById and scrollIntoView
    const mockScrollIntoView = vi.fn();
    const mockCtaElement = {
      scrollIntoView: mockScrollIntoView,
    } as unknown as HTMLElement;

    const spyGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue(mockCtaElement);

    render(<Hero />);
    const ctaLink = screen.getByRole('link', { name: /Subscribe to Weekly Digest/i });
    
    fireEvent.click(ctaLink);

    expect(spyGetElementById).toHaveBeenCalledWith('cta');
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    spyGetElementById.mockRestore();
  });
});
