import { describe, expect, it } from 'vitest';

import { Festival } from '../../../src/cards/base_game/Festival';
import { createCardHarness } from '../testHarness';

describe('Festival', () => {
  it('adds 2 actions, 1 buy, and 2 coins', async () => {
    const testHarness = createCardHarness();

    await new Festival(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coins).toBe(2);
  });
});
