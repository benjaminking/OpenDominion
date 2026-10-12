import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Candlestick Maker', () => {
  it('gives a usable +1 Buy, and its Coffers carry over to the next turn', async () => {
    const game = createGame({ kingdom: ['Candlestick Maker'] });
    game.alice.setHand(['Candlestick Maker', 'Silver', 'Silver', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Candlestick Maker');
    expect(game.alice.actions).toBe(1);
    await game.playAllTreasures();
    await game.buy('Silver');
    await game.buy('Copper');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Silver', 'Copper']));
    expect(game.alice.coffers).toBe(1);
  });

  it('played twice by Throne Room, gives +2 Actions, +2 Buys and +2 Coffers', async () => {
    const game = createGame({ kingdom: ['Candlestick Maker', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Candlestick Maker']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Candlestick Maker');

    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(3);
    expect(game.alice.coffers).toBe(2);
  });
});
