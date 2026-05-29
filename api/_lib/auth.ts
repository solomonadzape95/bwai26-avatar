import { timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export function checkPassword(provided: string | undefined): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !provided) return false;
  const a = new Uint8Array(Buffer.from(provided));
  const b = new Uint8Array(Buffer.from(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function bearerToken(req: VercelRequest): string | undefined {
  const h = req.headers.authorization;
  if (!h || Array.isArray(h)) return undefined;
  const [scheme, token] = h.split(' ');
  if (scheme?.toLowerCase() !== 'bearer') return undefined;
  return token;
}

export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  if (!checkPassword(bearerToken(req))) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}
