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
    render(<Hero briefingData={null} loadingBriefing={false} />);

    // Headlines
    expect(screen.getByText(/hero.headline/i)).toBeInTheDocument();
    expect(screen.getByText(/hero.subheadline/i)).toBeInTheDocument();

    // Description
    expect(screen.getByText(/hero.description/i)).toBeInTheDocument();

    // Scroll to process link
    const processLink = screen.getByRole('link', { name: /hero.ctaSecondary/i });
    expect(processLink).toBeInTheDocument();
    expect(processLink).toHaveAttribute('href', '#process');

    // Stats
    expect(screen.getByText(/hero.trustMetrics/i)).toBeInTheDocument();
    expect(screen.getByText(/hero.trustSources/i)).toBeInTheDocument();
  });

  it('scrolls to CTA section when link is clicked', () => {
    // Mock getElementById and scrollIntoView
    const mockScrollIntoView = vi.fn();
    const mockCtaElement = {
      scrollIntoView: mockScrollIntoView,
    } as unknown as HTMLElement;

    const spyGetElementById = vi.spyOn(document, 'getElementById').mockReturnValue(mockCtaElement);

    render(<Hero briefingData={null} loadingBriefing={false} />);
    const processLink = screen.getByRole('link', { name: /hero.ctaSecondary/i });
    
    fireEvent.click(processLink);

    expect(spyGetElementById).toHaveBeenCalledWith('process');
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    spyGetElementById.mockRestore();
  });
});
