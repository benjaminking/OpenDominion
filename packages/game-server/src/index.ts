import express, { Express, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer, Server } from 'http';
import path from 'path';

import { authRouter } from './auth/auth.routes';
import { serverConfig } from './config';
import { connectMongo } from './db/mongo';
import { verifyAccessToken } from './auth/tokens';
import { GameRuntimeService } from './game/game-runtime.service';
import { createTableRouter } from './tables/table.routes';
import { TableService } from './tables/table.service';
import { OnlineUserTracker } from './users/online-user-tracker';
import { createUsersRouter } from './users/users.routes';

// Prevent the server from crashing on unhandled errors so game-engine bugs
// don't take down the whole process.
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION (server kept alive):', err);
});
process.on('unhandledRejection', (reason: unknown) => {
  console.error('UNHANDLED REJECTION (server kept alive):', reason);
});

const app: Express = express();
const tableService: TableService = new TableService();
const gameRuntimeService: GameRuntimeService = new GameRuntimeService();
const onlineUserTracker: OnlineUserTracker = new OnlineUserTracker();

// Create an HTTP server
const server: Server = createServer(app);

// Create a WebSocket server attached to the HTTP server
const wss: WebSocketServer = new WebSocketServer({ server });

// Middleware
app.use(express.json());

// Routes
app.get('/health', (req: Request, res: Response): void => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/tables', createTableRouter(gameRuntimeService, onlineUserTracker));
app.use('/api/users', createUsersRouter(onlineUserTracker));

// Serve the Angular client static files from dominion-web-client/dist
//const projectRoot: string = dirname(fileURLToPath(import.meta.url));
//const distPath: string = new URL('../dominion-web-client/dist', import.meta.url).pathname;
const distPath: string = path.join(__dirname, '../../web-client/dist');

app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.get('/index.html', (req: Request, res: Response): void => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use(express.static(path.join(__dirname, '../assets')));

app.get('*', (req: Request, res: Response, next): void => {
  if (req.path.startsWith('/api/')) {
    next();
    return;
  }

  if (path.extname(req.path)) {
    next();
    return;
  }

  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Lobby WebSocket connections (keyed by userId) ─────────────────────────
const lobbyConnections = new Map<string, WebSocket>();

// WebSocket connection handling
wss.on('connection', async (ws: WebSocket, request): Promise<void> => {
  const url: URL = new URL(request.url ?? '/', `http://${request.headers.host}`);
  const accessToken: string | null = url.searchParams.get('accessToken');
  const tableId: string | null = url.searchParams.get('tableId');

  if (!accessToken) {
    ws.close(1008, 'Missing auth token');
    return;
  }

  let userId: string;
  let username: string;
  try {
    const payload = verifyAccessToken(accessToken);
    userId = payload.sub;
    username = payload.username;
  } catch (error: unknown) {
    ws.close(1008, 'Invalid access token');
    return;
  }

  // ── Lobby connection (no tableId) ─────────────────────────────────────────
  if (!tableId) {
    lobbyConnections.set(userId, ws);
    onlineUserTracker.registerSocket(userId, username);

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          type?: string;
          content?: { recipientUserId?: unknown; text?: unknown };
        };
        if (msg.type === 'dm') {
          const recipientUserId =
            typeof msg.content?.recipientUserId === 'string' ? msg.content.recipientUserId : '';
          const rawText = msg.content?.text;
          const text = typeof rawText === 'string' ? rawText.trim().slice(0, 500) : '';
          if (!recipientUserId || !text || recipientUserId === userId) return;
          const recipientWs = lobbyConnections.get(recipientUserId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            recipientWs.send(
              JSON.stringify({
                type: 'dm',
                content: { senderUserId: userId, senderUsername: username, text, timestamp: Date.now() },
              }),
            );
          }
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      lobbyConnections.delete(userId);
      onlineUserTracker.unregisterSocket(userId);
    });

    ws.on('error', (error: Error): void => {
      console.error('Lobby WebSocket error:', error);
    });

    return;
  }

  // ── Table connection ───────────────────────────────────────────────────────
  const table = await tableService.getTable(tableId);
  if (!table) {
    ws.close(1008, 'Table not found');
    return;
  }

  const isAssignedToTable: boolean = table.seats.some((seat) => !seat.isBot && seat.userId === userId);
  if (!isAssignedToTable) {
    ws.close(1008, 'You are not seated at this table');
    return;
  }

  if (table.status !== 'OPEN') {
    ws.close(1008, 'Table is not accepting connections');
    return;
  }

  gameRuntimeService.registerWaitingConnection(table.id, userId, ws);
  onlineUserTracker.registerSocket(userId, username);

  ws.send(
    JSON.stringify({
      type: 'TABLE_CONNECTED',
      tableId: table.id,
      username,
    }),
  );

  ws.on('message', (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString()) as { type?: string; content?: { text?: unknown } };
      if (msg.type === 'chat') {
        const rawText = msg.content?.text;
        const text = typeof rawText === 'string' ? rawText.trim().slice(0, 500) : '';
        if (!text) return;
        gameRuntimeService.broadcastToTable(tableId, {
          type: 'chat',
          content: { username, text, timestamp: Date.now() },
        });
      }
    } catch {
      // ignore malformed messages
    }
  });

  // Handle client disconnect
  ws.on('close', async (): Promise<void> => {
    onlineUserTracker.unregisterSocket(userId);

    const currentTable = await tableService.getTable(tableId);
    if (currentTable && currentTable.ownerUserId === userId && currentTable.status === 'OPEN') {
      await tableService.deleteTable(tableId);
      console.log(`Table ${tableId} deleted because owner ${username} disconnected.`);
    } else {
      console.log('Client disconnected');
    }
  });

  // Handle errors
  ws.on('error', (error: Error): void => {
    console.error('WebSocket error:', error);
  });
});

// Start the server
async function startServer(): Promise<void> {
  await connectMongo();

  server.listen(serverConfig.port, () => {
    console.log(`Server is running on http://localhost:${serverConfig.port}`);
    console.log(`WebSocket server is running on ws://localhost:${serverConfig.port}`);
  });
}

startServer().catch((error: unknown) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export { app, server, wss };
