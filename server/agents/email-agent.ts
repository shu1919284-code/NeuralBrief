import { render } from '@react-email/render';

import { DigestEmail } from '../templates/DigestEmail.js';
import * as gmailService from '../services/gmail-service.js';
import * as userService from '../services/user-service.js';
import { logger } from '../utils/logger.js';

import type { AgentResult, DigestPayload, DigestSection } from '../types/index.js';

/**
 * Sums all items across every digest section.
 */
function countItems(sections: DigestSection[]): number {
  return sections.reduce((total, section) => total + section.items.length, 0);
}

/**
 * Builds the email subject line with the current formatted date.
 * e.g. "🌐 NeuralBrief — Tuesday, June 10"
 */
function buildSubject(): string {
  const formatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return `🌐 NeuralBrief — ${formatted}`;
}

/**
 * Runs the Email Agent — the final stage of the NeuralBrief pipeline.
 *
 * Workflow:
 *   1. Fetch user config from Firestore.
 *   2. Build the DigestPayload.
 *   3. Save the digest to Firestore (before sending, so it's never lost).
 *   4. Render the React Email template to HTML.
 *   5. Send the email via Gmail API.
 *   6. Update the user's lastDigestSent metadata.
 *   7. Return an AgentResult — never throws.
 */
export async function runEmailAgent(
  sections: DigestSection[],
  userId: string,
): Promise<AgentResult<{ emailSent: boolean; digestId: string }>> {
  const startedAt = Date.now();
  const errors: string[] = [];
  const itemCount = countItems(sections);

  const buildResult = (
    success: boolean,
    emailSent: boolean,
    digestId: string,
  ): AgentResult<{ emailSent: boolean; digestId: string }> => ({
    success,
    data: { emailSent, digestId },
    metadata: {
      duration: Date.now() - startedAt,
      itemCount,
      errors,
    },
  });

  // ── Step 1: fetch user ──────────────────────────────────────────────────────
  let user;
  try {
    user = await userService.getUserById(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('runEmailAgent: failed to fetch user', { userId, error: message });
    errors.push(`getUserById failed: ${message}`);
    return buildResult(false, false, '');
  }

  if (!user) {
    logger.warn('runEmailAgent: user not found', { userId });
    errors.push('User not found');
    return buildResult(false, false, '');
  }

  // ── Step 2: build payload ───────────────────────────────────────────────────
  const generatedAt = new Date().toISOString();
  const payload: DigestPayload = {
    userId: user.uid,
    email: user.email,
    sections,
    generatedAt,
    topicCount: sections.length,
    itemCount,
  };

  // ── Step 3: save digest to Firestore FIRST ──────────────────────────────────
  let digestId = '';
  try {
    digestId = await userService.saveDigestToHistory(userId, payload);
    logger.info('runEmailAgent: digest saved', { userId, digestId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('runEmailAgent: failed to save digest', { userId, error: message });
    errors.push(`saveDigestToHistory failed: ${message}`);
    // Digest save is critical — abort without sending
    return buildResult(false, false, '');
  }

  // ── Step 4: render React Email template ────────────────────────────────────
  let html = '';
  try {
    html = await render(
      DigestEmail({
        userName: user.email.split('@')[0] ?? 'there',
        sections,
        generatedAt,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('runEmailAgent: template render failed', { userId, digestId, error: message });
    errors.push(`Template render failed: ${message}`);
    return buildResult(false, false, digestId);
  }

  // ── Step 5: send email ──────────────────────────────────────────────────────
  const subject = buildSubject();
  const sendResult = await gmailService.sendDigestEmail(user.email, subject, html);

  if (!sendResult.success) {
    const errMsg = sendResult.error ?? 'Unknown send error';
    logger.error('runEmailAgent: email send failed', { userId, digestId, error: errMsg });
    errors.push(`sendDigestEmail failed: ${errMsg}`);
  }

  // ── Step 6: update lastDigestSent (best-effort; never blocks success) ───────
  try {
    await userService.updateLastDigestSent(userId, digestId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn('runEmailAgent: failed to update lastDigestSent', {
      userId,
      digestId,
      error: message,
    });
    errors.push(`updateLastDigestSent failed: ${message}`);
  }

  // ── Step 7: return result ───────────────────────────────────────────────────
  logger.info('runEmailAgent: complete', {
    userId,
    digestId,
    emailSent: sendResult.success,
    duration: Date.now() - startedAt,
    itemCount,
  });

  return buildResult(sendResult.success, sendResult.success, digestId);
}
