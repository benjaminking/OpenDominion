import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = {
  get: vi.fn(),
  use: vi.fn(),
};
const expressJsonMock = vi.fn(() => ({ json: true }));
const expressStaticMock = vi.fn((value: string) => ({ staticPath: value }));
const expressMock = vi.fn(() => appMock);
(expressMock as unknown as { json: typeof expressJsonMock }).json = expressJsonMock;
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

const connectMongoMock = vi.fn(async () => undefined);
const authRouterMock = { name: 'auth-router' };
const createTableRouterMock = vi.fn(() => ({ name: 'table-router' }));
const createUsersRouterMock = vi.fn(() => ({ name: 'users-router' }));
const verifyAccessTokenMock = vi.fn();

const tableServiceInstances: Array<{ getTable: ReturnType<typeof vi.fn> }> = [];
const tableServiceMock = vi.fn(function (this: object) {
  const instance = {
    getTable: vi.fn(),
  };
  tableServiceInstances.push(instance);
  return instance;
});

const runtimeInstances: Array<{
  registerWaitingConnection: ReturnType<typeof vi.fn>;
  broadcastToTable: ReturnType<typeof vi.fn>;
}> = [];
const gameRuntimeServiceMock = vi.fn(function (this: object) {
  const instance = {
    registerWaitingConnection: vi.fn(),
    canStartTable: vi.fn(),
    startTableGame: vi.fn(),
    isTableStarted: vi.fn(),
    broadcastToTable: vi.fn(),
  };
  runtimeInstances.push(instance);
  return instance;
});

vi.mock('express', () => ({
  default: expressMock,
}));

vi.mock('http', () => ({
  createServer: createServerMock,
}));

vi.mock('ws', () => ({
  WebSocketServer: MockWebSocketServer,
  WebSocket: class {
    static readonly OPEN = 1;
  },
}));

vi.mock('../src/db/mongo', () => ({
  connectMongo: connectMongoMock,
}));

vi.mock('../src/auth/auth.routes', () => ({
  authRouter: authRouterMock,
}));

vi.mock('../src/auth/tokens', () => ({
  verifyAccessToken: verifyAccessTokenMock,
}));

vi.mock('../src/tables/table.routes', () => ({
  createTableRouter: createTableRouterMock,
}));

vi.mock('../src/users/users.routes', () => ({
  createUsersRouter: createUsersRouterMock,
}));

vi.mock('../src/tables/table.service', () => ({
  TableService: tableServiceMock,
}));

vi.mock('../src/game/game-runtime.service', () => ({
  GameRuntimeService: gameRuntimeServiceMock,
}));

vi.mock('../src/config', () => ({
  serverConfig: {
    port: 3000,
    mongoUri: 'mongodb://example',
    jwtAccessSecret: 'access',
    jwtRefreshSecret: 'refresh',
    jwtAccessExpiresInSeconds: 60,
    jwtRefreshExpiresInSeconds: 120,
  },
}));

