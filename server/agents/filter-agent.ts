/**
 * NeuralBrief Filter Agent — Stage 2 of the agent pipeline.
 *
 * Receives raw NewsItems from the Scraper Agent and applies a five-step
 * filtering pipeline before passing FilteredNewsItems to the Summary Agent.
 *
 * Pipeline steps (applied in order):
 *  1. Age filter       — drop items older than 48 hours
 *  2. Duplicate filter — URL-exact and Jaccard-title similarity
 *  3. Quality filter   — drop items with empty / too-short snippets
 *  4. Relevance score  — compute a 0–1 score from topic keywords + source reliability
 *  5. Threshold filter — drop items scoring below 0.25
 *
 * This agent NEVER throws. Errors are captured and returned inside AgentResult.
 */

import { SOURCES } from '../config/sources';
import { getTopicsByIds } from '../config/topics';
import type { AgentResult, FilteredNewsItem, NewsItem } from '../types/index';
import { logger } from '../utils/logger';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours
const JACCARD_DUPLICATE_THRESHOLD = 0.6;
const MIN_SNIPPET_LENGTH = 50;
const MIN_RELEVANCE_SCORE = 0.25;

// Relevance scoring weights
const SCORE_TITLE_EXACT = 0.4;
const SCORE_SNIPPET_EXACT = 0.2;
const SCORE_TITLE_PARTIAL = 0.15;

// ─── Jaccard similarity ───────────────────────────────────────────────────────

/**
 * Compute Jaccard similarity between two strings based on their word sets.
 *
 * Mental test:
 *   a = "openai releases new model"  → {openai, releases, new, model}
 *   b = "openai launches new model"  → {openai, launches, new, model}
 *   intersection = {openai, new, model} = 3
 *   union        = {openai, releases, new, model, launches} = 5
 *   score = 3/5 = 0.6  → treated as duplicate ✓
 *
 *   a = "typescript 5.5 is out"    → {typescript, 5.5, is, out}
 *   b = "python 3.13 released"     → {python, 3.13, released}
 *   intersection = {} = 0
 *   union        = {typescript, 5.5, is, out, python, 3.13, released} = 7
 *   score = 0/7 = 0  → not a duplicate ✓
 */
function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));

  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionSize = 0;
  for (const word of setA) {
    if (setB.has(word)) intersectionSize++;
  }

  const unionSize = setA.size + setB.size - intersectionSize;
  return intersectionSize / unionSize;
}

// ─── Source reliability lookup ────────────────────────────────────────────────

/** Build a fast lookup map from source name → reliability coefficient. */
const SOURCE_RELIABILITY_MAP: Map<string, number> = new Map(
  SOURCES.map((s) => [s.name.toLowerCase(), s.reliability]),
);

/**
 * Retrieve the reliability coefficient for a news item's source.
 * Falls back to 0.5 when the source is not in the registry.
 */
function getSourceReliability(sourceName: string): number {
  return SOURCE_RELIABILITY_MAP.get(sourceName.toLowerCase()) ?? 0.5;
}

// ─── Step 1 — Age filter ──────────────────────────────────────────────────────

/**
 * Remove items published more than 48 hours ago.
 */
function applyAgeFilter(items: NewsItem[]): NewsItem[] {
  const cutoff = Date.now() - MAX_AGE_MS;
  return items.filter((item) => {
    const published = new Date(item.publishedAt).getTime();
    return !Number.isNaN(published) && published >= cutoff;
  });
}

// ─── Step 2 — Duplicate filter ────────────────────────────────────────────────

interface ItemWithDuplicateFlag extends NewsItem {
  isDuplicate: boolean;
}

/**
 * Mark URL-exact and title-similar duplicates.
 *
 * URL duplicates: keep first occurrence, flag the rest.
 * Title similarity: if two non-URL-duplicate items have Jaccard score > 0.6,
 * flag the one with the lower source reliability.
 */
function applyDuplicateFilter(items: NewsItem[]): ItemWithDuplicateFlag[] {
  // Step 2a — URL deduplication
  const seenUrls = new Set<string>();
  const afterUrlDedup: ItemWithDuplicateFlag[] = items.map((item) => {
    const normUrl = item.url.toLowerCase().replace(/\/$/, '');
    if (seenUrls.has(normUrl)) {
      return { ...item, isDuplicate: true };
    }
    seenUrls.add(normUrl);
    return { ...item, isDuplicate: false };
  });

  // Step 2b — Title similarity deduplication (only on URL-unique items)
  const unique = afterUrlDedup.filter((i) => !i.isDuplicate);

  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const a = unique[i];
      const b = unique[j];

      if (a.isDuplicate || b.isDuplicate) continue;

      const score = jaccardSimilarity(a.title, b.title);
      if (score > JACCARD_DUPLICATE_THRESHOLD) {
        // Keep the one with higher source reliability
        const relA = getSourceReliability(a.source);
        const relB = getSourceReliability(b.source);
        if (relA >= relB) {
          b.isDuplicate = true;
        } else {
          a.isDuplicate = true;
        }
      }
    }
  }

  return afterUrlDedup;
}

