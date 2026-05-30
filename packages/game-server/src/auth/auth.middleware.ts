import { NextFunction, Response } from 'express';

import { verifyAccessToken } from './tokens';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authorization: string | undefined = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }

  const token: string = authorization.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.authUser = {
      userId: payload.sub,
      username: payload.username,
    };
    next();
  } catch (error: unknown) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
