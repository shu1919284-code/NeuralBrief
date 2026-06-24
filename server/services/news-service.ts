/**
 * NeuralBrief news service.
 *
 * Provides low-level fetch functions for each source type (RSS, HN API,
 * GitHub scrape) and a high-level `fetchAllForUser` aggregator that fans out
 * across every relevant source for a user's selected topics.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { XMLParser } from 'fast-xml-parser';
import { nanoid } from 'nanoid';

import { getSourcesForTopics, type NewsSource } from '../config/sources';
import { getTopicsByIds } from '../config/topics';
import type { NewsItem } from '../types/index';
import { logger } from '../utils/logger';

// ─── Constants ───────────────────────────────────────────────────────────────

const SNIPPET_MAX_LENGTH = 500;
const HTTP_TIMEOUT_MS = 10_000;
const HN_HITS_PER_PAGE = 20;

// ─── XML parser (shared, stateless) ──────────────────────────────────────────

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: '__cdata',
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Truncate a string to at most `max` characters, appending "…" when trimmed.
 */
function truncate(text: string, max: number): string {
  const clean = text.trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

/**
 * Normalise any date-like value to an ISO 8601 string.
 * Falls back to the current timestamp when parsing fails.
 */
function toIso(raw: unknown): string {
  if (typeof raw === 'string' || typeof raw === 'number') {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

/**
 * Safely extract a plain-text snippet from a value that may be an HTML string,
 * a CDATA object, or a plain string.
 */
function extractSnippet(raw: unknown): string {
  if (!raw) return '';

  let text: string;

  if (typeof raw === 'object' && raw !== null && '__cdata' in raw) {
    text = String((raw as Record<string, unknown>)['__cdata'] ?? '');
  } else {
    text = String(raw);
  }

  // Strip HTML tags for clean plain-text snippets
  const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  return truncate(stripped, SNIPPET_MAX_LENGTH);
}

function extractChangelogEntries(entry: Record<string, unknown>): string[] {
  let html = '';

  const extractHtml = (val: unknown): string => {
    if (!val) return '';
    if (typeof val === 'object' && val !== null && '__cdata' in val) {
      return String((val as Record<string, unknown>)['__cdata'] ?? '');
    }
    return String(val);
  };

  html =
    extractHtml(entry['content']) ||
    extractHtml(entry['description']) ||
    extractHtml(entry['summary']) ||
    '';
  if (!html) return [];

  const $ = cheerio.load(html);
  const mdEntries: string[] = [];

  // Convert <a> tags to markdown format [text](url) inside list elements or body
  $('li, p, div').each((_, el) => {
    $(el).find('a').each((_, aEl) => {
      const a = $(aEl);
      const text = a.text().trim();
      const href = a.attr('href')?.trim();
      if (text && href) {
        a.replaceWith(`[${text}](${href})`);
      }
    });
  });

  // 1. Try to find all list items (li)
  $('li').each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      mdEntries.push(text.slice(0, 300));
    }
  });

  // 2. If no li's, try to split raw text by newlines and find list patterns
  if (mdEntries.length === 0) {
    const rawText = $.text();
    const lines = rawText.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^[-*+•\d+\.]\s+/.test(trimmed)) {
        const clean = trimmed.replace(/^[-*+•\d+\.]\s+/, '').trim();
        if (clean) {
          mdEntries.push(clean.slice(0, 300));
        }
      }
    }
  }

  return mdEntries.slice(0, 15);
}

// ─── RSS / Atom ───────────────────────────────────────────────────────────────

/**
 * Fetch and parse an RSS 2.0 or Atom feed for the given source.
 * Maps feed entries to the canonical NewsItem shape.
 */
