/**
 * Cron route and pipeline orchestration for NeuralBrief.
 * POST /api/cron  — secured with CRON_SECRET header, triggers all-user pipeline.
 * runPipelineForUser — exported for use by the manual digest trigger route.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

import { logger } from './utils/logger';
import { successResponse, errorResponse } from './types';
import type { UserDigestConfig, AgentResult, DigestPayload } from './types';

// Agent imports — resolved when Accounts 5, 6, and 7 deliver their files.
import { runScraperAgent } from './agents/scraperAgent';
import { runFilterAgent } from './agents/filterAgent';
import { runSummaryAgent } from './agents/summaryAgent';
import { runEmailAgent } from './agents/emailAgent';

const router = Router();

// ─── Pipeline ─────────────────────────────────────────────────────────────────

/**
 * Runs the full digest pipeline for a single user.
 * Scraper → Filter → Summary → Email.
 * Any thrown error is caught and logged; it does not propagate.
 */
export async function runPipelineForUser(config: UserDigestConfig): Promise<boolean> {
  const { uid, email, topics } = config;
  const pipelineStart = Date.now();

  try {
    logger.info('Pipeline start', { uid, topicCount: topics.length });

    const scraperResult = await runScraperAgent(topics);

    if (!scraperResult.success) {
      logger.warn('Scraper agent failed', { uid, errors: scraperResult.metadata.errors });
      return false;
    }

    const filterResult = await runFilterAgent(scraperResult.data, topics);

    if (!filterResult.success) {
      logger.warn('Filter agent failed', { uid, errors: filterResult.metadata.errors });
      return false;
    }

    const summaryResult = await runSummaryAgent(filterResult.data, topics);

    if (!summaryResult.success) {
      logger.warn('Summary agent failed', { uid, errors: summaryResult.metadata.errors });
      return false;
    }

    const digest: DigestPayload = {
      userId: uid,
      email,
      sections: summaryResult.data,
      generatedAt: new Date().toISOString(),
      topicCount: topics.length,
      itemCount: summaryResult.data.reduce((acc, s) => acc + s.items.length, 0),
    };

    // Persist digest to Firestore before attempting email delivery
    const db = getFirestore();
    await db.collection('users').doc(uid).collection('digests').add(digest);

    const emailResult: AgentResult<{ emailSent: boolean; digestId: string }> =
      await runEmailAgent(digest.sections, digest.userId);

    if (!emailResult.success) {
      logger.warn('Email agent failed', { uid, errors: emailResult.metadata.errors });
      // Digest is saved even if email fails — user can retrieve via API
      return false;
    }

    logger.info('Pipeline complete', {
      uid,
      durationMs: Date.now() - pipelineStart,
      itemCount: digest.itemCount,
      emailSent: emailResult.data.emailSent,
      digestId: emailResult.data.digestId,
    });

    return true;
  } catch (err) {
    logger.error('Pipeline threw unhandled error', {
      uid,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

// ─── Cron Route ───────────────────────────────────────────────────────────────

/**
 * POST /api/cron
 * Invoked by Cloud Scheduler at 07:00 UTC daily.
 * Requires x-cron-secret header matching CRON_SECRET env var.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const secret = req.headers['x-cron-secret'];

  if (!secret || secret !== process.env['CRON_SECRET']) {
    res.status(401).json(errorResponse('Invalid or missing cron secret'));
    return;
  }

  const startedAt = new Date().toISOString();
  const db = getFirestore();

  // Fetch all users who want a digest
  let users: UserDigestConfig[] = [];

  try {
    const snapshot = await db
      .collection('users')
      .where('digestFrequency', '!=', 'none')
      .get();

    users = snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...(doc.data() as Omit<UserDigestConfig, 'uid'>),
    }));
  } catch (err) {
    logger.error('Failed to fetch users for cron run', {
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json(errorResponse('Failed to fetch users'));
    return;
  }

  logger.info('Cron run started', { userCount: users.length, startedAt });

  // Run all pipelines concurrently — one failure must not block others
  const results = await Promise.allSettled(users.map((u) => runPipelineForUser(u)));

  const failedUids: string[] = [];
  const cronErrors: string[] = [];
  let succeeded = 0;

  results.forEach((result, index) => {
    const user = users[index];

    if (result.status === 'fulfilled' && result.value) {
      succeeded += 1;
    } else {
      const uid = user?.uid ?? `unknown[${index}]`;
      failedUids.push(uid);

      if (result.status === 'rejected') {
        const errorMsg = result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
        cronErrors.push(`${uid}: ${errorMsg}`);
      }
    }
  });

  const completedAt = new Date().toISOString();

  // Write cron log to Firestore
  try {
    await db.collection('cron_logs').add({
      startedAt,
      completedAt,
      usersProcessed: users.length,
      usersSucceeded: succeeded,
      usersFailed: failedUids.length,
      errors: cronErrors,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (logErr) {
    logger.warn('Failed to write cron log to Firestore', {
      error: logErr instanceof Error ? logErr.message : String(logErr),
    });
  }

  logger.info('Cron run complete', {
    processed: users.length,
    succeeded,
    failed: failedUids.length,
    failedUids,
  });

  res.json(
    successResponse({
      processed: users.length,
      succeeded,
      failed: failedUids.length,
    }),
  );
});

export default router;