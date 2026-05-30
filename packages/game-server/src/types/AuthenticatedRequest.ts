import { Request } from 'express';

export interface AuthenticatedUser {
  userId: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthenticatedUser;
}
