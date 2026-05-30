import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { serverConfig } from '../config';

export interface AccessTokenPayload {
  sub: string;
  username: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
  refreshTokenExpiresAt: Date;
  accessTokenExpiresInSeconds: number;
}

export function createAuthTokens(userId: string, username: string): AuthTokens {
  const accessToken: string = jwt.sign({ username }, serverConfig.jwtAccessSecret, {
    subject: userId,
    expiresIn: serverConfig.jwtAccessExpiresInSeconds,
  });

  const refreshTokenPlain: string = crypto.randomBytes(48).toString('hex');
  const refreshToken: string = jwt.sign({ token: refreshTokenPlain }, serverConfig.jwtRefreshSecret, {
    subject: userId,
    expiresIn: serverConfig.jwtRefreshExpiresInSeconds,
  });

  const refreshTokenHash: string = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const refreshTokenExpiresAt: Date = new Date(Date.now() + serverConfig.jwtRefreshExpiresInSeconds * 1000);

  return {
    accessToken,
    refreshToken,
    refreshTokenHash,
    refreshTokenExpiresAt,
    accessTokenExpiresInSeconds: serverConfig.jwtAccessExpiresInSeconds,
  };
}

export function hashRefreshToken(refreshToken: string): string {
  return crypto.createHash('sha256').update(refreshToken).digest('hex');
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload: JwtPayload | string = jwt.verify(token, serverConfig.jwtAccessSecret);

  if (typeof payload === 'string' || !payload.sub || typeof payload.username !== 'string') {
    throw new Error('Invalid access token payload');
  }

  return {
    sub: payload.sub,
    username: payload.username,
  };
}

export function verifyRefreshToken(refreshToken: string): { sub: string } {
  const payload: JwtPayload | string = jwt.verify(refreshToken, serverConfig.jwtRefreshSecret);

  if (typeof payload === 'string' || !payload.sub) {
    throw new Error('Invalid refresh token payload');
  }

  return {
    sub: payload.sub,
  };
}
