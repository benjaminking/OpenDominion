import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = {
  get: vi.fn(),
  use: vi.fn(),
};
const expressStaticMock = vi.fn((value: string) => ({ staticPath: value }));
const expressMock = vi.fn(() => appMock);
(expressMock as unknown as { static: typeof expressStaticMock }).static = expressStaticMock;

const serverMock = {
  listen: vi.fn((port: number | string, callback?: () => void) => {
    callback?.();
    return serverMock;
  }),
};
const createServerMock = vi.fn(() => serverMock);

const wsServerHandlers = new Map<string, (...args: unknown[]) => void>();
class MockWebSocketServer {
  public constructor(public readonly options: unknown) {}

  public on(event: string, handler: (...args: unknown[]) => void): this {
    wsServerHandlers.set(event, handler);
    return this;
  }
}

const playerSpecificationMock = vi.fn(function (this: object, name: string, client: unknown, isBot?: boolean) {
  Object.assign(this, { name, client, isBot: isBot ?? false });
});

const gameInitializerInstances: Array<{ startGame: ReturnType<typeof vi.fn> }> = [];
const gameInitializerMock = vi.fn(function (this: object, players: unknown[], requiredCardNames: string[]) {
  const instance = {
    players,
    requiredCardNames,
    startGame: vi.fn(),
  };
  gameInitializerInstances.push(instance);
  return instance;
});

const webClientMock = vi.fn(function (this: object, ws: unknown) {
  Object.assign(this, { ws });
});

const botClientMock = vi.fn(function (this: object) {
  Object.assign(this, { kind: 'bot' });
});

vi.mock('express', () => ({
  default: expressMock,
}));

vi.mock('http', () => ({
  createServer: createServerMock,
}));

vi.mock('ws', () => ({
  WebSocketServer: MockWebSocketServer,
  WebSocket: class {},
}));

vi.mock('@dominion/game-engine', () => ({
  GameInitializer: gameInitializerMock,
  PlayerSpecification: playerSpecificationMock,
}));

vi.mock('@dominion/web-client-backend', () => ({
  WebClient: webClientMock,
}));

vi.mock('@dominion/local-bot-client', () => ({
  BotClient: botClientMock,
}));

describe('game-server index', () => {
  const originalDirname = (globalThis as Record<string, unknown>).__dirname;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    wsServerHandlers.clear();
    gameInitializerInstances.length = 0;
    (globalThis as Record<string, unknown>).__dirname = '/workspace/packages/game-server/dist';
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalDirname === undefined) {
      delete (globalThis as Record<string, unknown>).__dirname;
    } else {
      (globalThis as Record<string, unknown>).__dirname = originalDirname;
    }
  });

  it('bootstraps express, static routes, websocket server, and listen logging', async () => {
    const module = await import('../src/index');

    expect(module.app).toBe(appMock);
    expect(module.server).toBe(serverMock);
    expect(expressMock).toHaveBeenCalledTimes(1);
    expect(createServerMock).toHaveBeenCalledWith(appMock);
    expect(serverMock.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(appMock.get).toHaveBeenCalledWith('/health', expect.any(Function));
    expect(appMock.get).toHaveBeenCalledWith('/index.html', expect.any(Function));
    expect(expressStaticMock).toHaveBeenCalledTimes(2);
    expect(appMock.use).toHaveBeenNthCalledWith(1, { staticPath: expect.stringContaining('web-client/dist') });
    expect(appMock.use).toHaveBeenNthCalledWith(2, { staticPath: expect.stringContaining('assets') });
    expect(logSpy).toHaveBeenCalledWith('Server is running on http://localhost:3000');
    expect(logSpy).toHaveBeenCalledWith('WebSocket server is running on ws://localhost:3000');

    const healthHandler = appMock.get.mock.calls.find((call) => call[0] === '/health')?.[1] as (
      req: unknown,
      res: { json: (payload: unknown) => void },
    ) => void;
    const json = vi.fn();
    healthHandler({}, { json });
    expect(json).toHaveBeenCalledWith({ status: 'ok' });
  });

  it('creates a game and websocket handlers when a client connects', async () => {
    await import('../src/index');

    const connectionHandler = wsServerHandlers.get('connection');
    expect(connectionHandler).toBeTypeOf('function');

    const ws = {
      on: vi.fn(),
      send: vi.fn(),
    };

    connectionHandler?.(ws);

    expect(logSpy).toHaveBeenCalledWith('Client connected');
    expect(webClientMock).toHaveBeenCalledWith(ws);
    expect(botClientMock).toHaveBeenCalledTimes(1);
    expect(playerSpecificationMock).toHaveBeenNthCalledWith(1, 'ben', expect.any(Object));
    expect(playerSpecificationMock).toHaveBeenNthCalledWith(2, 'MilitiaBMBot', expect.any(Object), true);
    expect(gameInitializerMock).toHaveBeenCalledWith(expect.any(Array), []);
    expect(gameInitializerInstances[0].startGame).toHaveBeenCalledTimes(1);
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ message: 'Connected to Dominion Game Server' }));
    expect(ws.on).toHaveBeenCalledWith('close', expect.any(Function));
    expect(ws.on).toHaveBeenCalledWith('error', expect.any(Function));

    const closeHandler = ws.on.mock.calls.find((call: unknown[]) => call[0] === 'close')?.[1] as () => void;
    const errorHandler = ws.on.mock.calls.find((call: unknown[]) => call[0] === 'error')?.[1] as (error: Error) => void;

    closeHandler();
    expect(logSpy).toHaveBeenCalledWith('Client disconnected');

    const error = new Error('socket failed');
    errorHandler(error);
    expect(errorSpy).toHaveBeenCalledWith('WebSocket error:', error);
  });
});
