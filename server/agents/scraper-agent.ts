/**
 * NeuralBrief Scraper Agent — Stage 1 of the agent pipeline.
 *
 * Fans out across all news sources relevant to a user's selected topics,
 * collects raw NewsItems, and wraps the result in an AgentResult envelope.
 *
 * This agent NEVER throws. Any fatal error is caught and returned as a
 * failed AgentResult so the caller can decide how to proceed.
 */

import { fetchAllForUser } from '../services/news-service';
import type { AgentResult, NewsItem } from '../types/index';
import { logger } from '../utils/logger';

/**
 * Run the Scraper Agent for a given set of user-selected topic IDs.
 *
 * @param userTopicIds - Array of topic slugs the user has subscribed to.
 * @returns An AgentResult containing all fetched NewsItems (deduplicated by URL)
 *          plus metadata about the run duration and any per-source errors.
 */
export async function runScraperAgent(
  userTopicIds: string[],
): Promise<AgentResult<NewsItem[]>> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    const items = await fetchAllForUser(userTopicIds);

    const duration = Date.now() - startTime;

    logger.info(`Scraper agent completed: ${items.length} items from ${userTopicIds.length} topics`, {
      duration,
      itemCount: items.length,
      topicCount: userTopicIds.length,
    });

    return {
      success: true,
      data: items,
      metadata: {
        duration,
        itemCount: items.length,
        errors,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Fatal scraper error: ${message}`);

    const duration = Date.now() - startTime;

    logger.error('Scraper agent encountered a fatal error', { error: message, duration });

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