export async function fetchRSSFeed(source: NewsSource): Promise<NewsItem[]> {
  const isArxiv = source.url.includes('arxiv.org');
  const timeoutMs = isArxiv ? 25_000 : HTTP_TIMEOUT_MS;
  const maxAttempts = 2; // initial try + 1 retry

  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      const response = await axios.get<string>(source.url, {
        timeout: timeoutMs,
        headers: { 'User-Agent': 'NeuralBrief/1.0 (+https://neuralbrief.app)' },
        responseType: 'text',
      });

      const parsed: unknown = xmlParser.parse(response.data);
      if (typeof parsed !== 'object' || parsed === null) return [];

      const doc = parsed as Record<string, unknown>;

      // Detect feed format: RSS 2.0 wraps items in rss.channel.item;
      // Atom wraps entries in feed.entry.
      type RawEntry = Record<string, unknown>;

      let rawEntries: RawEntry[] = [];
      let feedTitle = source.name;

      if ('rss' in doc) {
        const channel = (doc['rss'] as Record<string, unknown>)['channel'] as
          | Record<string, unknown>
          | undefined;
        if (!channel) return [];
        feedTitle = String(channel['title'] ?? source.name);
        const items = channel['item'];
        rawEntries = Array.isArray(items) ? items : items ? [items as RawEntry] : [];
      } else if ('feed' in doc) {
        const feed = doc['feed'] as Record<string, unknown>;
        feedTitle = String(feed['title'] ?? source.name);
        const entries = feed['entry'];
        rawEntries = Array.isArray(entries)
          ? entries
          : entries
            ? [entries as RawEntry]
            : [];
      }

      const items: NewsItem[] = rawEntries
        .slice(0, source.maxItemsPerFetch)
        .map((entry): NewsItem | null => {
          // URL: RSS uses <link>, Atom uses <link href="…">
          const rawLink =
            typeof entry['link'] === 'string'
              ? entry['link']
              : (entry['link'] as Record<string, unknown> | undefined)?.['@_href'];
          const url: string = typeof rawLink === 'string' ? rawLink.trim() : '';
          if (!url) return null;

          const title = String(entry['title'] ?? '').replace(/<[^>]+>/g, '').trim();
          if (!title) return null;

          const snippet =
            extractSnippet(entry['description']) ||
            extractSnippet(entry['summary']) ||
            extractSnippet(entry['content']) ||
            '';

          const publishedAt =
            toIso(entry['pubDate']) ||
            toIso(entry['published']) ||
            toIso(entry['updated']);

          const changelogEntries = extractChangelogEntries(entry);

          return {
            id: nanoid(),
            title,
            url,
            source: feedTitle,
            topic: source.topicIds[0] ?? '',
            publishedAt,
            snippet,
            changelogEntries,
            fetchType: 'latest',
          };
        })
        .filter((item): item is NewsItem => item !== null);

      logger.info(`RSS fetch complete`, { sourceId: source.id, count: items.length });
      return items;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (attempt < maxAttempts) {
        logger.warn(`RSS fetch attempt ${attempt} failed for source "${source.id}". Retrying...`, { error: message });
        // Wait 500ms before retry
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      logger.error(`RSS fetch failed for source "${source.id}" after ${maxAttempts} attempts`, { error: message });
      throw err; // re-throw on final failure
    }
  }
  return []; // fallback, should not be reached
}

// ─── Hacker News (Algolia API) ────────────────────────────────────────────────

interface HNHit {
  objectID: string;
  title?: string;
  story_title?: string;
  url?: string;
  story_url?: string;
  _tags?: string[];
  created_at?: string;
  story_text?: string;
  comment_text?: string;
  author?: string;
  points?: number;
}

interface HNResponse {
  hits: HNHit[];
}

/**
 * Search Hacker News via the Algolia API using the search terms from the
 * user's selected topics.
 */
