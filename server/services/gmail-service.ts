import { google } from 'googleapis';
import { logger } from '../utils/logger.js';

const GMAIL_QUOTA_WARNING_THRESHOLD = 200;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;
const SEND_INTERVAL_MS = 1000;

/** Tracks the timestamp of the most recent send to enforce 1 email/second throttle. */
let lastSendTimestamp = 0;
/** Running count of emails sent in the current UTC day. */
let dailySendCount = 0;
/** The UTC date string (YYYY-MM-DD) when dailySendCount was last reset. */
let dailySendCountDate = '';

function validateEnvVars(): void {
  const required = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new AppError(500, `Missing required Gmail environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Lightweight application error carrying an HTTP status code.
 * Used instead of plain Error so callers can distinguish domain errors.
 */
class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

validateEnvVars();

const oauth2Client = new google.auth.OAuth2(
  process.env['GMAIL_CLIENT_ID'],
  process.env['GMAIL_CLIENT_SECRET'],
);

oauth2Client.setCredentials({
  refresh_token: process.env['GMAIL_REFRESH_TOKEN'],
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

/**
 * Encodes a plain string to base64url format as required by the Gmail API.
 */
function toBase64Url(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Builds an RFC 2822-compliant email message string.
 */
function buildRawMessage(to: string, subject: string, htmlContent: string): string {
  const from = process.env['GMAIL_SENDER_ADDRESS'] ?? '';
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlContent,
  ];
  return toBase64Url(lines.join('\r\n'));
}

/**
 * Sleeps for the given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resets the daily send counter if the current UTC date has changed since the last reset.
 */
function refreshDailyCounter(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (dailySendCountDate !== today) {
    dailySendCount = 0;
    dailySendCountDate = today;
  }
}

/**
 * Enforces a 1 email/second send rate by sleeping until the interval has elapsed.
 */
async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastSendTimestamp;
  if (elapsed < SEND_INTERVAL_MS) {
    await sleep(SEND_INTERVAL_MS - elapsed);
  }
  lastSendTimestamp = Date.now();
}

/**
 * Sends a digest email to the specified recipient via the Gmail API.
 *
 * - Applies a 1 email/second throttle.
 * - Retries up to 3 times with exponential backoff on HTTP 429 responses.
 * - Logs a warning if the daily send count approaches Gmail's free-tier quota.
 * - Never throws — always resolves with a result object.
 */
export async function sendDigestEmail(
  to: string,
  subject: string,
  htmlContent: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  refreshDailyCounter();

  if (dailySendCount >= GMAIL_QUOTA_WARNING_THRESHOLD) {
    logger.warn('sendDigestEmail: approaching Gmail daily quota', {
      dailySendCount,
      threshold: GMAIL_QUOTA_WARNING_THRESHOLD,
    });
  }

  await throttle();

  const raw = buildRawMessage(to, subject, htmlContent);
  let lastError = '';

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      });

      const messageId = response.data.id ?? undefined;
      dailySendCount += 1;

      logger.info('sendDigestEmail: sent successfully', { to, subject, messageId, attempt });

      return { success: true, messageId };
    } catch (error) {
      const isRateLimit =
        error instanceof Error &&
        'code' in error &&
        (error as unknown as { code: number }).code === 429;

      lastError = error instanceof Error ? error.message : String(error);

      logger.warn('sendDigestEmail: send attempt failed', {
        to,
        subject,
        attempt,
        isRateLimit,
        error: lastError,
      });

      if (isRateLimit && attempt < MAX_RETRY_ATTEMPTS) {
        const backoffMs = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(backoffMs);
        continue;
      }

      break;
    }
  }

  logger.error('sendDigestEmail: all attempts failed', { to, subject, error: lastError });
  return { success: false, error: lastError };
}
