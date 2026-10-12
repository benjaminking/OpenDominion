import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Ruined Market', () => {
  it('gives a second Buy that can be used', async () => {
    const game = createGame({ kingdom: ['Cultist'] });
    game.alice.setHand(['Ruined Market', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Ruined Market');
    await game.playAllTreasures();
    expect(game.alice.buys).toBe(2);
    await game.buy('Estate');
    await game.buy('Estate');

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.discard.filter((name) => name === 'Estate')).toHaveLength(2);
  });

  it('gives +1 Buy when Golem plays it', async () => {
    const game = createGame({ kingdom: ['Cultist', 'Golem'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Ruined Market', 'Ruined Market', ...COPPERS]);

    await game.start();
    await game.playAction('Golem');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Golem', 'Ruined Market', 'Ruined Market']);
    expect(game.alice.buys).toBe(3);
  });
});
