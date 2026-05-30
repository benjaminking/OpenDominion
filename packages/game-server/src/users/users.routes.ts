import { Router, Response } from 'express';
import { z } from 'zod';

import { requireAuth } from '../auth/auth.middleware';
import { hashPassword, verifyPassword } from '../auth/password';
import { AvatarData, UserModel } from '../models/User';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';
import { OnlineUserTracker } from './online-user-tracker';

const avatarCropSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  s: z.number().min(0.02).max(1),
  ratio: z.number().min(0.1).max(20),
});

const avatarUpdateSchema = z.object({
  cardName: z.string().trim().min(1).max(100),
  crop: avatarCropSchema,
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(4).max(128),
});

interface UserListEntry {
  id: string;
  username: string;
  online: boolean;
  avatar?: AvatarData;
}

export interface UserProfile {
  id: string;
  username: string;
  online: boolean;
  avatar?: AvatarData;
}

export function createUsersRouter(onlineUserTracker: OnlineUserTracker): Router {
  const usersRouter: Router = Router();

  usersRouter.use(requireAuth);

  usersRouter.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (req.authUser) {
        onlineUserTracker.markSeen(req.authUser.userId, req.authUser.username);
      }

      const users = await UserModel.find({}, { username: 1, avatar: 1 }).sort({ username: 1 }).lean();

      const payload: UserListEntry[] = users.map((user) => {
        const userId: string = String(user._id);
        return {
          id: userId,
          username: String(user.username),
          online: onlineUserTracker.isOnline(userId),
          avatar: user.avatar,
        };
      });

      res.json({ users: payload });
    } catch (error: unknown) {
      console.error('Failed to list users:', error);
      res.status(500).json({ error: 'Failed to list users' });
    }
  });

  // PUT /me/password — change own password
  usersRouter.put('/me/password', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.authUser!.userId;
      const { currentPassword, newPassword } = passwordChangeSchema.parse(req.body);

      const user = await UserModel.findById(userId, { passwordHash: 1 }).lean();
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const valid = await verifyPassword(currentPassword, String(user.passwordHash));
      if (!valid) {
        res.status(400).json({ error: 'Current password is incorrect' });
        return;
      }

      const newHash = await hashPassword(newPassword);
      await UserModel.updateOne({ _id: userId }, { $set: { passwordHash: newHash } });
      res.json({ success: true });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid request: new password must be at least 4 characters' });
        return;
      }
      console.error('Failed to change password:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // PUT /me/avatar must come before /:userId to avoid "me" matching as a userId
  usersRouter.put('/me/avatar', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.authUser!.userId;
      const avatarData = avatarUpdateSchema.parse(req.body);
      await UserModel.updateOne({ _id: userId }, { $set: { avatar: avatarData } });
      res.json({ avatar: avatarData });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid avatar data' });
        return;
      }
      console.error('Failed to update avatar:', error);
      res.status(500).json({ error: 'Failed to update avatar' });
    }
  });

  usersRouter.get('/me', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.authUser!.userId;
      const user = await UserModel.findById(userId, { username: 1, avatar: 1 }).lean();
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      const profile: UserProfile = {
        id: userId,
        username: String(user.username),
        online: onlineUserTracker.isOnline(userId),
        avatar: user.avatar,
      };
      res.json({ user: profile });
    } catch (error: unknown) {
      console.error('Failed to get profile:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  });

  usersRouter.get('/:userId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const user = await UserModel.findById(userId, { username: 1, avatar: 1 }).lean();
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      const resolvedId = String(user._id);
      const profile: UserProfile = {
        id: resolvedId,
        username: String(user.username),
        online: onlineUserTracker.isOnline(resolvedId),
        avatar: user.avatar,
      };
      res.json({ user: profile });
    } catch (error: unknown) {
      console.error('Failed to get user profile:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  });

  return usersRouter;
}
