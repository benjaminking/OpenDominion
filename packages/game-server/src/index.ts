import express, { Express, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer, Server } from 'http';
import path from 'path';
import { GameInitializer, PlayerSpecification } from '@dominion/game-engine';
import { GameSpecs, WebClient } from '@dominion/web-client-backend';
import { BotClient } from '@dominion/local-bot-client';

const app: Express = express();
const port: number | string = process.env.PORT || 3000;

// Create an HTTP server
const server: Server = createServer(app);

// Create a WebSocket server attached to the HTTP server
const wss: WebSocketServer = new WebSocketServer({ server });

// Middleware
//app.use(express.json());

// Routes
app.get('/health', (req: Request, res: Response): void => {
  res.json({ status: 'ok' });
});

// Serve the Angular client static files from dominion-web-client/dist
//const projectRoot: string = dirname(fileURLToPath(import.meta.url));
//const distPath: string = new URL('../dominion-web-client/dist', import.meta.url).pathname;
const distPath: string = path.join(__dirname, '../../web-client/dist');

app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.get('/index.html', (req: Request, res: Response): void => {
  res.sendFile(new URL(path.join(distPath, 'index.html'), import.meta.url).pathname);
});

//app.get('*', (req: Request, res: Response): void => {
//  res.sendFile(new URL(path.join(distPath, req.url), import.meta.url).pathname);
//});

app.use(express.static(path.join(__dirname, '../assets')));

// WebSocket connection handling
wss.on('connection', (ws: WebSocket): void => {
  console.log('Client connected');

  const gameSpecs: GameSpecs = {
    playerName: 'ben',
    requiredCardNames: [],
  };

  const webPlayer: PlayerSpecification = new PlayerSpecification(gameSpecs.playerName, new WebClient(ws));
  const botPlayer: PlayerSpecification = new PlayerSpecification('MilitiaBMBot', new BotClient(), true);

  const gameInitializer: GameInitializer = new GameInitializer([webPlayer, botPlayer], gameSpecs.requiredCardNames);
  gameInitializer.startGame();

  // Handle incoming messages
  /*ws.on('message', (data: Buffer): void => {
    console.log('Received:', data.toString());
    // Echo the message back to the client
    ws.send(JSON.stringify({ echo: data.toString() }));
  });*/

  // Handle client disconnect
  ws.on('close', (): void => {
    console.log('Client disconnected');
  });

  // Handle errors
  ws.on('error', (error: Error): void => {
    console.error('WebSocket error:', error);
  });

  // Send a welcome message to the client
  ws.send(JSON.stringify({ message: 'Connected to Dominion Game Server' }));
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`WebSocket server is running on ws://localhost:${port}`);
});

export { app, server, wss };
