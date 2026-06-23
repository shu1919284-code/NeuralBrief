import { getFirestore, FieldValue } from 'firebase-admin/firestore';

import type { UserDigestConfig, DigestPayload } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Retrieves all users who have an active digest frequency (not 'none').
 * Returns an empty array rather than throwing if no users are found.
 */
export async function getAllActiveUsers(): Promise<UserDigestConfig[]> {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection('users')
      .where('digestFrequency', 'in', ['daily', 'weekly'])
      .get();

    if (snapshot.empty) {
      logger.info('getAllActiveUsers: no active users found');
      return [];
    }

    const users: UserDigestConfig[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data['email'] as string,
        topics: (data['topics'] as string[]) ?? [],
        digestFrequency: data['digestFrequency'] as UserDigestConfig['digestFrequency'],
      };
    });

    logger.info(`getAllActiveUsers: found ${users.length} active users`);
    return users;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('getAllActiveUsers failed', { error: message });
    throw error;
  }
}

/**
 * Fetches a single user document by UID.
 * Returns null if the document does not exist.
 */
export async function getUserById(uid: string): Promise<UserDigestConfig | null> {
  try {
    const db = getFirestore();
    const doc = await db.collection('users').doc(uid).get();

    if (!doc.exists) {
      logger.warn('getUserById: user not found', { uid });
      return null;
    }

    const data = doc.data()!;
    return {
      uid: doc.id,
      email: data['email'] as string,
      topics: (data['topics'] as string[]) ?? [],
      digestFrequency: data['digestFrequency'] as UserDigestConfig['digestFrequency'],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('getUserById failed', { uid, error: message });
    throw error;
  }
}

/**
 * Persists a DigestPayload to the user's digests sub-collection.
 * Appends a server-side `savedAt` timestamp.
 * Returns the auto-generated Firestore document ID.
 */
export async function saveDigestToHistory(
  uid: string,
  payload: DigestPayload,
): Promise<string> {
  try {
    const db = getFirestore();
    const ref = await db
      .collection('users')
      .doc(uid)
      .collection('digests')
      .add({
        ...payload,
        savedAt: FieldValue.serverTimestamp(),
      });

    logger.info('saveDigestToHistory: digest saved', { uid, digestId: ref.id });
    return ref.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('saveDigestToHistory failed', { uid, error: message });
    throw error;
  }
}

/**
 * Updates the user's root document with the timestamp and ID of the last sent digest.
 */
export async function updateLastDigestSent(uid: string, digestId: string): Promise<void> {
  try {
    const db = getFirestore();
    await db.collection('users').doc(uid).update({
      lastDigestSentAt: FieldValue.serverTimestamp(),
      lastDigestId: digestId,
    });

    logger.info('updateLastDigestSent: updated', { uid, digestId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('updateLastDigestSent failed', { uid, digestId, error: message });
    throw error;
  }
}
