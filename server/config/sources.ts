/**
 * NeuralBrief news source registry.
 *
 * Defines every external data source the Scraper Agent can pull from,
 * together with the topic IDs each source covers and a reliability
 * coefficient (0–1) used downstream by the Filter Agent for relevance scoring.
 */

export interface NewsSource {
  /** Unique slug for this source (used in logs and deduplication). */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** Fetch strategy. */
  type: 'rss' | 'api' | 'scrape';
  /** RSS feed URL, API base URL, or scrape target URL. */
  url: string;
  /** Topic IDs this source is relevant to. */
  topicIds: string[];
  /** Source reliability coefficient 0–1 (multiplied into relevance scores). */
  reliability: number;
  /** Maximum number of items to accept per fetch run. */
  maxItemsPerFetch: number;
}

export const SOURCES: NewsSource[] = [
  // ─── RSS FEEDS ──────────────────────────────────────────────────────────────
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    type: 'rss',
    url: 'https://techcrunch.com/feed/',
    topicIds: ['ai-companies', 'cloud', 'ai_industry', 'model_releases', 'agentic_ai'],
    reliability: 0.85,
    maxItemsPerFetch: 20,
  },
  {
    id: 'venturebeat-ai',
    name: 'VentureBeat AI',
    type: 'rss',
    url: 'https://venturebeat.com/ai/feed/',
    topicIds: ['ai-companies', 'machine_learning', 'ai_research', 'model_releases', 'ai_industry'],
    reliability: 0.82,
    maxItemsPerFetch: 20,
  },
  {
    id: 'the-verge',
    name: 'The Verge',
    type: 'rss',
    url: 'https://www.theverge.com/rss/index.xml',
    topicIds: ['ai', 'cloud'],
    reliability: 0.8,
    maxItemsPerFetch: 20,
  },
  {
    id: 'ars-technica',
    name: 'Ars Technica',
    type: 'rss',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    topicIds: [
      'ai', 'cloud', 'security', 'devops', 'programming', 'ai-research', 'ai-companies',
      'data_science', 'machine_learning', 'ai_research', 'agentic_ai', 'mlops',
      'model_releases', 'ai_industry',
    ],
    reliability: 0.88,
    maxItemsPerFetch: 25,
  },
  {
    id: 'krebs-on-security',
    name: 'Krebs on Security',
    type: 'rss',
    url: 'https://krebsonsecurity.com/feed/',
    topicIds: ['security'],
    reliability: 0.95,
    maxItemsPerFetch: 15,
  },
  {
    id: 'dark-reading',
    name: 'Dark Reading',
    type: 'rss',
    url: 'https://www.darkreading.com/rss.xml',
    topicIds: ['security'],
    reliability: 0.85,
    maxItemsPerFetch: 20,
  },
  {
    id: 'kubernetes-blog',
    name: 'Kubernetes Blog',
    type: 'rss',
    url: 'https://kubernetes.io/feed.xml',
    topicIds: ['devops'],
    reliability: 0.92,
    maxItemsPerFetch: 10,
  },
  {
    id: 'openai-blog',
    name: 'OpenAI Blog',
    type: 'rss',
    url: 'https://openai.com/blog/rss.xml',
    topicIds: ['openai', 'model_releases', 'agentic_ai', 'ai_industry'],
    reliability: 0.95,
    maxItemsPerFetch: 10,
  },
  {
    id: 'anthropic-news',
    name: 'Anthropic News',
    type: 'rss',
    url: 'https://www.anthropic.com/news/rss',
    topicIds: ['anthropic'],
    reliability: 0.95,
    maxItemsPerFetch: 10,
  },
  {
    id: 'google-ai-blog',
    name: 'Google AI Blog',
    type: 'rss',
    url: 'https://blog.google/technology/ai/rss/',
    topicIds: ['google-deepmind', 'model_releases', 'ai_research', 'ai_industry'],
    reliability: 0.9,
    maxItemsPerFetch: 15,
  },
  {
    id: 'arxiv-cs-ai',
    name: 'ArXiv cs.AI',
    type: 'rss',
    url: 'https://arxiv.org/rss/cs.AI',
    topicIds: ['ai-research', 'ai_research', 'machine_learning', 'data_science'],
    reliability: 0.9,
    maxItemsPerFetch: 30,
  },
  {
    id: 'reddit-ml',
    name: 'Reddit r/MachineLearning',
    type: 'rss',
    url: 'https://www.reddit.com/r/MachineLearning/.rss',
    topicIds: ['ai', 'machine_learning', 'data_science'],
    reliability: 0.65,
    maxItemsPerFetch: 20,
  },

  {
    id: 'towards-data-science',
    name: 'Towards Data Science',
    type: 'rss',
    url: 'https://towardsdatascience.com/feed',
    topicIds: ['data_science', 'machine_learning', 'mlops'],
    reliability: 0.82,
    maxItemsPerFetch: 20,
  },
  {
    id: 'huggingface-blog',
    name: 'Hugging Face Blog',
    type: 'rss',
    url: 'https://huggingface.co/blog/feed.xml',
    topicIds: ['machine_learning', 'ai_research', 'model_releases', 'agentic_ai'],
    reliability: 0.92,
    maxItemsPerFetch: 15,
  },
  {
    id: 'ml-mastery',
    name: 'ML Mastery',
    type: 'rss',
    url: 'https://machinelearningmastery.com/feed/',
    topicIds: ['machine_learning', 'data_science'],
    reliability: 0.78,
    maxItemsPerFetch: 15,
  },

  // ─── API SOURCES ─────────────────────────────────────────────────────────────
  {
    id: 'hacker-news',
    name: 'Hacker News',
    type: 'api',
    url: 'https://hn.algolia.com/api/v1/search',
    topicIds: ['programming', 'devops', 'mlops', 'tools_libraries'],
    reliability: 0.75,
    maxItemsPerFetch: 20,
  },

  // ─── SCRAPE SOURCES ───────────────────────────────────────────────────────────
  {
    id: 'github-trending',
    name: 'GitHub Trending',
    type: 'scrape',
    url: 'https://github.com/trending',
    topicIds: ['programming', 'devops', 'mlops', 'tools_libraries', 'agentic_ai'],
    reliability: 0.7,
    maxItemsPerFetch: 25,
  },
];

/**
 * Return all sources that cover at least one of the supplied topic IDs.
 * Deduplicates by source id so a multi-topic source is returned only once.
 */
export function getSourcesByTopicId(topicId: string): NewsSource[] {
  return SOURCES.filter((source) => source.topicIds.includes(topicId));
}

/**
 * Return deduplicated sources for a set of topic IDs.
 * Useful when a caller wants all sources for a user's full topic list.
 */
export function getSourcesForTopics(topicIds: string[]): NewsSource[] {
  const seen = new Set<string>();
  const results: NewsSource[] = [];

  for (const topicId of topicIds) {
    for (const source of getSourcesByTopicId(topicId)) {
      if (!seen.has(source.id)) {
        seen.add(source.id);
        results.push(source);
      }
    }
  }

  return results;
}