import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Laboratory', () => {
  it('draws the only card left, from a shuffled discard pile, and still gives +1 Action', async () => {
    const game = createGame({ kingdom: ['Laboratory'] });
    game.alice.setHand(['Laboratory', 'Copper']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Laboratory');

    expect(game.alice.hand).toEqual(['Copper', 'Gold']);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(1);
  });

  it('draws the last card of the deck and then one from the shuffled discard pile', async () => {
    const game = createGame({ kingdom: ['Laboratory'] });
    game.alice.setHand(['Laboratory']);
    game.alice.setDeck(['Gold']);
    game.alice.setDiscard(['Silver']);

    await game.start();
    await game.playAction('Laboratory');

    expect(game.alice.hand).toEqual(['Gold', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(1);
  });
});
