/**
 * Digest routes — fetch, history, and manual trigger.
 * All routes require a valid Firebase ID token.
 */

import { Router } from 'express';
import type { Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pLimit from 'p-limit';

import { authMiddleware } from '../middleware/auth';
import type { RequestWithUser } from '../middleware/auth';
import { AppError, successResponse, errorResponse } from '../types';
import type { DigestPayload } from '../types';
import { logger } from '../utils/logger';
import { runPipelineForUser } from '../cron';
import { fetchAllForUser } from '../services/news-service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const CACHE_FILE = path.join(__dirname, '..', 'data', 'briefing_cache.json');

// Memory cache
let globalBriefingCache: Record<string, { generatedAt: string; data: any }> = {};

// Load cache from file if exists
const loadFileCache = () => {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8');
      globalBriefingCache = JSON.parse(raw);
    }
  } catch (err) {
    logger.warn('Failed to load local briefing file cache', { error: String(err) });
  }
};

const saveFileCache = () => {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(globalBriefingCache, null, 2), 'utf8');
  } catch (err) {
    logger.warn('Failed to write local briefing file cache', { error: String(err) });
  }
};

// Initial load
loadFileCache();

export interface LLMConfig {
  apiKey: string;
  url: string;
  model: string;
}

const buildLLMConfig = (key: string): LLMConfig => {
  if (key.startsWith('sk-or')) {
    return {
      apiKey: key,
      url: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'meta-llama/llama-3.3-70b-instruct'
    };
  }
  return {
    apiKey: key,
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile'
  };
};

/**
 * Resolve the API config for a given section.
 * If the specific key is missing, it divides backup keys among 2 domains each.
 */
let fallbackIndex = 0;

const resolveApiKey = (sectionEnvVar: string): LLMConfig | undefined => {
  if (process.env[sectionEnvVar]) {
    return buildLLMConfig(process.env[sectionEnvVar]);
  }

  // Collect all available fallback keys
  const fallbacks = [
    process.env.GROQ_API_KEY_BACKUP_1,
    process.env.GROQ_API_KEY_BACKUP_2,
    process.env.GROQ_API_KEY_BACKUP_3,
    process.env.GROQ_API_KEY_BACKUP_4,
    process.env.GROQ_API_KEY_BACKUP_5,
    process.env.OPENROUTER_API_KEY_BACKUP_1,
    process.env.OPENROUTER_API_KEY_BACKUP_2,
    process.env.GROQ_API_KEY
  ].filter(Boolean) as string[];

  if (fallbacks.length === 0) return undefined;

  // Use each backup key for exactly 2 domains
  const keyIndex = Math.floor(fallbackIndex / 2) % fallbacks.length;
  const key = fallbacks[keyIndex];
  fallbackIndex++;
  
  return buildLLMConfig(key);
};

const getCachedBriefing = async (key: string): Promise<any | null> => {
  // Check memory / file cache first
  let cached = globalBriefingCache[key];

  // Try Firestore next
  try {
    const db = getFirestore();
    const docRef = db.collection('system_briefings').doc(key);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const fsData = docSnap.data() as { generatedAt: string; data: any };
      if (fsData && fsData.generatedAt) {
        if (!cached || new Date(fsData.generatedAt).getTime() > new Date(cached.generatedAt).getTime()) {
          globalBriefingCache[key] = fsData;
          saveFileCache();
          cached = fsData;
        }
      }
    }
  } catch (err) {
    logger.warn(`Failed to read cache for ${key} from Firestore. Falling back to local file cache.`, { error: String(err) });
  }

  if (cached && cached.generatedAt) {
    const ageMs = Date.now() - new Date(cached.generatedAt).getTime();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    if (ageMs < oneWeekMs) {
      logger.info(`Serving cached briefing for ${key}`, { ageMs, generatedAt: cached.generatedAt });
      if (key === 'domains') {
        const domains = (cached.data.domains || []).map((dom: any) => ({
          ...dom,
          generatedAt: dom.generatedAt || cached.generatedAt
        }));
        return { domains };
      }
      return { ...cached.data, generatedAt: cached.generatedAt };
    }
  }
  return null;
};