describe('game-server index', () => {
  const originalDirname = (globalThis as Record<string, unknown>).__dirname;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    wsServerHandlers.clear();
    tableServiceInstances.length = 0;
    runtimeInstances.length = 0;
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

  it('bootstraps express, auth routes, table routes, and Mongo connection', async () => {
    const module = await import('../src/index');

    expect(module.app).toBe(appMock);
    expect(module.server).toBe(serverMock);
    expect(connectMongoMock).toHaveBeenCalledTimes(1);
    expect(expressMock).toHaveBeenCalledTimes(1);
    expect(createServerMock).toHaveBeenCalledWith(appMock);
    expect(serverMock.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(appMock.get).toHaveBeenCalledWith('/health', expect.any(Function));
    expect(appMock.get).toHaveBeenCalledWith('/index.html', expect.any(Function));
    expect(appMock.use).toHaveBeenCalledWith('/api/auth', authRouterMock);
    expect(createTableRouterMock).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
    expect(appMock.use).toHaveBeenCalledWith('/api/tables', { name: 'table-router' });
    expect(createUsersRouterMock).toHaveBeenCalledWith(expect.any(Object));
    expect(appMock.use).toHaveBeenCalledWith('/api/users', { name: 'users-router' });
    expect(expressStaticMock).toHaveBeenCalledTimes(2);
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

  it('registers authenticated waiting connections for table sockets', async () => {
    await import('../src/index');

    const connectionHandler = wsServerHandlers.get('connection');
    expect(connectionHandler).toBeTypeOf('function');

    const tableService = tableServiceInstances[0];
    const runtime = runtimeInstances[0];
    tableService.getTable.mockResolvedValue({
      id: 'table-1',
      name: 'Friendly Table',
      ownerUserId: 'alice',
      ownerUsername: 'alice',
      status: 'OPEN',
      maxPlayers: 3,
      requiredCardNames: ['Village'],
      useColoniesPlatinum: false,
      useShelters: false,
      seats: [{ seatIndex: 0, userId: 'alice', username: 'alice', isBot: false }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    verifyAccessTokenMock.mockReturnValue({ sub: 'alice', username: 'alice' });

    const ws = {
      on: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
    };

    await connectionHandler?.(ws, { url: '/?accessToken=test-token&tableId=table-1', headers: { host: 'localhost' } });

    expect(verifyAccessTokenMock).toHaveBeenCalledWith('test-token');
    expect(tableService.getTable).toHaveBeenCalledWith('table-1');
    expect(runtime.registerWaitingConnection).toHaveBeenCalledWith('table-1', 'alice', ws);
    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'TABLE_CONNECTED', tableId: 'table-1', username: 'alice' }),
    );
    expect(ws.on).toHaveBeenCalledWith('close', expect.any(Function));
    expect(ws.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('rejects websocket connections without a valid access token', async () => {
    await import('../src/index');

    const connectionHandler = wsServerHandlers.get('connection');
    const ws = {
      on: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
    };

    verifyAccessTokenMock.mockImplementation(() => {
      throw new Error('invalid token');
    });

    await connectionHandler?.(ws, { url: '/?accessToken=bad&tableId=table-1', headers: { host: 'localhost' } });

    expect(ws.close).toHaveBeenCalledWith(1008, 'Invalid access token');
  });

  it('closes connection when the auth token is absent', async () => {
    await import('../src/index');

    const connectionHandler = wsServerHandlers.get('connection');
    const ws = { on: vi.fn(), send: vi.fn(), close: vi.fn() };

    await connectionHandler?.(ws, { url: '/?tableId=table-1', headers: { host: 'localhost' } });

    expect(ws.close).toHaveBeenCalledWith(1008, 'Missing auth token');
    expect(verifyAccessTokenMock).not.toHaveBeenCalled();
  });

  it('establishes a lobby connection when no tableId is provided', async () => {
    await import('../src/index');

    const connectionHandler = wsServerHandlers.get('connection');
    const runtime = runtimeInstances[0];
    verifyAccessTokenMock.mockReturnValue({ sub: 'alice-id', username: 'alice' });

    const ws = { on: vi.fn(), send: vi.fn(), close: vi.fn() };
    await connectionHandler?.(ws, { url: '/?accessToken=alice-token', headers: { host: 'localhost' } });

    // Should NOT register as a table connection
    expect(runtime.registerWaitingConnection).not.toHaveBeenCalled();
    // Should NOT send TABLE_CONNECTED
    expect(ws.send).not.toHaveBeenCalled();
    // Should attach handlers
    expect(ws.on).toHaveBeenCalledWith('message', expect.any(Function));
    expect(ws.on).toHaveBeenCalledWith('close', expect.any(Function));
    expect(ws.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('relays a DM from a lobby client to the targeted recipient', async () => {
    await import('../src/index');

    const connectionHandler = wsServerHandlers.get('connection');
    verifyAccessTokenMock
      .mockReturnValueOnce({ sub: 'alice-id', username: 'alice' })
      .mockReturnValueOnce({ sub: 'bob-id', username: 'bob' });

    const aliceWs = { on: vi.fn(), send: vi.fn(), close: vi.fn(), readyState: 1 };
    const bobWs = { on: vi.fn(), send: vi.fn(), close: vi.fn(), readyState: 1 };

    await connectionHandler?.(aliceWs, { url: '/?accessToken=alice-token', headers: { host: 'localhost' } });
    await connectionHandler?.(bobWs, { url: '/?accessToken=bob-token', headers: { host: 'localhost' } });

    const aliceMessageHandler = aliceWs.on.mock.calls.find((c) => c[0] === 'message')?.[1] as (raw: Buffer) => void;
    aliceMessageHandler(
      Buffer.from(JSON.stringify({ type: 'dm', content: { recipientUserId: 'bob-id', text: 'Hello bob!' } })),
    );

    expect(bobWs.send).toHaveBeenCalledTimes(1);
    const sentPayload = JSON.parse(bobWs.send.mock.calls[0][0] as string) as {
      type: string;
      content: { senderUserId: string; senderUsername: string; text: string; timestamp: number };
    };
    expect(sentPayload.type).toBe('dm');
    expect(sentPayload.content.senderUserId).toBe('alice-id');
    expect(sentPayload.content.senderUsername).toBe('alice');
    expect(sentPayload.content.text).toBe('Hello bob!');
    expect(sentPayload.content.timestamp).toBeTypeOf('number');
    // Sender should not receive an echo
    expect(aliceWs.send).not.toHaveBeenCalled();
  });

  it('stops relaying DMs to a lobby client after they disconnect', async () => {
    await import('../src/index');

    const connectionHandler = wsServerHandlers.get('connection');
    verifyAccessTokenMock
      .mockReturnValueOnce({ sub: 'alice-id', username: 'alice' })
      .mockReturnValueOnce({ sub: 'bob-id', username: 'bob' });

    const aliceWs = { on: vi.fn(), send: vi.fn(), close: vi.fn(), readyState: 1 };
    const bobWs = { on: vi.fn(), send: vi.fn(), close: vi.fn(), readyState: 1 };

    await connectionHandler?.(aliceWs, { url: '/?accessToken=alice-token', headers: { host: 'localhost' } });
    await connectionHandler?.(bobWs, { url: '/?accessToken=bob-token', headers: { host: 'localhost' } });

    // Disconnect Bob
    const bobCloseHandler = bobWs.on.mock.calls.find((c) => c[0] === 'close')?.[1] as () => void;
    bobCloseHandler();

    // Alice sends DM to the now-disconnected Bob
    const aliceMessageHandler = aliceWs.on.mock.calls.find((c) => c[0] === 'message')?.[1] as (raw: Buffer) => void;
    aliceMessageHandler(
      Buffer.from(JSON.stringify({ type: 'dm', content: { recipientUserId: 'bob-id', text: 'Hello?' } })),
    );

    expect(bobWs.send).not.toHaveBeenCalled();
  });

  it('ignores lobby DMs with empty text, self-targeting, or an unknown recipient', async () => {
    await import('../src/index');

    const connectionHandler = wsServerHandlers.get('connection');
    verifyAccessTokenMock.mockReturnValue({ sub: 'alice-id', username: 'alice' });

    const aliceWs = { on: vi.fn(), send: vi.fn(), close: vi.fn(), readyState: 1 };
    await connectionHandler?.(aliceWs, { url: '/?accessToken=alice-token', headers: { host: 'localhost' } });

    const aliceMessageHandler = aliceWs.on.mock.calls.find((c) => c[0] === 'message')?.[1] as (raw: Buffer) => void;

    // Empty text (whitespace only)
    aliceMessageHandler(
      Buffer.from(JSON.stringify({ type: 'dm', content: { recipientUserId: 'bob-id', text: '   ' } })),
    );
    // Self-DM
    aliceMessageHandler(
      Buffer.from(JSON.stringify({ type: 'dm', content: { recipientUserId: 'alice-id', text: 'Hello me' } })),
    );
    // Recipient not connected
    aliceMessageHandler(
      Buffer.from(JSON.stringify({ type: 'dm', content: { recipientUserId: 'nobody-id', text: 'Hello?' } })),
    );
    // Missing recipientUserId field
    aliceMessageHandler(Buffer.from(JSON.stringify({ type: 'dm', content: { text: 'Hello?' } })));

    expect(aliceWs.send).not.toHaveBeenCalled();
  });

  it('broadcasts table chat messages to all waiting connections via GameRuntimeService', async () => {
    await import('../src/index');

    const connectionHandler = wsServerHandlers.get('connection');
    const runtime = runtimeInstances[0];
    const tableService = tableServiceInstances[0];

    tableService.getTable.mockResolvedValue({
      id: 'table-1',
      name: 'Chat Table',
      ownerUserId: 'alice',
      ownerUsername: 'alice',
      status: 'OPEN',
      maxPlayers: 2,
      requiredCardNames: [],
      useColoniesPlatinum: false,
      useShelters: false,
      seats: [{ seatIndex: 0, userId: 'alice', username: 'alice', isBot: false }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    verifyAccessTokenMock.mockReturnValue({ sub: 'alice', username: 'alice' });

    const ws = { on: vi.fn(), send: vi.fn(), close: vi.fn() };
    await connectionHandler?.(ws, { url: '/?accessToken=alice-token&tableId=table-1', headers: { host: 'localhost' } });

    const messageHandler = ws.on.mock.calls.find((c) => c[0] === 'message')?.[1] as (raw: Buffer) => void;
    messageHandler(Buffer.from(JSON.stringify({ type: 'chat', content: { text: 'Hello table!' } })));

    expect(runtime.broadcastToTable).toHaveBeenCalledTimes(1);
    const [broadcastedTableId, broadcastedPayload] = runtime.broadcastToTable.mock.calls[0] as [
      string,
      { type: string; content: { username: string; text: string; timestamp: number } },
    ];
    expect(broadcastedTableId).toBe('table-1');
    expect(broadcastedPayload.type).toBe('chat');
    expect(broadcastedPayload.content.username).toBe('alice');
    expect(broadcastedPayload.content.text).toBe('Hello table!');
    expect(broadcastedPayload.content.timestamp).toBeTypeOf('number');
  });
});
