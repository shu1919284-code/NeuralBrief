/**
 * Shared TypeScript types and interfaces for NeuralBrief.
 * All agents, routes, and services import from this file.
 */

// ─── Domain Enums / Literals ────────────────────────────────────────────────

/** Supported news topic categories. */
export type NewsCategory =
  | 'ai'
  | 'cloud'
  | 'security'
  | 'devops'
  | 'programming'
  | 'databases';

/** Classification of a summarised news item. */
export type ItemCategory = 'breaking' | 'analysis' | 'release' | 'general';

/** How often a user wants their digest delivered. */
export type DigestFrequency = 'daily' | 'weekly' | 'none';

// ─── News Pipeline ────────────────────────────────────────────────────────────

/** Raw news item produced by the Scraper Agent. */
export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  topic: string;
  publishedAt: string; // ISO 8601
  snippet: string;
  changelogEntries?: string[];
  fetchType: 'latest' | 'popular';
}

/** News item enriched by the Filter Agent. */
export interface FilteredNewsItem extends NewsItem {
  relevanceScore: number; // 0 to 1
  isDuplicate: boolean;
}

/** News item after the Summary Agent has processed it. */
export interface SummarizedItem {
  title: string;
  summary: string; // exactly 2–3 sentences
  url: string;
  source: string;
  category: ItemCategory;
}

// ─── Digest ──────────────────────────────────────────────────────────────────

/** One topic's block inside a digest. */
export interface DigestSection {
  topic: string;
  items: SummarizedItem[];
}

/** Complete digest payload stored in Firestore and sent via email. */
export interface DigestPayload {
  userId: string;
  email: string;
  sections: DigestSection[];
  generatedAt: string; // ISO 8601
  topicCount: number;
  itemCount: number;
}

// ─── User ─────────────────────────────────────────────────────────────────────

/** Per-user digest configuration read from Firestore. */
export interface UserDigestConfig {
  uid: string;
  email: string;
  topics: string[];
  digestFrequency: DigestFrequency;
}

// ─── Agent Infrastructure ─────────────────────────────────────────────────────

/** Generic wrapper for any agent's result. */
export interface AgentResult<T> {
  success: boolean;
  data: T;
  metadata: {
    duration: number; // milliseconds
    itemCount: number;
    errors: string[];
  };
}

// ─── API Layer ────────────────────────────────────────────────────────────────

/** Standard API response envelope. */
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/** Creates a successful ApiResponse. */
export function successResponse<T>(data: T): ApiResponse<T> {
  return { ok: true, data, timestamp: new Date().toISOString() };
}

/** Creates a failed ApiResponse. */
export function errorResponse(message: string): ApiResponse<never> {
  return { ok: false, error: message, timestamp: new Date().toISOString() };
}

// ─── Error ────────────────────────────────────────────────────────────────────

/** Application-level error with an HTTP status code. */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    // Restore prototype chain (required when extending built-ins in TS).
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
