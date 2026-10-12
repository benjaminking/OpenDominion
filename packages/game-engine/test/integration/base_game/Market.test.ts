import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Market', () => {
  it('still gives +1 Action, +1 Buy and +$1 when there is no card to draw', async () => {
    const game = createGame({ kingdom: ['Market'] });
    game.alice.setHand(['Market', 'Copper']);

    await game.start();
    await game.playAction('Market');

    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.actions).toBe(1);
    expect(game.alice.buys).toBe(2);
    expect(game.alice.coins).toBe(1);
  });
});