// ─── Step 3 — Quality filter ──────────────────────────────────────────────────

/**
 * Remove items whose snippet is too short to be useful.
 */
function applyQualityFilter(items: ItemWithDuplicateFlag[]): ItemWithDuplicateFlag[] {
  return items.filter((item) => item.snippet.trim().length >= MIN_SNIPPET_LENGTH);
}

// ─── Step 4 — Relevance scoring ───────────────────────────────────────────────

/**
 * Compute a relevance score in [0, 1] for a single item.
 *
 * Scoring matrix:
 *  +0.40  exact topic keyword found in title
 *  +0.20  exact topic keyword found in snippet
 *  +0.15  related/partial keyword found in title
 *  ×reliability  multiply raw total by source reliability (capped at 1.0)
 */
function computeRelevanceScore(item: NewsItem, userTopicIds: string[]): number {
  const topics = getTopicsByIds(userTopicIds);
  const titleLower = item.title.toLowerCase();
  const snippetLower = item.snippet.toLowerCase();

  let raw = 0;

  for (const topic of topics) {
    for (const term of topic.searchTerms) {
      const termLower = term.toLowerCase();
      if (titleLower.includes(termLower)) {
        raw += SCORE_TITLE_EXACT;
        break; // one match per term group is sufficient
      }
    }

    for (const term of topic.searchTerms) {
      const termLower = term.toLowerCase();
      if (snippetLower.includes(termLower)) {
        raw += SCORE_SNIPPET_EXACT;
        break;
      }
    }

    for (const term of topic.relatedTerms) {
      const termLower = term.toLowerCase();
      if (titleLower.includes(termLower)) {
        raw += SCORE_TITLE_PARTIAL;
        break;
      }
    }
  }

  const reliability = getSourceReliability(item.source);
  return Math.min(raw * reliability, 1.0);
}

// ─── Step 5 — Threshold filter ────────────────────────────────────────────────

/**
 * Remove items scoring below the minimum relevance threshold.
 */
function applyThresholdFilter(items: FilteredNewsItem[]): FilteredNewsItem[] {
  return items.filter((item) => item.relevanceScore >= MIN_RELEVANCE_SCORE);
}

// ─── Agent entry point ────────────────────────────────────────────────────────

/**
 * Run the Filter Agent on a batch of raw NewsItems.
 *
 * @param items        - Output of the Scraper Agent.
 * @param userTopicIds - User's selected topic slugs (used for relevance scoring).
 * @returns AgentResult containing the filtered, scored items.
 */
export async function runFilterAgent(
  items: NewsItem[],
  userTopicIds: string[],
): Promise<AgentResult<FilteredNewsItem[]>> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    const inputCount = items.length;

    // Step 1 — Age
    const afterAge = applyAgeFilter(items);
    logger.debug('Filter step 1 (age)', { before: inputCount, after: afterAge.length });

    // Step 2 — Duplicates
    const afterDuplicates = applyDuplicateFilter(afterAge);
    const afterDuplicatesUnique = afterDuplicates.filter((i) => !i.isDuplicate);
    logger.debug('Filter step 2 (duplicates)', {
      before: afterAge.length,
      after: afterDuplicatesUnique.length,
      duplicatesMarked: afterDuplicates.filter((i) => i.isDuplicate).length,
    });

    // Step 3 — Quality
    const afterQuality = applyQualityFilter(afterDuplicatesUnique);
    logger.debug('Filter step 3 (quality)', {
      before: afterDuplicatesUnique.length,
      after: afterQuality.length,
    });

    // Step 4 — Relevance scoring
    const scored: FilteredNewsItem[] = afterQuality.map((item) => ({
      ...item,
      relevanceScore: computeRelevanceScore(item, userTopicIds),
    }));

    // Step 5 — Threshold
    const afterThreshold = applyThresholdFilter(scored);
    logger.debug('Filter step 5 (threshold)', {
      before: scored.length,
      after: afterThreshold.length,
    });

    const duration = Date.now() - startTime;

    logger.info(
      `Filter agent: ${inputCount} items in → ${afterThreshold.length} items out`,
      { duration, inputCount, outputCount: afterThreshold.length },
    );

    return {
      success: true,
      data: afterThreshold,
      metadata: {
        duration,
        itemCount: afterThreshold.length,
        errors,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Fatal filter error: ${message}`);

    const duration = Date.now() - startTime;

    logger.error('Filter agent encountered a fatal error', { error: message, duration });

    return {
      success: false,
      data: [],
      metadata: {
        duration,
        itemCount: 0,
        errors,
      },
    };
  }
}