export async function fetchHackerNews(topicIds: string[]): Promise<NewsItem[]> {
  try {
    const topics = getTopicsByIds(topicIds);
    const query = topics
      .flatMap((t) => t.searchTerms)
      .slice(0, 5) // keep URL short
      .join(' ');

    const [popularResponse, latestResponse] = await Promise.all([
      axios.get<HNResponse>('https://hn.algolia.com/api/v1/search', {
        params: { tags: 'story', query, hitsPerPage: HN_HITS_PER_PAGE },
        timeout: HTTP_TIMEOUT_MS,
      }),
      axios.get<HNResponse>('https://hn.algolia.com/api/v1/search_by_date', {
        params: { tags: 'story', query, hitsPerPage: HN_HITS_PER_PAGE },
        timeout: HTTP_TIMEOUT_MS,
      })
    ]);

    const processHits = (hits: HNHit[], fetchType: 'latest' | 'popular'): NewsItem[] => {
      return hits
        .filter((hit) => !!(hit.url ?? hit.story_url))
        .map((hit): NewsItem => {
          const title = String(hit.title ?? hit.story_title ?? '').trim();
          const url = String(hit.url ?? hit.story_url ?? '').trim();
          const snippet = truncate(
            String(hit.story_text ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '),
            SNIPPET_MAX_LENGTH,
          );

          return {
            id: nanoid(),
            title,
            url,
            source: 'Hacker News',
            topic: topicIds[0] ?? 'programming',
            publishedAt: toIso(hit.created_at),
            snippet,
            fetchType
          };
        })
        .filter((item) => item.title.length > 0 && item.url.length > 0);
    };

    const items: NewsItem[] = [
      ...processHits(popularResponse.data.hits, 'popular'),
      ...processHits(latestResponse.data.hits, 'latest')
    ];

    logger.info('Hacker News fetch complete', { count: items.length });
    return items;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Hacker News fetch failed', { error: message });
    throw err;
  }
}

// ─── GitHub Trending ──────────────────────────────────────────────────────────

/**
 * Scrape GitHub Trending and map each repository to a NewsItem.
 * @param language - Optional language filter (e.g. "typescript").
 */
export async function fetchGitHubTrending(language?: string): Promise<NewsItem[]> {
  try {
    const url = language
      ? `https://github.com/trending/${encodeURIComponent(language)}`
      : 'https://github.com/trending';

    const response = await axios.get<string>(url, {
      timeout: HTTP_TIMEOUT_MS,
      headers: { 'User-Agent': 'NeuralBrief/1.0 (+https://neuralbrief.app)' },
      responseType: 'text',
    });

    const $ = cheerio.load(response.data);
    const items: NewsItem[] = [];

    $('article.Box-row').each((_i, el) => {
      const repoPath = $(el).find('h2 a').attr('href')?.trim() ?? '';
      if (!repoPath) return;

      const repoUrl = `https://github.com${repoPath}`;
      const repoName = repoPath.replace(/^\//, '').replace(/\//g, ' / ');

      const descriptionRaw = $(el).find('p').first().text().trim();
      const snippet = truncate(descriptionRaw || `Trending GitHub repository: ${repoName}`, SNIPPET_MAX_LENGTH);

      const starsText = $(el)
        .find('[aria-label*="star"]')
        .first()
        .text()
        .trim()
        .replace(/,/g, '');
      const repoLanguage = $(el).find('[itemprop="programmingLanguage"]').text().trim();

      const starsSuffix = starsText ? ` · ⭐ ${starsText} stars` : '';
      const langSuffix = repoLanguage ? ` · ${repoLanguage}` : '';

      items.push({
        id: nanoid(),
        title: `${repoName}${langSuffix}${starsSuffix}`,
        url: repoUrl,
        source: 'GitHub Trending',
        topic: 'programming',
        publishedAt: new Date().toISOString(),
        snippet,
        fetchType: 'latest'
      });
    });

    logger.info('GitHub Trending fetch complete', { count: items.length });
    return items;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('GitHub Trending fetch failed', { error: message });
    throw err;
  }
}

// ─── Deduplication ────────────────────────────────────────────────────────────

/**
 * Remove items with duplicate URLs, keeping the first occurrence.
 */
export function deduplicateByUrl(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalised = item.url.toLowerCase().replace(/\/$/, '');
    if (seen.has(normalised)) return false;
    seen.add(normalised);
    return true;
  });
}

// ─── Aggregator ───────────────────────────────────────────────────────────────

/**
 * Fetch news from all sources relevant to the user's topic list.
 *
 * - Uses Promise.allSettled so one failing source never aborts the pipeline.
 * - Deduplicates by URL before returning.
 * - Logs failures per source without re-throwing.
 */
export async function fetchAllForUser(userTopicIds: string[]): Promise<NewsItem[]> {
  const sources = getSourcesForTopics(userTopicIds);

  const fetchTasks: Promise<NewsItem[]>[] = sources.map((source) => {
    switch (source.type) {
      case 'rss':
        return fetchRSSFeed(source);
      case 'api':
        // Currently only Hacker News — pass the source's topic IDs
        return fetchHackerNews(source.topicIds.filter((id) => userTopicIds.includes(id)));
      case 'scrape':
        // Currently only GitHub Trending
        return fetchGitHubTrending();
      default: {
        // Exhaustive check — TypeScript will error if a new type is added
        const _exhaustive: never = source.type;
        return Promise.resolve([]) as Promise<NewsItem[]>;
        void _exhaustive;
      }
    }
  });

  const results = await Promise.allSettled(fetchTasks);

  const allItems: NewsItem[] = [];
  const failedSources: string[] = [];

  results.forEach((result, index) => {
    const source = sources[index];
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    } else {
      const reason =
        result.reason instanceof Error ? result.reason.message : String(result.reason);
      logger.warn(`Source "${source?.id}" failed — skipping`, { reason });
      failedSources.push(source?.id ?? `source[${index}]`);
    }
  });

  if (failedSources.length > 0) {
    logger.warn('Some sources failed during fetchAllForUser', { failedSources });
  }

  // Sort by publishedAt descending (latest first)
  allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const deduplicated = deduplicateByUrl(allItems);

  logger.info('fetchAllForUser complete', {
    totalSources: sources.length,
    failedSources: failedSources.length,
    rawItems: allItems.length,
    afterDedup: deduplicated.length,
  });

  return deduplicated;
}
