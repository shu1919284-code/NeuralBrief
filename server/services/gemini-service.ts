import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GenerativeModel } from '@google/generative-ai';

import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors';
import {
  buildSingleSummaryPrompt,
  buildBatchSummaryPrompt,
  buildCategorizationPrompt,
} from '../prompts/summary-prompt.js';

import type { FilteredNewsItem, DigestSection, SummarizedItem } from '../types/index.js';

const VALID_CATEGORIES = new Set<SummarizedItem['category']>([
  'breaking',
  'analysis',
  'release',
  'general',
]);

const MAX_REQUESTS_PER_SECOND = 10;
const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_BACKOFF_MS = 150;

/**
 * Splits a text block into its first two sentences as a fallback summary.
 */
function extractFallbackSummary(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  return sentences.slice(0, 2).join(' ').trim() || text.slice(0, 150);
}

/**
 * Wraps a FilteredNewsItem into a minimal DigestSection using raw snippet content.
 */
function buildFallbackSection(
  topic: string,
  articles: FilteredNewsItem[],
): DigestSection {
  return {
    topic,
    items: articles.map((a) => ({
      title: a.title,
      summary: extractFallbackSummary(a.snippet),
      url: a.url,
      source: a.source,
      category: 'general' as const,
    })),
  };
}

/**
 * GeminiService wraps the Gemini Flash API with rate limiting, structured JSON parsing,
 * and graceful fallbacks for all failure modes.
 */
class GeminiService {
  private readonly model: GenerativeModel;
  private requestTimestamps: number[] = [];

  constructor() {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      throw new AppError(500, 'GEMINI_API_KEY not configured');
    }

    const client = new GoogleGenerativeAI(apiKey);

    this.model = client.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });

    logger.info('GeminiService initialized');
  }

  /**
   * Rate limiter: ensures no more than MAX_REQUESTS_PER_SECOND calls are made
   * within any rolling 1-second window.
   */
  private async withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();

    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => now - ts < RATE_LIMIT_WINDOW_MS,
    );

    if (this.requestTimestamps.length >= MAX_REQUESTS_PER_SECOND) {
      await new Promise<void>((resolve) => setTimeout(resolve, RATE_LIMIT_BACKOFF_MS));
    }

    this.requestTimestamps.push(Date.now());
    return fn();
  }

  /**
   * Summarizes a single article using Gemini.
   * Falls back to the first 2 sentences of the snippet on any error.
   */
  async summarize(article: FilteredNewsItem): Promise<string> {
    try {
      const prompt = buildSingleSummaryPrompt(article);
      const result = await this.withRateLimit(() => this.model.generateContent(prompt));
      const text = result.response.text().trim();
      logger.debug(`Summarized article: ${article.id}`);
      return text;
    } catch (err) {
      logger.warn(`Gemini summarize failed for article ${article.id}: ${String(err)}`);
      return extractFallbackSummary(article.snippet);
    }
  }

  /**
   * Summarizes a batch of articles for a given topic.
   * Falls back to individual summarize() calls if JSON parsing fails.
   */
  async summarizeBatch(articles: FilteredNewsItem[], topic: string): Promise<DigestSection> {
    const prompt = buildBatchSummaryPrompt(articles, topic);
    let responseText = '';

    try {
      const result = await this.withRateLimit(() => this.model.generateContent(prompt));
      responseText = result.response.text().trim();

      const cleaned = responseText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned) as DigestSection;

      logger.info(`Batch summarized topic "${topic}": ${parsed.items?.length ?? 0} items`);
      return parsed;
    } catch (err) {
      logger.error(
        `Gemini batch summarize failed for topic "${topic}": ${String(err)}. ` +
          `Falling back to individual summarize calls.`,
      );

      const items: SummarizedItem[] = await Promise.all(
        articles.map(async (article) => {
          const summary = await this.summarize(article);
          return {
            title: article.title,
            summary,
            url: article.url,
            source: article.source,
            category: 'general' as const,
          };
        }),
      );

      return { topic, items };
    }
  }

  /**
   * Classifies an article into one of the four content categories using Gemini.
   * Returns 'general' on any error or unrecognized response.
   */
  async categorize(
    title: string,
    snippet: string,
  ): Promise<SummarizedItem['category']> {
    try {
      const prompt = buildCategorizationPrompt(title, snippet);
      const result = await this.withRateLimit(() => this.model.generateContent(prompt));
      const raw = result.response.text().trim().toLowerCase() as SummarizedItem['category'];

      if (VALID_CATEGORIES.has(raw)) {
        logger.debug(`Categorized "${title}" → ${raw}`);
        return raw;
      }

      logger.warn(`Gemini returned unrecognized category "${raw}" for "${title}"`);
      return 'general';
    } catch (err) {
      logger.warn(`Gemini categorize failed for "${title}": ${String(err)}`);
      return 'general';
    }
  }
}

export const geminiService = new GeminiService();
export type { GeminiService };