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

const CACHE_FILE = path.join(process.cwd(), 'server', 'data', 'briefing_cache.json');

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

    const apiKey = process.env.GROQ_API_KEY_LATEST || process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'GROQ_API_KEY env var is missing' });
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

    let content = response.data?.choices?.[0]?.message?.content || '';

    // Robust JSON extraction using bounding braces
    const startIdx = content.indexOf('{');
    const endIdx = content.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      content = content.substring(startIdx, endIdx + 1);
    }

    // Sanitize literal control characters (ASCII < 32) inside JSON string values to prevent parser errors
    let sanitizedContent = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '"' && !escaped) {
        inString = !inString;
      }
      if (inString && char.charCodeAt(0) < 32) {
        if (char === '\n' || char === '\r') {
          sanitizedContent += '\\n';
        } else if (char === '\t') {
          sanitizedContent += '\\t';
        }
      } else {
        sanitizedContent += char;
      }
      escaped = (char === '\\' && !escaped);
    }

    const parsed = JSON.parse(sanitizedContent);

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

    // Cache successful response
    await setCachedBriefing('latest', parsed);

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
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

    const apiKey = process.env.GROQ_API_KEY_DOMAINS || process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'GROQ_API_KEY env var is missing' });
      return;
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a senior technical AI news analyst. Return ONLY a raw JSON object with NO markdown, NO code fences, and NO extra text.\n' +
                     'Generate the most significant technical news, model release, framework breakthrough, or research paper from the last 7 days for EACH of the following four domains:\n' +
                     '1. Data Science (statistical frameworks, optimization, visualization, data manipulation libraries)\n' +
                     '2. Machine Learning (weights, model training pipelines, MLOps, edge deployment)\n' +
                     '3. AI Research (foundational breakthroughs, algorithmic updates, benchmarks, arXiv papers)\n' +
                     '4. Agentic Frameworks (multi-agent graphs, memory layers, stateful routing, orchestration)\n\n' +
                     'Your JSON structure MUST follow this exact schema:\n' +
                     '{\n' +
                     '  "domains": [\n' +
                     '    {\n' +
                     '      "id": "data-science",\n' +
                     '      "title": "Data Science",\n' +
                     '      "source": "string (the primary research source or venue, e.g., arXiv stat.AP, Polars release)",\n' +
                     '      "confidence": number (a float value between 0.0 and 1.0),\n' +
                     '      "summary": "string (a concise 1-2 sentence preview summary of the development)",\n' +
                     '      "detailedAnalysis": "string (a highly detailed, technical report consisting of 3-4 paragraphs explaining the underlying architectures, optimization techniques, empirical results, and industry significance. Escape newlines as \\n inside the string value)",\n' +
                     '      "keyPoints": [\n' +
                     '        { "heading": "string (short heading)", "text": "string (detailed description of this point)" },\n' +
                     '        { "heading": "string (short heading)", "text": "string (detailed description of this point)" },\n' +
                     '        { "heading": "string (short heading)", "text": "string (detailed description of this point)" }\n' +
                     '      ]\n' +
                     '    },\n' +
                     '    {\n' +
                     '      "id": "machine-learning",\n' +
                     '      "title": "Machine Learning",\n' +
                     '      "source": "string",\n' +
                     '      "confidence": number,\n' +
                     '      "summary": "string",\n' +
                     '      "detailedAnalysis": "string",\n' +
                     '      "keyPoints": [\n' +
                     '        { "heading": "string", "text": "string" },\n' +
                     '        { "heading": "string", "text": "string" },\n' +
                     '        { "heading": "string", "text": "string" }\n' +
                     '      ]\n' +
                     '    },\n' +
                     '    {\n' +
                     '      "id": "ai-research",\n' +
                     '      "title": "AI Research",\n' +
                     '      "source": "string",\n' +
                     '      "confidence": number,\n' +
                     '      "summary": "string",\n' +
                     '      "detailedAnalysis": "string",\n' +
                     '      "keyPoints": [\n' +
                     '        { "heading": "string", "text": "string" },\n' +
                     '        { "heading": "string", "text": "string" },\n' +
                     '        { "heading": "string", "text": "string" }\n' +
                     '      ]\n' +
                     '    },\n' +
                     '    {\n' +
                     '      "id": "agentic-frameworks",\n' +
                     '      "title": "Agentic Frameworks",\n' +
                     '      "source": "string",\n' +
                     '      "confidence": number,\n' +
                     '      "summary": "string",\n' +
                     '      "detailedAnalysis": "string",\n' +
                     '      "keyPoints": [\n' +
                     '        { "heading": "string", "text": "string" },\n' +
                     '        { "heading": "string", "text": "string" },\n' +
                     '        { "heading": "string", "text": "string" }\n' +
                     '      ]\n' +
                     '    }\n' +
                     '  ]\n' +
                     '}'
          },
          {
            role: 'user',
            content: 'Give me the latest weekly updates for each of the four focus domains in deep technical detail. Return only the raw JSON.'
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    let content = response.data?.choices?.[0]?.message?.content || '';

    // Robust JSON extraction using bounding braces
    const startIdx = content.indexOf('{');
    const endIdx = content.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      content = content.substring(startIdx, endIdx + 1);
    }

    // Sanitize literal control characters (ASCII < 32) inside JSON string values to prevent parser errors
    let sanitizedContent = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '"' && !escaped) {
        inString = !inString;
      }
      if (inString && char.charCodeAt(0) < 32) {
        if (char === '\n' || char === '\r') {
          sanitizedContent += '\\n';
        } else if (char === '\t') {
          sanitizedContent += '\\t';
        }
      } else {
        sanitizedContent += char;
      }
      escaped = (char === '\\' && !escaped);
    }

    const parsed = JSON.parse(sanitizedContent);

    // Validate shape
    if (!parsed || !Array.isArray(parsed.domains) || parsed.domains.length !== 4) {
      res.status(500).json({ error: 'Invalid domains response shape from Groq API' });
      return;
    }

    for (const d of parsed.domains) {
      if (
        typeof d.id !== 'string' ||
        typeof d.title !== 'string' ||
        typeof d.source !== 'string' ||
        typeof d.confidence !== 'number' ||
        typeof d.summary !== 'string' ||
        typeof d.detailedAnalysis !== 'string' ||
        !Array.isArray(d.keyPoints) ||
        d.keyPoints.some((kp: any) => !kp || typeof kp.heading !== 'string' || typeof kp.text !== 'string')
      ) {
        res.status(500).json({ error: `Invalid shape in domain data for: ${d.id || 'unknown'}` });
        return;
      }
    }

    // Cache successful response
    await setCachedBriefing('domains', parsed);

    res.json(parsed);
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
