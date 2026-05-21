import { describe, expect, it, vi } from 'vitest';

import { AllPlayers } from '../../src/players/AllPlayers';
import { Player } from '../../src/players/Player';

type MockPlayer = Player & {
  communicateInitialState: ReturnType<typeof vi.fn>;
  getName: ReturnType<typeof vi.fn>;
  getClient: ReturnType<typeof vi.fn>;
  getStatistics: ReturnType<typeof vi.fn>;
};

const createPlayer = (name: string, score: number, isBot = false): MockPlayer => {
  const client = {
    label: `${name}-client`,
    isBot,
  };
  return {
    communicateInitialState: vi.fn(),
    getClient: vi.fn(() => client),
    getName: vi.fn(() => name),
    getStatistics: vi.fn(() => ({
      getScore: vi.fn(() => score),
    })),
  } as unknown as MockPlayer;
};

describe('AllPlayers', () => {
  it('exposes players by name, index, iteration, and clients while preserving the roster when randomized', () => {
    const alice = createPlayer('Alice', 3);
    const bob = createPlayer('Bob', 5);
    const cara = createPlayer('Cara', 1);
    const allPlayers = new AllPlayers([alice, bob, cara], {} as never);

    expect(allPlayers.numTotalPlayers()).toBe(3);
    expect(allPlayers.getPlayerByName('Bob')).toBe(bob);
    expect(allPlayers.getPlayerByName('Dana')).toBeUndefined();
    expect(allPlayers.getPlayerAtIndex(2)).toBe(cara);
    expect(allPlayers.getPlayerIndexByName('Alice')).toBe(0);
    expect(allPlayers.getPlayerIndexByName('Dana')).toBe(-1);
    expect(allPlayers.getOpponentsOfPlayerByName('Bob')).toEqual([alice, cara]);
    expect(Array.from(allPlayers)).toEqual([alice, bob, cara]);
    expect(allPlayers.getClients()).toEqual([alice.getClient(), bob.getClient(), cara.getClient()]);

    vi.spyOn(Math, 'random').mockReturnValue(0.75);
    allPlayers.randomizeOrder();

    expect(
      allPlayers
        .getAllPlayers()
        .map((player) => player.getName())
        .sort(),
    ).toEqual(['Alice', 'Bob', 'Cara']);
    vi.restoreAllMocks();
  });

  it('communicates initial state to each player', () => {
    const alice = createPlayer('Alice', 3);
    const bob = createPlayer('Bob', 5);
    const allPlayers = new AllPlayers([alice, bob], {} as never);

    allPlayers.communicateInitialState();

    expect(alice.communicateInitialState).toHaveBeenCalledTimes(1);
    expect(bob.communicateInitialState).toHaveBeenCalledTimes(1);
  });

  it('returns the player with the unique highest score as the winner', () => {
    const alice = createPlayer('Alice', 3);
    const bob = createPlayer('Bob', 8);
    const cara = createPlayer('Cara', 5);
    const allPlayers = new AllPlayers([alice, bob, cara], {} as never);

    expect(allPlayers.getHighestScore()).toBe(8);
    expect(allPlayers.getWinningPlayer()).toBe(bob);
  });
});
