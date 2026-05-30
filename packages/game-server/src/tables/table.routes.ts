import { Router, Response } from 'express';
import { z } from 'zod';

import { requireAuth } from '../auth/auth.middleware';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';
import { GameRuntimeService } from '../game/game-runtime.service';
import { OnlineUserTracker } from '../users/online-user-tracker';
import { TableService } from './table.service';

function createTableRouter(gameRuntimeService: GameRuntimeService, onlineUserTracker: OnlineUserTracker): Router {
  const tableRouter: Router = Router();
  const tableService: TableService = new TableService();

  function sendError(res: Response, error: unknown): void {
    if (error instanceof z.ZodError) {
      const message: string = error.issues[0]?.message ?? 'Invalid request payload';
      res.status(400).json({ error: message });
      return;
    }

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (
        error.message.includes('Only the table owner') ||
        error.message.includes('cannot kick') ||
        error.message.includes('Cannot transfer ownership')
      ) {
        res.status(403).json({ error: error.message });
        return;
      }

      if (
        error.message.includes('full') ||
        error.message.includes('required') ||
        error.message.includes('open') ||
        error.message.includes('Rematch') ||
        error.message.includes('rematch') ||
        error.message.includes('lower') ||
        error.message.includes('found in table') ||
        error.message.includes('Seat index') ||
        error.message.includes('seat') ||
        error.message.includes('filled')
      ) {
        res.status(400).json({ error: error.message });
        return;
      }
    }

    console.error('Table route failed:', error);
    res.status(500).json({ error: 'Table operation failed' });
  }

  tableRouter.use(requireAuth);
  tableRouter.use((req: AuthenticatedRequest, _res: Response, next): void => {
    if (req.authUser) {
      onlineUserTracker.markSeen(req.authUser.userId, req.authUser.username);
    }

    next();
  });

  tableRouter.get('/', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const tables = await tableService.listOpenTables();
      res.json({ tables });
    } catch (error: unknown) {
      sendError(res, error);
    }
  });

  tableRouter.get('/:tableId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const table = await tableService.getTable(req.params.tableId);

      if (!table) {
        res.status(404).json({ error: 'Table not found' });
        return;
      }

      res.json({ table });
    } catch (error: unknown) {
      sendError(res, error);
    }
  });

  tableRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const table = await tableService.createTable(req.authUser, req.body);
      res.status(201).json({ table });
    } catch (error: unknown) {
      sendError(res, error);
    }
  });

  tableRouter.post('/:tableId/join', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const table = await tableService.joinTable(req.authUser, { tableId: req.params.tableId });
      res.json({ table });
    } catch (error: unknown) {
      sendError(res, error);
    }
  });

  tableRouter.post('/:tableId/leave', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const table = await tableService.leaveTable(req.authUser, req.params.tableId);
      res.json({ table });
    } catch (error: unknown) {
      sendError(res, error);
    }
  });

  tableRouter.patch('/:tableId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const table = await tableService.updateTableSettings(req.authUser, req.params.tableId, req.body);
      res.json({ table });
    } catch (error: unknown) {
      sendError(res, error);
    }
  });

  tableRouter.post('/:tableId/kick', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const table = await tableService.kickPlayer(req.authUser, {
        tableId: req.params.tableId,
        userId: req.body.userId,
      });
      res.json({ table });
    } catch (error: unknown) {
      sendError(res, error);
    }
  });

  tableRouter.post('/:tableId/bots', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const table = await tableService.addBot(req.authUser, {
        tableId: req.params.tableId,
        botName: req.body.botName,
      });
      res.json({ table });
    } catch (error: unknown) {
      sendError(res, error);
    }
  });

  tableRouter.delete('/:tableId/bots/:seatIndex', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const table = await tableService.removeBot(req.authUser, {
        tableId: req.params.tableId,
        seatIndex: Number(req.params.seatIndex),
      });
      res.json({ table });
    } catch (error: unknown) {
      sendError(res, error);
    }
  });

  tableRouter.post('/:tableId/start', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const table = await tableService.startTable(req.authUser, req.params.tableId);

      // Respond immediately — do not wait for the game engine to initialise.
      res.json({ table });

      if (gameRuntimeService.canStartTable(table)) {
        try {
          gameRuntimeService.startTableGame(table, (tableId) => {
            tableService.closeTable(tableId).catch((err: unknown) => {
              console.error('Failed to close table after game:', err);
            });
          });
        } catch (engineError: unknown) {
          console.error('Game engine failed to start for table', table.id, engineError);
        }
      }
    } catch (error: unknown) {
      sendError(res, error);
    }
  });

  tableRouter.post('/:tableId/rematch/propose', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const table = await tableService.proposeRematch(req.authUser, req.params.tableId);
      res.json({ table });
    } catch (error: unknown) {
      sendError(res, error);
    }
  });

  tableRouter.post('/:tableId/rematch/accept', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const table = await tableService.acceptRematch(req.authUser, req.params.tableId);
      res.json({ table });
    } catch (error: unknown) {
      sendError(res, error);
    }
  });

  tableRouter.put('/:tableId/seats/:seatIndex', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const table = await tableService.setSeatState(req.authUser, {
        tableId: req.params.tableId,
        seatIndex: Number(req.params.seatIndex),
        state: req.body.state,
        botName: req.body.botName,
      });
      res.json({ table });
    } catch (error: unknown) {
      sendError(res, error);
    }
  });

  tableRouter.delete('/:tableId', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      await tableService.deleteOwnTable(req.authUser, req.params.tableId);
      res.status(204).send();
    } catch (error: unknown) {
      sendError(res, error);
    }
  });

  return tableRouter;
}

export { createTableRouter };
