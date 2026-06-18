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

import { authMiddleware } from '../middleware/auth';
import type { RequestWithUser } from '../middleware/auth';
import { AppError, successResponse, errorResponse } from '../types';
import type { DigestPayload } from '../types';
import { logger } from '../utils/logger';
import { runPipelineForUser } from '../cron';

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

/**
 * Resolve the API key for a given section using the fallback chain:
 *   section-specific key → backup1 → backup2 → main fallback
 */
const resolveApiKey = (sectionEnvVar: string): string | undefined => {
  return (
    process.env[sectionEnvVar] ||
    process.env.GROQ_API_KEY_BACKUP_1 ||
    process.env.GROQ_API_KEY_BACKUP_2 ||
    process.env.GROQ_API_KEY
  );
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
      return cached.data;
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

    const apiKey = resolveApiKey('GROQ_API_KEY_LATEST');
    if (!apiKey) {
      res.status(500).json({ error: 'No Groq API key configured. Set GROQ_API_KEY_LATEST or GROQ_API_KEY.' });
      return;
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a senior technical AI news analyst. Return ONLY a raw JSON object with NO markdown, NO code fences, and NO extra text. Fields:\n' +
                     '{\n' +
                     '  "title": "string (a highly specific, technical title)",\n' +
                     '  "source": "string (the primary research source or venue, e.g., arXiv cs.LG, OpenAI Research)",\n' +
                     '  "confidence": number (a float value between 0.0 and 1.0),\n' +
                     '  "summary": "string (a concise 1-2 sentence preview summary of the development)",\n' +
                     '  "detailedAnalysis": "string (a highly detailed, technical report consisting of 3-4 paragraphs explaining the underlying architectures, optimization techniques, empirical results, and industry significance. Escape newlines as \\n inside the string value)",\n' +
                     '  "keyPoints": [\n' +
                     '    { "heading": "string (short heading)", "text": "string (detailed description of this point)" },\n' +
                     '    { "heading": "string (short heading)", "text": "string (detailed description of this point)" },\n' +
                     '    { "heading": "string (short heading)", "text": "string (detailed description of this point)" }\n' +
                     '  ]\n' +
                     '}'
          },
          {
            role: 'user',
            content: 'Give me the most significant AI model release, framework breakthrough, or foundation model research paper from the last 7 days. Provide a deep technical analysis. Return only the raw JSON.'
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
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

    await setCachedBriefing('latest', parsed);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};

// ─── Domain-specific prompts ───────────────────────────────────────────────────

interface DomainConfig {
  id: string;
  title: string;
  envKey: string;
  systemPrompt: string;
}

const DOMAIN_CONFIGS: DomainConfig[] = [
  {
    id: 'data-science',
    title: 'Data Science',
    envKey: 'GROQ_API_KEY_DATA_SCIENCE',
    systemPrompt: 'You are a senior data science news analyst. Return ONLY a raw JSON object with NO markdown, NO code fences, and NO extra text.\n' +
      'Scope: Statistical frameworks, data manipulation libraries (Polars, DuckDB, Pandas), optimization, visualization tools, and data engineering breakthroughs from the last 7 days.\n' +
      'Schema:\n' +
      '{\n' +
      '  "id": "data-science",\n' +
      '  "title": "Data Science",\n' +
      '  "source": "string (primary research source, e.g., arXiv stat.AP, Polars release)",\n' +
      '  "confidence": number (0.0-1.0),\n' +
      '  "summary": "string (1-2 sentence preview of the most significant development)",\n' +
      '  "detailedAnalysis": "string (3-4 paragraphs technical report, escape newlines as \\n)",\n' +
      '  "keyPoints": [\n' +
      '    { "heading": "string", "text": "string" },\n' +
      '    { "heading": "string", "text": "string" },\n' +
      '    { "heading": "string", "text": "string" }\n' +
      '  ]\n' +
      '}'
  },
  {
    id: 'machine-learning',
    title: 'Machine Learning',
    envKey: 'GROQ_API_KEY_MACHINE_LEARNING',
    systemPrompt: 'You are a senior machine learning news analyst. Return ONLY a raw JSON object with NO markdown, NO code fences, and NO extra text.\n' +
      'Scope: Model architectures, training pipelines, MLOps, edge deployment, benchmark results, and weight releases from the last 7 days.\n' +
      'Schema:\n' +
      '{\n' +
      '  "id": "machine-learning",\n' +
      '  "title": "Machine Learning",\n' +
      '  "source": "string (primary source, e.g., GH: Awesome-MLOps, arXiv cs.LG)",\n' +
      '  "confidence": number (0.0-1.0),\n' +
      '  "summary": "string (1-2 sentence preview)",\n' +
      '  "detailedAnalysis": "string (3-4 paragraphs, escape newlines as \\n)",\n' +
      '  "keyPoints": [\n' +
      '    { "heading": "string", "text": "string" },\n' +
      '    { "heading": "string", "text": "string" },\n' +
      '    { "heading": "string", "text": "string" }\n' +
      '  ]\n' +
      '}'
  },
  {
    id: 'ai-research',
    title: 'AI Research',
    envKey: 'GROQ_API_KEY_AI_RESEARCH',
    systemPrompt: 'You are a senior AI research analyst. Return ONLY a raw JSON object with NO markdown, NO code fences, and NO extra text.\n' +
      'Scope: Foundational breakthroughs, algorithmic advances, arXiv papers, benchmark-setting results, and academic contributions from the last 7 days.\n' +
      'Schema:\n' +
      '{\n' +
      '  "id": "ai-research",\n' +
      '  "title": "AI Research",\n' +
      '  "source": "string (e.g., arXiv cs.LG, NeurIPS, ICML, OpenAI Research)",\n' +
      '  "confidence": number (0.0-1.0),\n' +
      '  "summary": "string (1-2 sentence preview)",\n' +
      '  "detailedAnalysis": "string (3-4 paragraphs, escape newlines as \\n)",\n' +
      '  "keyPoints": [\n' +
      '    { "heading": "string", "text": "string" },\n' +
      '    { "heading": "string", "text": "string" },\n' +
      '    { "heading": "string", "text": "string" }\n' +
      '  ]\n' +
      '}'
  },
  {
    id: 'agentic-frameworks',
    title: 'Agentic Frameworks',
    envKey: 'GROQ_API_KEY_AGENTIC_FRAMEWORKS',
    systemPrompt: 'You are a senior agentic AI systems analyst. Return ONLY a raw JSON object with NO markdown, NO code fences, and NO extra text.\n' +
      'Scope: Multi-agent graphs, autonomous memory layers, stateful routing, orchestration frameworks (LangChain, CrewAI, AutoGen, LlamaIndex), and agent-native tooling from the last 7 days.\n' +
      'Schema:\n' +
      '{\n' +
      '  "id": "agentic-frameworks",\n' +
      '  "title": "Agentic Frameworks",\n' +
      '  "source": "string (e.g., LangChain Changelog, CrewAI GitHub, arXiv cs.AI)",\n' +
      '  "confidence": number (0.0-1.0),\n' +
      '  "summary": "string (1-2 sentence preview)",\n' +
      '  "detailedAnalysis": "string (3-4 paragraphs, escape newlines as \\n)",\n' +
      '  "keyPoints": [\n' +
      '    { "heading": "string", "text": "string" },\n' +
      '    { "heading": "string", "text": "string" },\n' +
      '    { "heading": "string", "text": "string" }\n' +
      '  ]\n' +
      '}'
  }
];

/**
 * Fetch a single domain briefing from Groq using its dedicated API key.
 * Falls back through GROQ_API_KEY_BACKUP_1 → GROQ_API_KEY_BACKUP_2 → GROQ_API_KEY.
 */
const fetchDomainBriefing = async (config: DomainConfig): Promise<any> => {
  const apiKey = resolveApiKey(config.envKey);
  if (!apiKey) {
    throw new Error(`No API key available for domain: ${config.id}`);
  }

  logger.info(`Fetching domain briefing for ${config.id} using key env: ${config.envKey}`);

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: config.systemPrompt },
        {
          role: 'user',
          content: `Give me the most significant development in ${config.title} from the last 7 days. Provide a deep technical analysis in the required JSON format. Return only the raw JSON.`
        }
      ],
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: 'json_object' }
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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

    logger.info('Fetching all 4 domain briefings in parallel');

    // Fetch all 4 domains in parallel — each uses its own API key
    const domainResults = await Promise.allSettled(
      DOMAIN_CONFIGS.map(config => fetchDomainBriefing(config))
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

    const result = { domains };

    // Only cache if all 4 domains were successfully fetched
    if (errors.length === 0) {
      await setCachedBriefing('domains', result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
};


// Define /briefing/latest and /briefing/domains on router before authMiddleware
router.get('/briefing/latest', handleLatestBriefing);
router.get('/briefing/domains', handleDomainsBriefing);

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

export default router;
