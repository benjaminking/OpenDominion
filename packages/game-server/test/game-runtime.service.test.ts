import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GameResult } from '@dominion/common';

const { gameInitializerMock, gameInitializerInstances, playerSpecificationMock, webClientMock, botClientMock } =
  vi.hoisted(() => {
    const gameInitializerInstancesLocal: Array<{ runGame: ReturnType<typeof vi.fn> }> = [];
    return {
      gameInitializerMock: vi.fn(function (
        this: object,
        players: unknown[],
        requiredCardNames: string[],
        options?: { useColoniesPlatinum?: boolean; useShelters?: boolean },
      ) {
        const instance = {
          players,
          requiredCardNames,
          options,
          runGame: vi.fn(),
        };
        gameInitializerInstancesLocal.push(instance);
        return instance;
      }),
      gameInitializerInstances: gameInitializerInstancesLocal,
      playerSpecificationMock: vi.fn(function (this: object, name: string, client: unknown, isBot?: boolean) {
        Object.assign(this, { name, client, isBot: isBot ?? false });
      }),
      webClientMock: vi.fn(function (this: object, ws: unknown) {
        Object.assign(this, { ws });
      }),
      botClientMock: vi.fn(function (this: object) {
        Object.assign(this, { kind: 'bot' });
      }),
    };
  });

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

import { GameRuntimeService } from '../src/game/game-runtime.service';

describe('GameRuntimeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gameInitializerInstances.length = 0;
  });

  it('starts a game from seated humans and bots and clears waiting connections', () => {
    const service = new GameRuntimeService();
    const aliceSocket = {
      on: vi.fn(),
      send: vi.fn(),
      readyState: 1,
    };
    const bobSocket = {
      on: vi.fn(),
      send: vi.fn(),
      readyState: 1,
    };

    service.registerWaitingConnection('table-1', 'alice', aliceSocket as never);
    service.registerWaitingConnection('table-1', 'bob', bobSocket as never);

    const table = {
      id: 'table-1',
      name: 'Friendly Table',
      ownerUserId: 'alice',
      ownerUsername: 'alice',
      status: 'OPEN',
      maxPlayers: 3,
      requiredCardNames: ['Village'],
      useColoniesPlatinum: false,
      useShelters: false,
      rematch: {
        acceptedUserIds: [],
        unavailable: false,
      },
      seats: [
        { seatIndex: 0, userId: 'alice', username: 'alice', isBot: false },
        { seatIndex: 1, userId: 'bob', username: 'bob', isBot: false },
        { seatIndex: 2, username: 'MilitiaBMBot', isBot: true },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(service.canStartTable(table)).toBe(true);
    service.startTableGame(table);

    expect(gameInitializerMock).toHaveBeenCalledWith(expect.any(Array), ['Village'], {
      useColoniesPlatinum: false,
      useShelters: false,
    });
    expect(webClientMock).toHaveBeenCalledWith(aliceSocket);
    expect(webClientMock).toHaveBeenCalledWith(bobSocket);
    expect(botClientMock).toHaveBeenCalledTimes(1);
    expect(gameInitializerInstances[0].runGame).toHaveBeenCalledTimes(1);
    expect(service.isTableStarted('table-1')).toBe(true);
  });

  it('allows starting a rematch after the previous game completes', async () => {
    const service = new GameRuntimeService();
    const aliceSocket = {
      on: vi.fn(),
      send: vi.fn(),
      readyState: 1,
    };
    const bobSocket = {
      on: vi.fn(),
      send: vi.fn(),
      readyState: 1,
    };

    service.registerWaitingConnection('table-1', 'alice', aliceSocket as never);
    service.registerWaitingConnection('table-1', 'bob', bobSocket as never);

    const table = {
      id: 'table-1',
      name: 'Friendly Table',
      ownerUserId: 'alice',
      ownerUsername: 'alice',
      status: 'OPEN',
      maxPlayers: 2,
      requiredCardNames: [],
      useColoniesPlatinum: false,
      useShelters: false,
      rematch: {
        acceptedUserIds: [],
        unavailable: false,
      },
      seats: [
        { seatIndex: 0, userId: 'alice', username: 'alice', isBot: false },
        { seatIndex: 1, userId: 'bob', username: 'bob', isBot: false },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result: GameResult = { playerResults: [] };
    gameInitializerMock.mockImplementationOnce(function (
      this: object,
      players: unknown[],
      requiredCardNames: string[],
      options?: { useColoniesPlatinum?: boolean; useShelters?: boolean },
    ) {
      const instance = {
        players,
        requiredCardNames,
        options,
        runGame: vi.fn().mockResolvedValue(result),
      };
      gameInitializerInstances.push(instance);
      return instance;
    });

    service.startTableGame(table);

    // Allow runGame promise handlers to execute.
    await Promise.resolve();
    await Promise.resolve();

    expect(service.isTableStarted('table-1')).toBe(false);
    expect(service.canStartTable(table)).toBe(true);
    expect(() => service.startTableGame(table)).not.toThrow();
  });

  it('reports when a table cannot start because a player is missing', () => {
    const service = new GameRuntimeService();
    service.registerWaitingConnection('table-1', 'alice', { on: vi.fn(), send: vi.fn() } as never);

    const table = {
      id: 'table-1',
      seats: [
        { seatIndex: 0, userId: 'alice', username: 'alice', isBot: false },
        { seatIndex: 1, userId: 'bob', username: 'bob', isBot: false },
      ],
    };

    expect(service.canStartTable(table as never)).toBe(false);
    expect(() => service.startTableGame(table as never)).toThrow('All human players must be connected before starting');
  });

  describe('broadcastToTable', () => {
    it('sends a JSON-encoded message to all open connections for a table', () => {
      const service = new GameRuntimeService();
      const aliceSocket = { on: vi.fn(), send: vi.fn(), readyState: 1 }; // OPEN
      const bobSocket = { on: vi.fn(), send: vi.fn(), readyState: 1 }; // OPEN
      service.registerWaitingConnection('table-1', 'alice', aliceSocket as never);
      service.registerWaitingConnection('table-1', 'bob', bobSocket as never);

      service.broadcastToTable('table-1', {
        type: 'chat',
        content: { username: 'alice', text: 'hello', timestamp: 1 },
      });

      const expected = JSON.stringify({ type: 'chat', content: { username: 'alice', text: 'hello', timestamp: 1 } });
      expect(aliceSocket.send).toHaveBeenCalledWith(expected);
      expect(bobSocket.send).toHaveBeenCalledWith(expected);
    });

    it('skips connections whose socket is not in the OPEN state', () => {
      const service = new GameRuntimeService();
      const openSocket = { on: vi.fn(), send: vi.fn(), readyState: 1 }; // OPEN
      const closedSocket = { on: vi.fn(), send: vi.fn(), readyState: 3 }; // CLOSED
      service.registerWaitingConnection('table-1', 'alice', openSocket as never);
      service.registerWaitingConnection('table-1', 'bob', closedSocket as never);

      service.broadcastToTable('table-1', { type: 'ping' });

      expect(openSocket.send).toHaveBeenCalledTimes(1);
      expect(closedSocket.send).not.toHaveBeenCalled();
    });

    it('does nothing when no connections are registered for the table', () => {
      const service = new GameRuntimeService();
      expect(() => service.broadcastToTable('no-such-table', { type: 'ping' })).not.toThrow();
    });
  });
});
