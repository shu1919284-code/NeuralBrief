import { describe, it, expect } from 'vitest';
import { hashEmail } from '@/lib/hash';

describe('hashEmail', () => {
  it('returns a 64-character hex string (SHA-256)', async () => {
    const result = await hashEmail('user@example.com');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('same email always returns the same hash', async () => {
    const email = 'consistent@example.com';
    const first = await hashEmail(email);
    const second = await hashEmail(email);
    expect(first).toBe(second);
  });

  it('different emails return different hashes', async () => {
    const hashA = await hashEmail('alice@example.com');
    const hashB = await hashEmail('bob@example.com');
    expect(hashA).not.toBe(hashB);
  });

  it('empty string input returns a consistent hash without throwing', async () => {
    const first = await hashEmail('');
    const second = await hashEmail('');
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).toBe(second);
  });
});
