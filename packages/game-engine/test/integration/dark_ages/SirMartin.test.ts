import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Sir Martin', () => {
  it('gives +2 Buys that can all be used', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Sir Martin');
    await game.playAllTreasures();
    expect(game.alice.buys).toBe(3);
    await game.buy('Estate');
    await game.buy('Estate');
    await game.buy('Copper');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Estate', 'Estate', 'Copper']));
  });

  it("costs $4, so it can be trashed by another player's Knight", async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Dame Sylvia', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Copper', 'Sir Martin', ...COPPERS]);

    await game.start();
    await game.playAction('Dame Sylvia');

    expect(game.trash).toEqual(['Sir Martin', 'Dame Sylvia']);
  });
});
