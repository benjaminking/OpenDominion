import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { RefreshTokenModel } from '../models/RefreshToken';
import { UserModel } from '../models/User';
import { hashPassword, verifyPassword } from './password';
import { createAuthTokens, hashRefreshToken, verifyRefreshToken } from './tokens';

const authRouter: Router = Router();

const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores.'),
  password: z.string().min(4).max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

function validationErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? 'Invalid request payload';
  }

  return 'Invalid request payload';
}

authRouter.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = credentialsSchema.parse(req.body);

    const existingUser = await UserModel.findOne({ username }).lean();
    if (existingUser) {
      res.status(409).json({ error: 'Username already in use' });
      return;
    }

    const passwordHash: string = await hashPassword(password);
    const createdUser = await UserModel.create({ username, passwordHash });
    const createdUserId: string = String(createdUser._id);

    const tokens = createAuthTokens(createdUserId, username);
    await RefreshTokenModel.create({
      userId: createdUser._id,
      tokenHash: tokens.refreshTokenHash,
      expiresAt: tokens.refreshTokenExpiresAt,
    });

    res.status(201).json({
      user: {
        id: createdUserId,
        username,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresInSeconds: tokens.accessTokenExpiresInSeconds,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: validationErrorMessage(error) });
      return;
    }

    console.error('Signup failed:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = credentialsSchema.parse(req.body);
    const user = await UserModel.findOne({ username });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const userId: string = String(user._id);
    const resolvedUsername: string = String(user.username);
    const userPasswordHash: string = String(user.passwordHash);

    const isPasswordValid: boolean = await verifyPassword(password, userPasswordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const tokens = createAuthTokens(userId, resolvedUsername);
    await RefreshTokenModel.create({
      userId: user._id,
      tokenHash: tokens.refreshTokenHash,
      expiresAt: tokens.refreshTokenExpiresAt,
    });

    res.json({
      user: {
        id: userId,
        username: resolvedUsername,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresInSeconds: tokens.accessTokenExpiresInSeconds,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: validationErrorMessage(error) });
      return;
    }

    console.error('Login failed:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

authRouter.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const refreshHash: string = hashRefreshToken(refreshToken);

    let verifiedPayload: { sub: string };
    try {
      verifiedPayload = verifyRefreshToken(refreshToken);
    } catch (error: unknown) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    const persistedToken = await RefreshTokenModel.findOne({ tokenHash: refreshHash });

    if (!persistedToken || String(persistedToken.userId) !== verifiedPayload.sub) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const user = await UserModel.findById(verifiedPayload.sub);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const userId: string = String(user._id);
    const username: string = String(user.username);

    await persistedToken.deleteOne();

    const nextTokens = createAuthTokens(userId, username);
    await RefreshTokenModel.create({
      userId: user._id,
      tokenHash: nextTokens.refreshTokenHash,
      expiresAt: nextTokens.refreshTokenExpiresAt,
    });

    res.json({
      user: {
        id: userId,
        username,
      },
      accessToken: nextTokens.accessToken,
      refreshToken: nextTokens.refreshToken,
      accessTokenExpiresInSeconds: nextTokens.accessTokenExpiresInSeconds,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: validationErrorMessage(error) });
      return;
    }

    console.error('Token refresh failed:', error);
    res.status(500).json({ error: 'Refresh failed' });
  }
});

authRouter.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const refreshHash: string = hashRefreshToken(refreshToken);

    await RefreshTokenModel.deleteOne({ tokenHash: refreshHash });

    res.status(204).send();
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: validationErrorMessage(error) });
      return;
    }

    console.error('Logout failed:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export { authRouter };
