import type { SummarizedItem } from '../types/index.js';
import type { GeminiService } from '../services/gemini-service.js';

type Category = SummarizedItem['category'];

const KEYWORD_RULES: Record<Exclude<Category, 'general'>, RegExp[]> = {
  breaking: [
    /announces/i,
    /launches/i,
    /releases/i,
    /breaks/i,
    /just in/i,
    /urgent/i,
    /critical/i,
    /zero-day/i,
    /outage/i,
  ],
  analysis: [
    /\bwhy\b/i,
    /\bhow\b/i,
    /\banalysis\b/i,
    /deep dive/i,
    /explained/i,
    /understanding/i,
    /guide to/i,
    /breakdown/i,
  ],
  release: [
    /\bversion\b/i,
    /\bupdate\b/i,
    /now available/i,
    /\bshipped\b/i,
    /changelog/i,
    /\bintroducing\b/i,
    /new in/i,
  ],
};

const VERSION_PATTERN = /v\d+\.\d+/i;
const VALID_CATEGORIES = new Set<Category>(['breaking', 'analysis', 'release', 'general']);
const KEYWORD_CONFIDENCE_THRESHOLD = 2;

/**
 * Counts how many regex patterns match the given text.
 */
function countMatches(patterns: RegExp[], text: string): number {
  return patterns.filter((p) => p.test(text)).length;
}

/**
 * Hybrid article categorizer. Applies keyword rules first for speed and cost savings;
 * falls back to Gemini only when no confident keyword match is found.
 *
 * @param title - Article headline
 * @param snippet - Article excerpt or description
 * @param geminiService - Injected GeminiService instance for AI fallback
 * @returns The resolved content category
 */
export async function categorizeArticle(
  title: string,
  snippet: string,
  geminiService: GeminiService,
): Promise<Category> {
  const combined = `${title} ${snippet}`;

  // Pass 1: breaking — 2+ keyword matches → high confidence
  const breakingMatches = countMatches(KEYWORD_RULES.breaking, combined);
  if (breakingMatches >= KEYWORD_CONFIDENCE_THRESHOLD) {
    return 'breaking';
  }

  // Pass 2: analysis — 2+ keyword matches → high confidence
  const analysisMatches = countMatches(KEYWORD_RULES.analysis, combined);
  if (analysisMatches >= KEYWORD_CONFIDENCE_THRESHOLD) {
    return 'analysis';
  }

  // Pass 3: release — version pattern or 1+ keyword match
  const hasVersionNumber = VERSION_PATTERN.test(combined);
  const releaseMatches = countMatches(KEYWORD_RULES.release, combined);
  if (hasVersionNumber || releaseMatches >= 1) {
    return 'release';
  }

  // Pass 4: Gemini fallback for ambiguous content
  const geminiCategory = await geminiService.categorize(title, snippet);

  if (VALID_CATEGORIES.has(geminiCategory)) {
    return geminiCategory;
  }

  return 'general';
}
