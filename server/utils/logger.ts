/**
 * Lightweight structured logger for the NeuralBrief server.
 * Wraps console methods behind a typed interface so no raw
 * console.log calls appear in production source files.
 */

import type { Request, Response, NextFunction } from 'express';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

function emit(entry: LogEntry): void {
  const line = JSON.stringify(entry);
  if (entry.level === 'error') {
    console.error(line); // eslint-disable-line no-console
  } else if (entry.level === 'warn') {
    console.warn(line); // eslint-disable-line no-console
  } else {
    console.info(line); // eslint-disable-line no-console
  }
}

function buildEntry(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): LogEntry {
  return { level, message, timestamp: new Date().toISOString(), meta };
}

export const logger = {
  /** Log an informational message. */
  info(message: string, meta?: Record<string, unknown>): void {
    emit(buildEntry('info', message, meta));
  },

  /** Log a warning that does not halt execution. */
  warn(message: string, meta?: Record<string, unknown>): void {
    emit(buildEntry('warn', message, meta));
  },

  /** Log a recoverable or fatal error. */
  error(message: string, meta?: Record<string, unknown>): void {
    emit(buildEntry('error', message, meta));
  },

  /** Log verbose debug information (suppressed in production). */
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env['NODE_ENV'] !== 'production') {
      emit(buildEntry('debug', message, meta));
    }
  },
};

/**
 * Express middleware that logs every inbound request and its response.
 * Attaches to the response `finish` event to capture status and duration.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level: LogLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level]('HTTP request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
    });
  });

  next();
}
