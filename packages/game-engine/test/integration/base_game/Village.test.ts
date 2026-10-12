import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Village', () => {
  it('still gives +2 Actions when there is no card to draw', async () => {
    const game = createGame({ kingdom: ['Village'] });
    game.alice.setHand(['Village', 'Copper']);

    await game.start();
    await game.playAction('Village');

    expect(game.alice.hand).toEqual(['Copper']);
    expect(game.alice.actions).toBe(2);
  });
});