const setCachedBriefing = async (key: string, data: any): Promise<void> => {
  const entry = {
    generatedAt: new Date().toISOString(),
    data
  };
  globalBriefingCache[key] = entry;
  saveFileCache();

  try {
    const db = getFirestore();
    await db.collection('system_briefings').doc(key).set(entry);
    logger.info(`Saved briefing cache for ${key} to Firestore`);
  } catch (err) {
    logger.warn(`Failed to write cache for ${key} to Firestore`, { error: String(err) });
  }
};

/**
 * Sanitize literal control characters inside JSON string values.
 * Prevents JSON.parse from failing on unescaped newlines/tabs in LLM output.
 */
const sanitizeJsonContent = (content: string): string => {
  // Extract the JSON block using bounding braces
  const startIdx = content.indexOf('{');
  const endIdx = content.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    content = content.substring(startIdx, endIdx + 1);
  }

  let sanitized = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"' && !escaped) {
      inString = !inString;
    }
    if (inString && char.charCodeAt(0) < 32) {
      if (char === '\n' || char === '\r') {
        sanitized += '\\n';
      } else if (char === '\t') {
        sanitized += '\\t';
      }
      // Skip other control chars
    } else {
      sanitized += char;
    }
    escaped = (char === '\\' && !escaped);
  }
  return sanitized;
};

// ─── GET /api/briefing/latest ──────────────────────────────────────────────────

function mapConfigIdToTopicId(configId: string): string {
  if (configId === 'agentic-frameworks') return 'agentic_ai';
  return configId.replace(/-/g, '_');
}

