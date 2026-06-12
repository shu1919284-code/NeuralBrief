import type { FilteredNewsItem } from '../types/index.js';

/**
 * Builds a prompt for summarizing a single article with Gemini.
 * Instructs Gemini to return ONLY the summary text — no labels, no preamble.
 */
export function buildSingleSummaryPrompt(article: FilteredNewsItem): string {
  return `You are a concise tech journalist. Summarize the following article in EXACTLY 2–3 sentences.

Rules:
- Focus strictly on: what happened, why it matters, and who is affected.
- No marketing language, no fluff, no phrases like "this article discusses..." or "in this piece...".
- Write in plain, direct, informative prose.
- Output ONLY the summary text. No labels, no preamble, no formatting.

Article title: ${article.title}
Source: ${article.source}
Published: ${article.publishedAt}
Content: ${article.snippet}
URL: ${article.url}`;
}

/**
 * Builds a batch summarization prompt for a group of articles on the same topic.
 * Instructs Gemini to select the most newsworthy items and return structured JSON only.
 */
export function buildBatchSummaryPrompt(articles: FilteredNewsItem[], topic: string): string {
  const articlesJson = JSON.stringify(
    articles.map((a) => ({
      title: a.title,
      url: a.url,
      source: a.source,
      snippet: a.snippet,
      publishedAt: a.publishedAt,
    })),
    null,
    2,
  );

  return `You are a senior tech editor building a daily news digest for the topic: "${topic}".

You are given a list of articles below. Your job:
1. Select the 3–5 most newsworthy, distinct, and impactful articles.
2. For each selected article, write a 2-sentence summary.
3. Classify each article as exactly one of: breaking, analysis, release, general.
   - breaking: major announcements, launches, outages, urgent security issues
   - analysis: explanatory pieces, deep dives, opinion, guides
   - release: software versions, product updates, changelogs
   - general: everything else

Rules:
- No marketing language, no fluff.
- Summaries must be factual and direct — what happened, why it matters.
- Respond with ONLY valid JSON in the exact format below. No text before or after the JSON.
- Do not wrap in markdown code blocks.

Required JSON format:
{
  "topic": "${topic}",
  "items": [
    {
      "title": "string",
      "summary": "string",
      "url": "string",
      "source": "string",
      "category": "breaking" | "analysis" | "release" | "general"
    }
  ]
}

Articles:
${articlesJson}`;
}

/**
 * Builds a prompt for classifying a single article into a content category.
 * Instructs Gemini to respond with ONLY one of the four valid category words.
 */
export function buildCategorizationPrompt(title: string, snippet: string): string {
  return `Classify the following tech news article into exactly one category.

Categories:
- breaking: major announcements, product launches, security incidents, outages
- analysis: explanatory articles, deep dives, opinion, guides, breakdowns
- release: software versions, product updates, changelogs, new features shipped
- general: news that does not clearly fit the above categories

Article title: ${title}
Article snippet: ${snippet}

Respond with ONLY one word — the category name. No punctuation, no explanation.`;
}
