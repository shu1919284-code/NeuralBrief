import pLimit from 'p-limit';

import { logger } from '../utils/logger.js';
import { geminiService } from '../services/gemini-service.js';

import type { FilteredNewsItem, DigestSection, AgentResult, SummarizedItem } from '../types/index.js';

const CONCURRENCY_LIMIT = 3;

/**
 * Groups an array of FilteredNewsItem objects by their topic field.
 */
function groupByTopic(items: FilteredNewsItem[]): Map<string, FilteredNewsItem[]> {
  const map = new Map<string, FilteredNewsItem[]>();

  for (const item of items) {
    const existing = map.get(item.topic) ?? [];
    existing.push(item);
    map.set(item.topic, existing);
  }

  return map;
}

/**
 * Counts the number of 'breaking' category items in a DigestSection.
 */
function countBreakingItems(section: DigestSection): number {
  return section.items.filter((item: SummarizedItem) => item.category === 'breaking').length;
}

/**
 * Builds a fallback DigestSection from raw article snippets.
 * Used when Gemini fails for an entire topic group.
 */
function buildFallbackSection(
  topic: string,
  articles: FilteredNewsItem[],
): DigestSection {
  return {
    topic,
    items: articles.map((a) => ({
      title: a.title,
      summary: a.snippet.slice(0, 150),
      url: a.url,
      source: a.source,
      category: 'general' as const,
    })),
  };
}

/**
 * Runs the Summary Agent — the third stage of the NeuralBrief pipeline.
 *
 * Takes filtered news items, groups them by topic, calls Gemini to produce
 * summarized DigestSections with concurrency control, and returns results sorted
 * so topics with the most 'breaking' content appear first.
 *
 * Guarantees a result even when all Gemini calls fail.
 *
 * @param items - Filtered news items from the Filter Agent
 * @returns AgentResult containing an array of DigestSections
 */
export async function runSummaryAgent(
  items: FilteredNewsItem[],
  userTopicIds: string[],
): Promise<AgentResult<DigestSection[]>> {
  const startTime = Date.now();
  const errors: string[] = [];

  logger.info(`SummaryAgent starting with ${items.length} items`);

  if (items.length === 0) {
    return {
      success: true,
      data: [],
      metadata: {
        duration: Date.now() - startTime,
        itemCount: 0,
        errors: [],
      },
    };
  }

  const topicGroups = groupByTopic(items);
  const topics = Array.from(topicGroups.keys());

  logger.info(`SummaryAgent processing ${topics.length} topic groups`);

  const limit = pLimit(CONCURRENCY_LIMIT);

  const sectionPromises = topics.map((topic) =>
    limit(async (): Promise<DigestSection> => {
      const group = topicGroups.get(topic)!;

      try {
        const section = await geminiService.summarizeBatch(group, topic);
        logger.info(
          `SummaryAgent: topic "${topic}" completed with ${section.items.length} items`,
        );
        return section;
      } catch (err) {
        const message = `Topic "${topic}" failed: ${String(err)}`;
        logger.error(`SummaryAgent: ${message}`);
        errors.push(message);

        // Always include the topic — never skip it
        return buildFallbackSection(topic, group);
      }
    }),
  );

  const sections = await Promise.all(sectionPromises);

  // Sort: topics with more breaking items appear first
  const sorted = sections.sort(
    (a, b) => countBreakingItems(b) - countBreakingItems(a),
  );

  const totalItems = sorted.reduce((sum, s) => sum + s.items.length, 0);
  const duration = Date.now() - startTime;
  const allFailed = errors.length === topics.length;

  if (allFailed) {
    logger.error('SummaryAgent: ALL Gemini calls failed — returning raw snippet fallbacks');
  }

  logger.info(
    `SummaryAgent completed in ${duration}ms — ${totalItems} items across ${sorted.length} topics`,
  );

  return {
    success: errors.length === 0,
    data: sorted,
    metadata: {
      duration,
      itemCount: totalItems,
      errors,
    },
  };
}