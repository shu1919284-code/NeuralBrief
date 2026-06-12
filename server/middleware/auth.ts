/**
 * Express authentication middleware using Firebase Admin SDK.
 * Verifies the Bearer token and attaches the decoded user to req.user.
 */

import type { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAuth } from 'firebase-admin/auth';

import { logger } from '../utils/logger';
import { AppError, errorResponse } from '../types';

/** Express Request extended with the authenticated Firebase user. */
export interface RequestWithUser extends Request {
  user: DecodedIdToken;
}

/**
 * Middleware that enforces Firebase ID token authentication.
 * Responds with 401 if the token is absent or fails verification.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(errorResponse('No authorization token provided'));
      return;
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    try {
      const decoded = await getAuth().verifyIdToken(token);
      (req as RequestWithUser).user = decoded;
      next();
    } catch (verifyError) {
      logger.warn('Token verification failed', {
        error: verifyError instanceof Error ? verifyError.message : String(verifyError),
      });
      res.status(401).json(errorResponse('Invalid or expired token'));
    }
  } catch (err) {
    next(new AppError('Authentication error', 500));
  }
}
