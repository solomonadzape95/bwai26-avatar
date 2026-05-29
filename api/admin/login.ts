import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkPassword } from '../_lib/auth.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  const body = (req.body ?? {}) as { password?: unknown };
  const password = typeof body.password === 'string' ? body.password : undefined;
  console.log(
    "env keys with ADMIN:",
    Object.keys(process.env).filter((k) => k.includes("ADMIN")),
  );
  console.log("cwd:", process.cwd());
  if (!checkPassword(password)) {
    return res.status(401).json({ error: 'invalid password' });
  }
  return res.status(200).json({ token: password });
}