export const handleLatestBriefing = async (req: any, res: Response): Promise<void> => {
  try {
    const force = req.query.force === 'true';
    if (!force) {
      const cached = await getCachedBriefing('latest');
      if (cached) {
        res.json(cached);
        return;
      }
    }

    const llmConfig = resolveApiKey('GROQ_API_KEY_LATEST');
    if (!llmConfig) {
      res.status(500).json({ error: 'No API key available for latest briefing' });
      return;
    }

    // Fetch real-time items for the latest core topics
    const latestTopics = ['ai_research', 'machine_learning', 'agentic_ai', 'model_releases'];
    let items: any[] = [];
    try {
      items = await fetchAllForUser(latestTopics);
    } catch (err) {
      logger.warn('Failed to fetch real-time items for latest briefing. Using knowledge base fallback.', { error: String(err) });
    }

    const articlesPromptInput = items.map(item => {
      const bulletText = item.changelogEntries && item.changelogEntries.length > 0 
        ? '\nChangelog/Release Entries:\n' + item.changelogEntries.map((e: string) => `- ${e}`).join('\n')
        : '';
      return `Title: ${item.title}\nSource: ${item.source}\nURL: ${item.url}\nSummary: ${item.snippet}${bulletText}`;
    }).join('\n\n---\n\n');

    const systemPrompt = `You are a senior tech news and systems analyst. Your job is to analyze the provided recent developments and write a grounded, fact-based technical report.

Return ONLY a raw JSON object with NO markdown, NO code fences, and NO extra text.

Schema:
{
  "title": "string (a highly specific, technical title)",
  "source": "string (the primary research source or venue, e.g., arXiv cs.LG, OpenAI Research)",
  "confidence": number (a float value between 0.0 and 1.0),
  "summary": "string (a concise 1-2 sentence preview summary of the development)",
  "detailedAnalysis": "string (a grounded technical analysis of the real articles/research. Use simple inline markdown for bold (**text**) and links ([text](url)) if present in the sources.
  
  Structure:
  1. WHAT CHANGED / KEY CONTRIBUTIONS: List each key entry or update, explained in 1-2 plain sentences each as a bullet point. Include source PR/issue links in markdown format if present in the source text. If the input contains raw prose (like arXiv abstracts or standard news/research text) rather than structured list items (or if 'Changelog/Release Entries' is empty/absent), explain the core research contributions/arguments from the prose in plain, honest language under this section, without fabricating lists of release changelogs.
  2. WHY IT MATTERS: The practical impact of these changes (only if directly inferable from the source material, do not invent).
  3. WHO THIS AFFECTS: A short paragraph on which workflows or use-cases are touched by this update, based only on the sources given.
  
  Rules:
  - If the source articles lack structured list items or changelog entries (e.g. arXiv abstracts or prose descriptions), do NOT fabricate version numbers, updates, or lists of release changes to fill the 'WHAT CHANGED / KEY CONTRIBUTIONS' section. Instead, explain the actual core technical concepts and arguments presented in the source's prose in plain language, keeping it strictly honest to the text.
  - Do NOT invent metrics, benchmarks, ablation studies, or comparisons not present in the source.
  - If the source does not mention a performance number, do not state one.
  - Do not pad with generic industry commentary.
  - If no articles are provided in the prompt, synthesize a grounded technical update based on real, known developments in AI from the last 7 days.
  - Escape double newlines as \\n\\n inside the string value)",
  "keyPoints": [
    { "heading": "string (short heading)", "text": "string (detailed description of this point)" },
    { "heading": "string", "text": "string" },
    { "heading": "string", "text": "string" }
  ]
}`;

    const requestPayload: any = {
      model: llmConfig.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Analyze these recent developments and summarize the most significant AI model release, framework breakthrough, or foundation model research paper from the last 7 days. Provide a deep technical analysis.\n\nRecent Articles:\n${articlesPromptInput || 'No recent articles available.'}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2200,
    };
    
    // Only groq strictly requires json_object type format flag consistently, but Llama-3-70b-instruct on OpenRouter supports it well enough
    requestPayload.response_format = { type: 'json_object' };

    const response = await axios.post(
      llmConfig.url,
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmConfig.apiKey}`,
          ...(llmConfig.url.includes('openrouter') ? { 'HTTP-Referer': 'https://neuralbrief.app', 'X-Title': 'NeuralBrief' } : {})
        }
      }
    );

    const content = response.data?.choices?.[0]?.message?.content || '';
    const sanitized = sanitizeJsonContent(content);
    const parsed = JSON.parse(sanitized);

    // Validate shape
    if (
      typeof parsed.title !== 'string' ||
      typeof parsed.source !== 'string' ||
      typeof parsed.confidence !== 'number' ||
      typeof parsed.summary !== 'string' ||
      typeof parsed.detailedAnalysis !== 'string' ||
      !Array.isArray(parsed.keyPoints) ||
      parsed.keyPoints.some((kp: any) => !kp || typeof kp.heading !== 'string' || typeof kp.text !== 'string')
    ) {
      res.status(500).json({ error: 'Invalid response shape from Groq API' });
      return;
    }

    const generatedAt = new Date().toISOString();
    await setCachedBriefing('latest', parsed);
    res.json({ ...parsed, generatedAt });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};

// ─── Domain-specific prompts ───────────────────────────────────────────────────

interface DomainConfig {
  id: string;
  title: string;
  envKey: string;
}

const DOMAIN_CONFIGS: DomainConfig[] = [
  { id: 'data-science', title: 'Data Science', envKey: 'GROQ_API_KEY_DATA_SCIENCE' },
  { id: 'machine-learning', title: 'Machine Learning', envKey: 'GROQ_API_KEY_MACHINE_LEARNING' },
  { id: 'ai-research', title: 'AI Research', envKey: 'GROQ_API_KEY_AI_RESEARCH' },
  { id: 'agentic-frameworks', title: 'Agentic Frameworks', envKey: 'GROQ_API_KEY_AGENTIC_FRAMEWORKS' },
  { id: 'mlops', title: 'MLOps', envKey: 'GROQ_API_KEY_MLOPS' },
  { id: 'model-releases', title: 'Model Releases', envKey: 'GROQ_API_KEY_MODEL_RELEASES' },
  { id: 'ai-industry', title: 'AI Industry', envKey: 'GROQ_API_KEY_AI_INDUSTRY' },
  { id: 'tools-libraries', title: 'Tools & Libraries', envKey: 'GROQ_API_KEY_TOOLS_LIBRARIES' }
];

/**
 * Fetch a single domain briefing from Groq using its dedicated API key.
 * Falls back through GROQ_API_KEY_BACKUP_1 → GROQ_API_KEY_BACKUP_2 → GROQ_API_KEY.
 */
const fetchDomainBriefing = async (config: DomainConfig): Promise<any> => {
  const llmConfig = resolveApiKey(config.envKey);
  if (!llmConfig) {
    throw new Error(`No API key available for domain: ${config.id}`);
  }

  logger.info(`Fetching domain briefing for ${config.id} using key env: ${config.envKey} (URL: ${llmConfig.url})`);

  // Fetch real-time articles for the specific domain
  const topicId = mapConfigIdToTopicId(config.id);
  let items: any[] = [];
  try {
    const allItems = await fetchAllForUser([topicId]);
    
    // Filter to ONLY 'latest' and within the last 7 days for the LLM briefing
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffMs = sevenDaysAgo.getTime();

    items = allItems.filter(item => {
      if (item.fetchType !== 'latest') return false;
      const pubTime = new Date(item.publishedAt).getTime();
      return pubTime >= cutoffMs;
    });
  } catch (err) {
    logger.warn(`Failed to fetch real-time items for domain ${config.id}. Using knowledge base fallback.`, { error: String(err) });
  }

  const articlesPromptInput = items.slice(0, 10).map(item => {
    const bulletText = item.changelogEntries && item.changelogEntries.length > 0 
      ? '\nChangelog/Release Entries:\n' + item.changelogEntries.map((e: string) => `- ${e}`).join('\n')
      : '';
    return `Title: ${item.title}\nSource: ${item.source}\nURL: ${item.url}\nSummary: ${item.snippet}${bulletText}`;
  }).join('\n\n---\n\n');

  // Dynamic grounded system prompt tailored to this domain
  const systemPrompt = `You are a senior tech news and systems analyst for the domain: "${config.title}". Your job is to analyze the provided recent developments and write a grounded, fact-based technical report.

Return ONLY a raw JSON object with NO markdown, NO code fences, and NO extra text.

Schema:
{
  "id": "${config.id}",
  "title": "${config.title}",
  "source": "string (the primary source, e.g. arXiv, Polars Release, etc.)",
  "confidence": number (0.0-1.0),
  "summary": "string (a concise 1-2 sentence preview)",
  "detailedAnalysis": "string (a grounded technical analysis of the real entries/articles. Use simple inline markdown for bold (**text**) and links ([text](url)) if present in the sources.
  
  Structure:
  1. WHAT CHANGED / KEY CONTRIBUTIONS: List each key entry or update, explained in 1-2 plain sentences each as a bullet point. Include source PR/issue links in markdown format if present in the source text. If the input contains raw prose (like arXiv abstracts or standard news articles) rather than structured list items (or if 'Changelog/Release Entries' is empty/absent), explain the core research contributions/arguments from the prose in plain, honest language under this section, without fabricating lists of release changelogs. If the source only contains a few entries, cover them thoroughly — do not pad with generic industry commentary to reach a word count.
  2. WHY IT MATTERS: The practical impact of these changes (only if directly inferable from the source material, do not invent).
  3. WHO THIS AFFECTS: A short paragraph on which workflows or use-cases are touched by this update, based only on the sources given.
  
  Rules:
  - If the source articles lack structured list items or changelog entries (e.g. arXiv abstracts or prose descriptions), do NOT fabricate version numbers, updates, or lists of release changes to fill the 'WHAT CHANGED / KEY CONTRIBUTIONS' section. Instead, explain the actual core technical concepts and arguments presented in the source's prose in plain language, keeping it strictly honest to the text.
  - Do NOT invent metrics, benchmarks, ablation studies, or comparisons not present in the source.
  - If the source does not mention a performance number, do not state one.
  - Do not pad with generic industry commentary.
  - If no articles are provided in the prompt, synthesize a grounded technical update based on real, known developments in this domain from the last 7 days.
  - Escape double newlines as \\n\\n inside the string value)",
  "keyPoints": [
    { "heading": "string (takeaway heading)", "text": "string (takeaway summary)" },
    { "heading": "string", "text": "string" },
    { "heading": "string", "text": "string" }
  ]
}`;

  const requestPayload: any = {
    model: llmConfig.model,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Analyze these recent developments in ${config.title} from the last 7 days and provide the grounded technical report.\n\nRecent Articles:\n${articlesPromptInput || 'No recent articles available.'}`
      }
    ],
    temperature: 0.3,
    max_tokens: 2200,
    response_format: { type: 'json_object' }
  };

  const response = await axios.post(
    llmConfig.url,
    requestPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llmConfig.apiKey}`,
        ...(llmConfig.url.includes('openrouter') ? { 'HTTP-Referer': 'https://neuralbrief.app', 'X-Title': 'NeuralBrief' } : {})
      }
    }
  );

  const content = response.data?.choices?.[0]?.message?.content || '';
  const sanitized = sanitizeJsonContent(content);
  const parsed = JSON.parse(sanitized);

  // Validate shape
  if (
    typeof parsed.id !== 'string' ||
    typeof parsed.title !== 'string' ||
    typeof parsed.source !== 'string' ||
    typeof parsed.confidence !== 'number' ||
    typeof parsed.summary !== 'string' ||
    typeof parsed.detailedAnalysis !== 'string' ||
    !Array.isArray(parsed.keyPoints) ||
    parsed.keyPoints.some((kp: any) => !kp || typeof kp.heading !== 'string' || typeof kp.text !== 'string')
  ) {
    throw new Error(`Invalid shape in Groq response for domain: ${config.id}`);
  }

  // Ensure id matches expected value (LLM may hallucinate)
  parsed.id = config.id;
  parsed.title = config.title;

  return parsed;
};

// ─── GET /api/briefing/domains ──────────────────────────────────────────────────

export const handleDomainsBriefing = async (req: any, res: Response): Promise<void> => {
  try {
    const force = req.query.force === 'true';
    if (!force) {
      const cached = await getCachedBriefing('domains');
      if (cached) {
        res.json(cached);
        return;
      }
    }

    logger.info('Fetching all 8 domain briefings in parallel (concurrency limited to 2)');

    // Fetch domains with concurrency limit to prevent rate limits
    const limit = pLimit(2);
    const domainResults = await Promise.allSettled(
      DOMAIN_CONFIGS.map(config => limit(() => fetchDomainBriefing(config)))
    );

    const domains: any[] = [];
    const errors: string[] = [];

    domainResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        domains.push(result.value);
      } else {
        const config = DOMAIN_CONFIGS[idx];
        logger.error(`Failed to fetch domain ${config.id}`, { error: String(result.reason) });
        errors.push(`${config.id}: ${String(result.reason)}`);
        // Push a fallback stub so the frontend can still render the card
        domains.push({
          id: config.id,
          title: config.title,
          source: 'Unavailable',
          confidence: 0,
          summary: 'Domain briefing temporarily unavailable. Please check back later.',
          detailedAnalysis: 'This domain\'s briefing could not be fetched at this time.',
          keyPoints: [
            { heading: 'Status', text: 'Service temporarily unavailable.' }
          ]
        });
      }
    });

    if (errors.length > 0) {
      logger.warn('Some domains failed to fetch', { errors });
    }

    const generatedAt = new Date().toISOString();
    const domainsWithDate = domains.map(dom => ({
      ...dom,
      generatedAt
    }));
    const result = { domains: domainsWithDate };

    // Cache the result so we have a valid 8-domain structure cached, reducing rate limit pressure
    await setCachedBriefing('domains', result);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};

// ─── GET /api/briefing/stats ───────────────────────────────────────────────────

export const handleStatsBriefing = async (req: any, res: Response): Promise<void> => {
  try {
    // Try to get cached domains data first
    const cached = await getCachedBriefing('domains');

    const domains = cached?.domains || [];

    // 1. Topic signal counts from domain confidence scores
    const topicSignals = domains.map((d: any) => ({
      topic: d.title || d.id,
      confidence: Math.round((d.confidence || 0.85) * 100),
      source: d.source || 'Various',
    })).sort((a: any, b: any) => b.confidence - a.confidence);

    // 2. Source distribution — extract sources from domains
    const sourceMap: Record<string, number> = {};
    domains.forEach((d: any) => {
      const src = d.source || 'Other';
      const category = src.includes('ArXiv') ? 'ArXiv'
        : src.includes('GitHub') ? 'GitHub'
        : src.includes('Hugging') ? 'Hugging Face'
        : src.includes('Google') || src.includes('DeepMind') ? 'Google'
        : src.includes('OpenAI') || src.includes('Anthropic') ? 'AI Labs'
        : 'Industry News';
      sourceMap[category] = (sourceMap[category] || 0) + 1;
    });

    const sourceDistribution = Object.entries(sourceMap).map(
      ([name, count]) => ({ name, count })
    );

    // 3. Signal volume — last 7 days mock trend
    // (real data would need a time-series collection)
    const today = new Date();
    const signalVolume = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return {
        day: d.toLocaleDateString('en', { weekday: 'short' }),
        signals: 40 + Math.floor(Math.random() * 60),
      };
    });

    // 4. Overall stats
    const avgConfidence = domains.length > 0
      ? Math.round(
          domains.reduce((sum: number, d: any) =>
            sum + (d.confidence || 0.85), 0
          ) / domains.length * 100
        )
      : 94;

    res.json({
      topicSignals,
      sourceDistribution,
      signalVolume,
      totalDomains: domains.length || 8,
      avgConfidence,
      generatedAt: cached?.domains?.[0]?.generatedAt
        || new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};

// Define /briefing/latest, /briefing/domains, and /briefing/stats on router before authMiddleware
router.get('/briefing/latest', handleLatestBriefing);
router.get('/briefing/domains', handleDomainsBriefing);
router.get('/briefing/stats', handleStatsBriefing);

// All other digest routes require authentication
router.use(authMiddleware);

// ─── GET /api/digest ──────────────────────────────────────────────────────────

/**
 * Returns the most recent digest for the authenticated user.
 * Responds with null data if no digest has been generated yet.
 */
router.get('/', async (req, res: Response): Promise<void> => {
  try {
    const { uid } = (req as RequestWithUser).user;
    const db = getFirestore();

    const snapshot = await db
      .collection('users')
      .doc(uid)
      .collection('digests')
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.json(successResponse<DigestPayload | null>(null));
      return;
    }

    const digest = snapshot.docs[0]?.data() as DigestPayload;
    res.json(successResponse<DigestPayload | null>(digest));
  } catch (err) {
    logger.error('Failed to fetch digest', { error: err instanceof Error ? err.message : String(err) });
    throw new AppError('Failed to retrieve digest', 500);
  }
});

// ─── GET /api/digest/history ──────────────────────────────────────────────────

/**
 * Returns up to 7 past digests for the authenticated user, newest first.
 */
router.get('/history', async (req, res: Response): Promise<void> => {
  try {
    const { uid } = (req as RequestWithUser).user;
    const db = getFirestore();

    const snapshot = await db
      .collection('users')
      .doc(uid)
      .collection('digests')
      .orderBy('generatedAt', 'desc')
      .limit(7)
      .get();

    const digests = snapshot.docs.map((doc) => doc.data() as DigestPayload);
    res.json(successResponse<DigestPayload[]>(digests));
  } catch (err) {
    logger.error('Failed to fetch digest history', {
      error: err instanceof Error ? err.message : String(err),
    });
    throw new AppError('Failed to retrieve digest history', 500);
  }
});

// ─── POST /api/digest/trigger ─────────────────────────────────────────────────

/**
 * Manually triggers the digest pipeline for the authenticated user.
 * Runs asynchronously — returns immediately with a queued confirmation.
 */
router.post('/trigger', async (req, res: Response): Promise<void> => {
  try {
    const user = (req as RequestWithUser).user;
    const db = getFirestore();

    const userDoc = await db.collection('users').doc(user.uid).get();

    if (!userDoc.exists) {
      res.status(404).json(errorResponse('User profile not found'));
      return;
    }

    const userData = userDoc.data();
    const topics: string[] = userData?.['topics'] ?? [];
    const email: string = userData?.['email'] ?? user.email ?? '';

    // Fire and forget — do not await, return immediately
    void runPipelineForUser({ uid: user.uid, email, topics, digestFrequency: 'daily' });

    res.json(
      successResponse({
        queued: true as const,
        message: 'Your digest is being generated and will arrive in your inbox shortly.',
      }),
    );
  } catch (err) {
    logger.error('Failed to trigger digest', {
      error: err instanceof Error ? err.message : String(err),
    });
    throw new AppError('Failed to trigger digest', 500);
  }
});

// ─── GET /api/briefing/raw-news ────────────────────────────────────────────────
router.get('/raw-news', async (req: any, res: Response): Promise<void> => {
  try {
    const domainId = req.query.domainId as string;
    if (!domainId) {
      res.status(400).json({ error: 'domainId query parameter is required' });
      return;
    }

    const config = DOMAIN_CONFIGS.find(c => c.id === domainId);
    if (!config) {
      res.status(404).json({ error: `Domain not found: ${domainId}` });
      return;
    }

    const topicId = mapConfigIdToTopicId(config.id);
    const items = await fetchAllForUser([topicId]);
    
    // items are already sorted by publishedAt descending in news-service.ts
    res.json(items);
  } catch (err) {
    logger.error('Failed to fetch raw news', { error: String(err) });
    res.status(500).json({ error: String(err) });
  }
});

export default router;