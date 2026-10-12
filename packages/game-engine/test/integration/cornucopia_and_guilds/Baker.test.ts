import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Baker', () => {
  it('setup gives each player +1 Coffers in a real 3-player game', () => {
    const game = createGame({ kingdom: ['Baker'], players: ['Alice', 'Bob', 'Cara'] });

    expect(game.alice.coffers).toBe(1);
    expect(game.bob.coffers).toBe(1);
    expect(game.player('Cara').coffers).toBe(1);
  });

  it('adds to the Coffers from setup, and Coffers carry over to later turns', async () => {
    const game = createGame({ kingdom: ['Baker'] });
    game.alice.setHand(['Baker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Baker');
    expect(game.alice.coffers).toBe(2);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.hand).toHaveLength(5);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.coffers).toBe(2);
    expect(game.bob.coffers).toBe(1);
  });

  it("setup gives each of 4 players exactly +1 Coffers, and one player's Candlestick Maker adds only to their own", async () => {
    const game = createGame({ kingdom: ['Baker', 'Candlestick Maker'], players: ['Alice', 'Bob', 'Cara', 'Dave'] });
    game.alice.setHand(['Candlestick Maker', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    expect(['Alice', 'Bob', 'Cara', 'Dave'].map((name) => game.player(name).coffers)).toEqual([1, 1, 1, 1]);
    await game.start();
    await game.playAction('Candlestick Maker');

    expect(['Alice', 'Bob', 'Cara', 'Dave'].map((name) => game.player(name).coffers)).toEqual([2, 1, 1, 1]);
  });

  it('played twice by Throne Room with a short deck, draws what it can and gives +2 Actions and +2 Coffers', async () => {
    const game = createGame({ kingdom: ['Baker', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Baker']);
    game.alice.setDeck(['Gold']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Baker');

    expect(game.alice.hand).toEqual(['Gold']);
    expect(game.alice.actions).toBe(2);
    // 1 from setup, 2 from the two plays
    expect(game.alice.coffers).toBe(3);
  });
});
