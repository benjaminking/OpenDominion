import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlayerSpecification } from '../src/players';
import { Player } from '../src/players/Player';

const sharedGameStateModule = vi.hoisted(() => {
  const instances: {
    communicateInitialState: ReturnType<typeof vi.fn>;
    prepareForStartOfGame: ReturnType<typeof vi.fn>;
    startGame: ReturnType<typeof vi.fn>;
    getGameResult: ReturnType<typeof vi.fn>;
  }[] = [];
  const SharedGameState = vi.fn(function MockSharedGameState() {
    const instance = {
      communicateInitialState: vi.fn(),
      prepareForStartOfGame: vi.fn(async () => undefined),
      startGame: vi.fn(async () => undefined),
      getGameResult: vi.fn(() => ({ playerResults: [] })),
    };
    instances.push(instance);
    return instance;
  });

  return {
    instances,
    SharedGameState,
  };
});

vi.mock('../src/SharedGameState', () => ({
  SharedGameState: sharedGameStateModule.SharedGameState,
}));

import { Game } from '../src/Game';

type FakePlayer = Player & {
  communicateInitialState: ReturnType<typeof vi.fn>;
  getName: ReturnType<typeof vi.fn>;
};

const createPlayer = (name: string): FakePlayer => {
  return {
    communicateInitialState: vi.fn(),
    getName: vi.fn(() => name),
  } as unknown as FakePlayer;
};

const createPlayerSpecification = (player: FakePlayer): PlayerSpecification => {
  return {
    toPlayer: vi.fn(() => player),
  } as unknown as PlayerSpecification;
};

afterEach(() => {
  sharedGameStateModule.instances.length = 0;
  vi.restoreAllMocks();
});

describe('Game', () => {
  it('delegates player indexing and player-order randomization to AllPlayers', () => {
    const alice = createPlayer('Alice');
    const bob = createPlayer('Bob');
    const game = new Game([createPlayerSpecification(alice), createPlayerSpecification(bob)]);
    const allPlayers = (game as unknown as { allPlayers: Game['getPlayers'] extends () => infer T ? T : never })
      .allPlayers;
    const randomizeOrderSpy = vi.spyOn(allPlayers, 'randomizeOrder');

    expect(game.getPlayerIndex(bob)).toBe(1);

    game.choosePlayerOrder();

    expect(randomizeOrderSpy).toHaveBeenCalledTimes(1);
  });

  it('prepares the game before broadcasting and starting the first turn', async () => {
    const alice = createPlayer('Alice');
    const bob = createPlayer('Bob');
    const game = new Game([createPlayerSpecification(alice), createPlayerSpecification(bob)]);
    const gameState = sharedGameStateModule.instances[0];
    const internals = game as unknown as {
      allPlayers: { communicateInitialState: () => void };
      messageBroadcaster: { resumeBroadcasting: () => void };
    };
    const callOrder: string[] = [];

    vi.spyOn(gameState, 'prepareForStartOfGame').mockImplementation(async () => {
      callOrder.push('prepare');
    });
    vi.spyOn(internals.messageBroadcaster, 'resumeBroadcasting').mockImplementation(() => {
      callOrder.push('resume');
    });
    vi.spyOn(gameState, 'communicateInitialState').mockImplementation(() => {
      callOrder.push('state-communicate');
    });
    vi.spyOn(internals.allPlayers, 'communicateInitialState').mockImplementation(() => {
      callOrder.push('players-communicate');
    });
    vi.spyOn(gameState, 'startGame').mockImplementation(async () => {
      callOrder.push('start');
    });
    vi.spyOn(gameState, 'getGameResult').mockReturnValue({ playerResults: [] });

    await game.runGame();

    expect(callOrder).toEqual(['prepare', 'resume', 'state-communicate', 'players-communicate', 'start']);
  });
});
