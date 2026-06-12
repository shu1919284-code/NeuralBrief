import React from 'react';
import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Row,
  Section,
  Text,
} from '@react-email/components';

import type { DigestSection, SummarizedItem } from '../types/index.js';

interface DigestEmailProps {
  userName: string;
  sections: DigestSection[];
  generatedAt: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const COLORS = {
  bg: '#0a0a0a',
  containerBg: '#111111',
  primaryText: '#f1f5f9',
  secondaryText: '#94a3b8',
  accent: '#6366f1',
  border: '#1e293b',
  badge: {
    breaking: '#ef4444',
    analysis: '#3b82f6',
    release: '#22c55e',
    general: '#475569',
  },
} as const;

const FONT_STACK = 'Inter, -apple-system, Arial, sans-serif';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats an ISO date string into a long human-readable form.
 * e.g. "Wednesday, June 11, 2026"
 */
function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats an ISO date string into a short readable form.
 * e.g. "Jun 11, 2026"
 */
function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Returns the background colour for a given article category badge.
 */
function badgeColor(category: SummarizedItem['category']): string {
  return COLORS.badge[category];
}

/**
 * Returns a capitalised display label for an article category.
 */
function categoryLabel(category: SummarizedItem['category']): string {
  const labels: Record<SummarizedItem['category'], string> = {
    breaking: 'Breaking',
    analysis: 'Analysis',
    release: 'Release',
    general: 'General',
  };
  return labels[category];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Renders a single news item card within a digest section.
 */
function NewsItemCard({ item }: { item: SummarizedItem; key?: React.Key }): React.JSX.Element {
  return (
    <Section
      style={{
        backgroundColor: COLORS.containerBg,
        borderTop: `1px solid ${COLORS.border}`,
        paddingTop: '16px',
        paddingBottom: '16px',
        paddingLeft: '0',
        paddingRight: '0',
      }}
    >
      {/* Category badge */}
      <Row>
        <Column>
          <Text
            style={{
              display: 'inline-block',
              backgroundColor: badgeColor(item.category),
              color: '#ffffff',
              fontFamily: FONT_STACK,
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '2px 8px',
              borderRadius: '4px',
              margin: '0 0 8px 0',
            }}
          >
            {categoryLabel(item.category)}
          </Text>
        </Column>
      </Row>

      {/* Title link */}
      <Row>
        <Column>
          <Link
            href={item.url}
            style={{
              fontFamily: FONT_STACK,
              fontSize: '16px',
              fontWeight: '600',
              color: COLORS.accent,
              textDecoration: 'none',
              lineHeight: '1.4',
              display: 'block',
              margin: '0 0 8px 0',
            }}
          >
            {item.title}
          </Link>
        </Column>
      </Row>

      {/* Summary */}
      <Row>
        <Column>
          <Text
            style={{
              fontFamily: FONT_STACK,
              fontSize: '14px',
              color: COLORS.secondaryText,
              lineHeight: '1.6',
              margin: '0 0 10px 0',
            }}
          >
            {item.summary}
          </Text>
        </Column>
      </Row>

      {/* Source */}
      <Row>
        <Column>
          <Text
            style={{
              fontFamily: FONT_STACK,
              fontSize: '12px',
              color: '#64748b',
              margin: '0',
            }}
          >
            {item.source}
          </Text>
        </Column>
      </Row>
    </Section>
  );
}

/**
 * Renders a single topic section with a header and its news items.
 */
function TopicSection({ section }: { section: DigestSection; key?: React.Key }): React.JSX.Element {
  return (
    <Section style={{ marginBottom: '24px' }}>
      {/* Section header row */}
      <Row style={{ marginBottom: '16px' }}>
        <Column>
          <Text
            style={{
              fontFamily: FONT_STACK,
              fontSize: '13px',
              fontWeight: '700',
              color: COLORS.primaryText,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              display: 'inline-block',
              margin: '0',
            }}
          >
            {section.topic}
          </Text>

          <Text
            style={{
              display: 'inline-block',
              backgroundColor: '#1e293b',
              color: COLORS.secondaryText,
              fontFamily: FONT_STACK,
              fontSize: '11px',
              fontWeight: '600',
              padding: '2px 8px',
              borderRadius: '10px',
              marginLeft: '10px',
              verticalAlign: 'middle',
            }}
          >
            {section.items.length} {section.items.length === 1 ? 'story' : 'stories'}
          </Text>
        </Column>
      </Row>

      {section.items.map((item, index) => (
        <NewsItemCard key={index} item={item} />
      ))}

      <Hr
        style={{
          borderColor: COLORS.border,
          borderTopWidth: '1px',
          margin: '24px 0 0 0',
        }}
      />
    </Section>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Full email digest template for NeuralBrief.
 * Dark-themed, premium, fully inline-styled for maximum email client compatibility.
 * No flexbox — uses table-compatible Row/Column layout throughout.
 */
export function DigestEmail({
  userName,
  sections,
  generatedAt,
}: DigestEmailProps): React.JSX.Element {
  const longDate = formatLongDate(generatedAt);
  const shortDate = formatShortDate(generatedAt);

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Body
        style={{
          backgroundColor: COLORS.bg,
          margin: '0',
          padding: '0',
          fontFamily: FONT_STACK,
        }}
      >
        <Container
          style={{
            backgroundColor: COLORS.containerBg,
            maxWidth: '600px',
            margin: '0 auto',
            padding: '40px 32px',
          }}
        >
          {/* ── Header ───────────────────────────────────────────────────── */}
          <Section style={{ marginBottom: '32px', textAlign: 'center' }}>
            <Text
              style={{
                fontFamily: FONT_STACK,
                fontSize: '22px',
                fontWeight: '800',
                color: COLORS.primaryText,
                letterSpacing: '-0.02em',
                margin: '0 0 6px 0',
              }}
            >
              NeuralBrief
            </Text>

            <Text
              style={{
                fontFamily: FONT_STACK,
                fontSize: '14px',
                color: COLORS.accent,
                fontWeight: '500',
                margin: '0 0 4px 0',
              }}
            >
              {longDate}
            </Text>

            <Text
              style={{
                fontFamily: FONT_STACK,
                fontSize: '13px',
                color: COLORS.secondaryText,
                margin: '0',
              }}
            >
              Your Daily Intelligence Digest
            </Text>
          </Section>

          <Hr
            style={{
              borderColor: COLORS.border,
              borderTopWidth: '1px',
              margin: '0 0 32px 0',
            }}
          />

          {/* ── Greeting ─────────────────────────────────────────────────── */}
          <Section style={{ marginBottom: '28px' }}>
            <Text
              style={{
                fontFamily: FONT_STACK,
                fontSize: '15px',
                color: COLORS.primaryText,
                margin: '0',
              }}
            >
              Good morning, {userName} —
            </Text>
            <Text
              style={{
                fontFamily: FONT_STACK,
                fontSize: '14px',
                color: COLORS.secondaryText,
                margin: '6px 0 0 0',
              }}
            >
              Here's what's happening across your {sections.length}{' '}
              {sections.length === 1 ? 'topic' : 'topics'} today.
            </Text>
          </Section>

          {/* ── Sections ─────────────────────────────────────────────────── */}
          {sections.map((section, index) => (
            <TopicSection key={index} section={section} />
          ))}

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <Section style={{ marginTop: '32px' }}>
            <Hr
              style={{
                borderColor: COLORS.border,
                borderTopWidth: '1px',
                margin: '0 0 20px 0',
              }}
            />

            <Text
              style={{
                fontFamily: FONT_STACK,
                fontSize: '12px',
                color: '#475569',
                margin: '0 0 8px 0',
                textAlign: 'center',
              }}
            >
              Generated by NeuralBrief · {shortDate}
            </Text>

            <Text
              style={{
                fontFamily: FONT_STACK,
                fontSize: '12px',
                textAlign: 'center',
                margin: '0',
              }}
            >
              <Link
                href="https://neuralbrief.app/profile"
                style={{
                  color: COLORS.accent,
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontFamily: FONT_STACK,
                }}
              >
                Manage your topics
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default DigestEmail;
