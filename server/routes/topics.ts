/**
 * Topics routes.
 * GET /api/topics        — public, returns all available topics.
 * GET /api/topics/user   — auth required, returns user's selected topic IDs.
 * PUT /api/topics/user   — auth required, updates user's selected topic IDs.
 */

import { Router } from 'express';
import type { Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';

import { authMiddleware } from '../middleware/auth';
import type { RequestWithUser } from '../middleware/auth';
import { AppError, successResponse, errorResponse } from '../types';
import { TOPICS, getTopicById } from '../config/topics';
import type { Topic } from '../config/topics';
import { logger } from '../utils/logger';

const router = Router();

const MAX_USER_TOPICS = 10;

// ─── GET /api/topics (public) ────────────────────────────────────────────────

/**
 * Returns the complete list of supported topics.
 * No authentication required — used on the onboarding screen.
 */
router.get('/', (_req, res: Response): void => {
  res.json(successResponse<Topic[]>(TOPICS));
});

// ─── GET /api/topics/user (auth required) ────────────────────────────────────

/**
 * Returns the authenticated user's currently selected topic IDs.
 */
router.get('/user', authMiddleware, async (req, res: Response): Promise<void> => {
  try {
    const { uid } = (req as RequestWithUser).user;
    const db = getFirestore();

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      res.json(successResponse<string[]>([]));
      return;
    }

    const topics: string[] = userDoc.data()?.['topics'] ?? [];
    res.json(successResponse<string[]>(topics));
  } catch (err) {
    logger.error('Failed to fetch user topics', {
      error: err instanceof Error ? err.message : String(err),
    });
    throw new AppError('Failed to retrieve user topics', 500);
  }
});

// ─── PUT /api/topics/user (auth required) ────────────────────────────────────

/**
 * Replaces the authenticated user's selected topics.
 * Validates that all IDs exist in the master topic registry and that
 * no more than 10 topics are selected.
 */
router.put('/user', authMiddleware, async (req, res: Response): Promise<void> => {
  try {
    const { uid } = (req as RequestWithUser).user;

    const body: unknown = req.body;

    if (
      !body ||
      typeof body !== 'object' ||
      !('topics' in body) ||
      !Array.isArray((body as Record<string, unknown>)['topics'])
    ) {
      res.status(400).json(errorResponse('Request body must contain a "topics" array'));
      return;
    }

    const topics = (body as { topics: unknown[] })['topics'];

    if (!topics.every((t): t is string => typeof t === 'string')) {
      res.status(400).json(errorResponse('All topic IDs must be strings'));
      return;
    }

    if (topics.length > MAX_USER_TOPICS) {
      res
        .status(400)
        .json(errorResponse(`You may select at most ${MAX_USER_TOPICS} topics`));
      return;
    }

    const invalidIds = topics.filter((id) => !getTopicById(id));

    if (invalidIds.length > 0) {
      res
        .status(400)
        .json(errorResponse(`Unknown topic IDs: ${invalidIds.join(', ')}`));
      return;
    }

    const db = getFirestore();
    await db.collection('users').doc(uid).set({ topics }, { merge: true });

    res.json(successResponse({ updated: true as const }));
  } catch (err) {
    logger.error('Failed to update user topics', {
      error: err instanceof Error ? err.message : String(err),
    });
    throw new AppError('Failed to update topics', 500);
  }
});

export default router;